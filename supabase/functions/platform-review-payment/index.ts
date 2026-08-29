import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { errorResponse, optionalText, preflight, requestJson, response, text, uuid } from '../_shared/http.ts';
import { platformAdminErrorResponse, PlatformAdminApiError, requirePlatformAdmin, rpcDomainError } from '../_shared/platform-admin.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const options = preflight(req);
    if (options) return options;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);

    try {
      const actorId = await requirePlatformAdmin(ctx);
      const payload = await requestJson(req);
      const registrationId = uuid(payload.registrationId, 'registrationId');
      const paymentId = uuid(payload.paymentId, 'paymentId');
      const decision = text(payload.decision, 'Decision', 10).toLowerCase();
      if (decision !== 'approve' && decision !== 'reject') {
        throw new PlatformAdminApiError('INVALID_DECISION', 422, 'Decision must be approve or reject.');
      }
      const reason = optionalText(payload.reason, 1000);
      if (decision === 'reject' && !reason) {
        throw new PlatformAdminApiError('REJECTION_REASON_REQUIRED', 422, 'A rejection reason is required.');
      }
      const { data, error } = await (ctx.supabaseAdmin as any).rpc('review_registration_payment_atomic', {
        p_registration_id: registrationId,
        p_payment_id: paymentId,
        p_platform_admin_user_id: actorId,
        p_decision: decision,
        p_reason: decision === 'reject' ? reason : null,
      });
      if (error || !data?.[0]) throw rpcDomainError(error, 'Payment review could not be completed.');
      const review = data[0] as { payment_id: string; payment_status: string; registration_status: string; reviewed_at: string };
      return response(req, {
        payment: {
          id: review.payment_id,
          status: review.payment_status,
          reviewedAt: review.reviewed_at,
        },
        registration: {
          id: registrationId,
          status: review.registration_status,
        },
      });
    } catch (error) {
      return platformAdminErrorResponse(req, error, 'Unable to review this payment.');
    }
  }),
};
