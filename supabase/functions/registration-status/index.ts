import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { email, errorResponse, preflight, requestJson, response, uuid } from "../_shared/http.ts";

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    const options = preflight(req);
    if (options) return options;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);

    try {
      const payload = await requestJson(req);
      const registrationId = uuid(payload.registrationId, 'registrationId');
      const ownerEmail = email(payload.ownerEmail);
      const { data: registration, error } = await ctx.supabaseAdmin
        .from('registrations')
        .select('registration_number, clinic_name, email_verified_at, payment_status, registration_status, plans(plan_code, name)')
        .eq('id', registrationId)
        .eq('owner_email', ownerEmail)
        .maybeSingle();
      if (error) throw new Error('Unable to check registration status.');
      if (!registration) return errorResponse(req, 'Registration status is unavailable.', 404);
      const plan = registration.plans as { plan_code: string; name: string } | null;
      return response(req, {
        registrationNumber: registration.registration_number,
        clinicName: registration.clinic_name,
        emailVerified: registration.email_verified_at !== null,
        paymentStatus: registration.payment_status,
        registrationStatus: registration.registration_status,
        plan: plan ? { code: plan.plan_code, name: plan.name } : null,
      });
    } catch (error) {
      return errorResponse(req, error instanceof Error ? error.message : 'Unable to check registration status.');
    }
  }),
};
