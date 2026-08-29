import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { email, errorResponse, optionalText, preflight, requestJson, response, text } from "../_shared/http.ts";

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    const options = preflight(req);
    if (options) return options;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);

    try {
      const payload = await requestJson(req);
      const ownerEmail = email(payload.ownerEmail);
      const clinicEmail = email(payload.clinicEmail);
      const planIdentifier = text(payload.planCode ?? payload.planName, 'Plan', 120);
      const billingCycle = payload.billingCycle === 'annual' || payload.billingCycle === 'yearly' ? 'annual' : 'monthly';
      const count = (value: unknown, label: string): number | null => {
        if (value === undefined || value === null || value === '') return null;
        if (!Number.isInteger(value) || (value as number) < 0) throw new Error(`${label} must be a non-negative integer.`);
        return value as number;
      };
      const worksWithLaboratory = payload.worksWithLaboratory === true;
      const laboratoryName = optionalText(payload.laboratoryName, 180);
      if (!worksWithLaboratory && laboratoryName) throw new Error('Laboratory name requires a laboratory partnership.');

      const planByCode = await ctx.supabaseAdmin
        .from('plans')
        .select('id, plan_code, name, monthly_amount_centavos, annual_amount_centavos')
        .eq('plan_code', planIdentifier)
        .eq('status', 'active')
        .maybeSingle();
      const planByName = planByCode.data ? null : await ctx.supabaseAdmin
        .from('plans')
        .select('id, plan_code, name, monthly_amount_centavos, annual_amount_centavos')
        .ilike('name', planIdentifier)
        .eq('status', 'active')
        .maybeSingle();
      const plan = planByCode.data ?? planByName?.data;
      if (planByCode.error || planByName?.error) throw new Error('Unable to validate the selected plan.');
      if (!plan) return errorResponse(req, 'The selected plan is unavailable. Choose an active plan and try again.', 422);

      const openRegistration = await ctx.supabaseAdmin
        .from('registrations')
        .select('id, registration_number')
        .eq('owner_email', ownerEmail)
        .not('registration_status', 'in', '(rejected,cancelled)')
        .maybeSingle();
      if (openRegistration.error) throw new Error('Unable to check existing registrations.');
      if (openRegistration.data) {
        return errorResponse(req, 'An active registration already exists for this email address.', 409);
      }

      const registrationNumber = `REG-${new Date().getUTCFullYear()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
      const { data: registration, error } = await ctx.supabaseAdmin
        .from('registrations')
        .insert({
          registration_number: registrationNumber,
          plan_id: plan.id,
          billing_cycle: billingCycle,
          clinic_name: text(payload.clinicName, 'Clinic name', 180),
          clinic_email: clinicEmail,
          clinic_mobile: optionalText(payload.clinicMobile, 80),
          clinic_address: optionalText(payload.clinicAddress, 1000),
          clinic_city: optionalText(payload.clinicCity, 180),
          clinic_province: optionalText(payload.clinicProvince, 180),
          clinic_postal_code: optionalText(payload.clinicPostalCode, 40),
          dentist_count: count(payload.dentistCount, 'Dentist count'),
          staff_count: count(payload.staffCount, 'Staff count'),
          location_count: count(payload.locationCount, 'Location count'),
          works_with_laboratory: worksWithLaboratory,
          laboratory_name: worksWithLaboratory ? laboratoryName : null,
          owner_name: text(payload.ownerName, 'Owner name', 180),
          owner_email: ownerEmail,
          owner_mobile: optionalText(payload.ownerMobile, 80),
          owner_address: optionalText(payload.ownerAddress, 1000),
          owner_city: optionalText(payload.ownerCity, 180),
          owner_province: optionalText(payload.ownerProvince, 180),
          owner_postal_code: optionalText(payload.ownerPostalCode, 40),
          payment_status: 'unpaid',
          registration_status: 'pending_verification',
        })
        .select('id, registration_number, registration_status, payment_status')
        .single();
      if (error || !registration) throw new Error(error?.message ?? 'Unable to create the registration.');

      const amountCentavos = billingCycle === 'annual'
        ? (plan.annual_amount_centavos ?? plan.monthly_amount_centavos * 12)
        : plan.monthly_amount_centavos;
      return response(req, { registration, plan: { code: plan.plan_code, name: plan.name, amountCentavos } }, 201);
    } catch (error) {
      return errorResponse(req, error instanceof Error ? error.message : 'Unable to submit registration.');
    }
  }),
};
