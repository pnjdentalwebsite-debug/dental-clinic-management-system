import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { errorResponse, preflight, requestJson, response, uuid } from '../_shared/http.ts';
import { platformAdminErrorResponse, PlatformAdminApiError, requirePlatformAdmin } from '../_shared/platform-admin.ts';
import { toReviewDetail } from '../_shared/registration-review.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const options = preflight(req);
    if (options) return options;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);

    try {
      await requirePlatformAdmin(ctx);
      const payload = await requestJson(req);
      const registrationId = uuid(payload.registrationId, 'registrationId');
      const { data, error } = await ctx.supabaseAdmin
        .from('registrations')
        .select('id, registration_number, owner_name, owner_email, owner_mobile, owner_address, owner_city, owner_province, owner_postal_code, clinic_name, clinic_email, clinic_mobile, clinic_address, clinic_city, clinic_province, clinic_postal_code, dentist_count, staff_count, location_count, works_with_laboratory, laboratory_name, registration_status, payment_status, email_verified_at, billing_cycle, submitted_at, created_at, plans(plan_code, name, monthly_amount_centavos, annual_amount_centavos), payments(id, payment_method, reference_number, amount_centavos, status, submitted_at, reviewed_at, notes)')
        .eq('id', registrationId)
        .maybeSingle();
      if (error) throw new PlatformAdminApiError('REVIEW_QUERY_FAILED', 503, 'Review details are temporarily unavailable.');
      if (!data) throw new PlatformAdminApiError('NOT_FOUND', 404, 'The requested review record was not found.');
      return response(req, { registration: toReviewDetail(data as any) });
    } catch (error) {
      return platformAdminErrorResponse(req, error, 'Unable to load registration review details.');
    }
  }),
};
