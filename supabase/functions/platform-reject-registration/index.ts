import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { errorResponse, preflight, requestJson, response, text, uuid } from '../_shared/http.ts';
import { platformAdminErrorResponse, requirePlatformAdmin, rpcDomainError } from '../_shared/platform-admin.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const options = preflight(req);
    if (options) return options;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);

    try {
      const actorId = await requirePlatformAdmin(ctx);
      const payload = await requestJson(req);
      const registrationId = uuid(payload.registrationId, 'registrationId');
      const reason = text(payload.reason, 'Rejection reason', 1000);
      const { data, error } = await (ctx.supabaseAdmin as any).rpc('reject_registration_atomic', {
        p_registration_id: registrationId,
        p_platform_admin_user_id: actorId,
        p_reason: reason,
      });
      if (error || !data?.[0]) throw rpcDomainError(error, 'Registration rejection could not be completed.');
      const registration = data[0] as { registration_id: string; registration_status: string; payment_status: string; reviewed_at: string };
      return response(req, {
        registration: {
          id: registration.registration_id,
          status: registration.registration_status,
          paymentStatus: registration.payment_status,
          reviewedAt: registration.reviewed_at,
        },
      });
    } catch (error) {
      return platformAdminErrorResponse(req, error, 'Unable to reject this registration.');
    }
  }),
};
