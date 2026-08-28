import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { errorResponse, optionalText, preflight, requestJson, response, text, uuid } from "../_shared/http.ts";

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    const options = preflight(req);
    if (options) return options;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);

    try {
      const payload = await requestJson(req);
      const registrationId = uuid(payload.registrationId, 'registrationId');
      const paymentMethod = text(payload.paymentMethod, 'Payment method', 80);
      const referenceNumber = optionalText(payload.referenceNumber, 160);
      const { data: registration, error: registrationError } = await ctx.supabaseAdmin
        .from('registrations')
        .select('id, plan_id, billing_cycle, payment_status, registration_status, plans(monthly_amount_centavos, annual_amount_centavos)')
        .eq('id', registrationId)
        .maybeSingle();
      if (registrationError) throw new Error('Unable to locate the registration.');
      if (!registration || !registration.plan_id) return errorResponse(req, 'Registration was not found.', 404);
      if (registration.payment_status === 'approved') return errorResponse(req, 'This registration is already approved.', 409);
      if (!['pending_payment', 'pending_review'].includes(registration.registration_status)) {
        return errorResponse(req, 'This registration is not ready for payment submission.', 409);
      }
      const plan = registration.plans as { monthly_amount_centavos: number; annual_amount_centavos: number | null } | null;
      if (!plan) throw new Error('The registration plan is unavailable.');
      const amountCentavos = registration.billing_cycle === 'annual'
        ? (plan.annual_amount_centavos ?? plan.monthly_amount_centavos * 12)
        : plan.monthly_amount_centavos;
      const { data: payment, error: paymentError } = await ctx.supabaseAdmin
        .from('payments')
        .insert({
          registration_id: registrationId,
          payment_method: paymentMethod,
          reference_number: referenceNumber,
          amount_centavos: amountCentavos,
          status: 'pending_verification',
        })
        .select('id, status, amount_centavos, submitted_at')
        .single();
      if (paymentError || !payment) throw new Error(paymentError?.message ?? 'Unable to submit payment.');
      const { error: updateError } = await ctx.supabaseAdmin
        .from('registrations')
        .update({ payment_status: 'pending_verification', registration_status: 'pending_review' })
        .eq('id', registrationId);
      if (updateError) throw new Error(updateError.message);
      return response(req, { payment }, 201);
    } catch (error) {
      return errorResponse(req, error instanceof Error ? error.message : 'Unable to submit payment.');
    }
  }),
};
