import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { errorResponse, preflight, requestJson, response, text } from '../_shared/http.ts';
import { platformAdminErrorResponse, PlatformAdminApiError, requirePlatformAdmin } from '../_shared/platform-admin.ts';
import { toReviewListItem } from '../_shared/registration-review.ts';

const registrationStatuses = new Set(['pending_verification', 'pending_payment', 'pending_review', 'approved', 'rejected', 'cancelled']);
const paymentStatuses = new Set(['unpaid', 'pending_verification', 'approved', 'rejected', 'refunded', 'voided']);

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const options = preflight(req);
    if (options) return options;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);

    try {
      await requirePlatformAdmin(ctx);
      const payload = await requestJson(req);
      const page = payload.page === undefined ? 1 : Number(payload.page);
      const pageSize = payload.pageSize === undefined ? 25 : Number(payload.pageSize);
      if (!Number.isInteger(page) || page < 1 || page > 10000) {
        throw new PlatformAdminApiError('INVALID_PAGE', 422, 'Page must be a positive integer.');
      }
      if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
        throw new PlatformAdminApiError('INVALID_PAGE_SIZE', 422, 'Page size must be between 1 and 100.');
      }
      const registrationStatus = payload.registrationStatus === undefined
        ? 'pending_review'
        : text(payload.registrationStatus, 'Registration status', 40);
      const paymentStatus = payload.paymentStatus === undefined
        ? null
        : text(payload.paymentStatus, 'Payment status', 40);
      if (!registrationStatuses.has(registrationStatus)) {
        throw new PlatformAdminApiError('INVALID_REGISTRATION_STATUS', 422, 'Registration status filter is invalid.');
      }
      if (paymentStatus && !paymentStatuses.has(paymentStatus)) {
        throw new PlatformAdminApiError('INVALID_PAYMENT_STATUS', 422, 'Payment status filter is invalid.');
      }
      const search = payload.search === undefined ? null : text(payload.search, 'Search', 80);
      const paymentRelation = paymentStatus ? 'payments!inner' : 'payments';
      let query = ctx.supabaseAdmin
        .from('registrations')
        .select(`id, registration_number, owner_name, owner_email, owner_mobile, clinic_name, clinic_email, clinic_mobile, registration_status, payment_status, email_verified_at, billing_cycle, submitted_at, created_at, plans(plan_code, name, monthly_amount_centavos, annual_amount_centavos), ${paymentRelation}(id, payment_method, reference_number, amount_centavos, status, submitted_at, reviewed_at)`, { count: 'exact' })
        .eq('registration_status', registrationStatus)
        .order('submitted_at', { ascending: true });
      if (paymentStatus) query = query.eq('payments.status', paymentStatus);
      if (search) query = query.ilike('registration_number', `%${search.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`);
      const { data, count, error } = await query.range((page - 1) * pageSize, page * pageSize - 1);
      if (error) throw new PlatformAdminApiError('REVIEW_QUERY_FAILED', 503, 'Review records are temporarily unavailable.');
      return response(req, {
        items: (data ?? []).map((record) => toReviewListItem(record as any)),
        page,
        pageSize,
        total: count ?? 0,
      });
    } catch (error) {
      return platformAdminErrorResponse(req, error, 'Unable to load registration review records.');
    }
  }),
};
