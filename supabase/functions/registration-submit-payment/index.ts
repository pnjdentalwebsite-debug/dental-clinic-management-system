import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { email, errorResponse, optionalText, preflight, requestJson, response, text, uuid } from "../_shared/http.ts";

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    const options = preflight(req);
    if (options) return options;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);

    try {
      const payload = await requestJson(req);
      const registrationId = uuid(payload.registrationId, 'registrationId');
      const ownerEmail = email(payload.ownerEmail);
      const paymentMethod = text(payload.paymentMethod, 'Payment method', 80);
      const referenceNumber = optionalText(payload.referenceNumber, 160);
      const { data, error } = await ctx.supabaseAdmin.rpc('submit_registration_payment_atomic', {
        p_registration_id: registrationId,
        p_owner_email: ownerEmail,
        p_payment_method: paymentMethod,
        p_reference_number: referenceNumber,
      });
      if (error || !data?.[0]) throw new Error(error?.message ?? 'Unable to submit payment.');
      const payment = data[0];
      return response(req, { payment: {
        id: payment.payment_id,
        status: payment.payment_status,
        amount_centavos: payment.amount_centavos,
        submitted_at: payment.submitted_at,
      } }, 201);
    } catch (error) {
      return errorResponse(req, error instanceof Error ? error.message : 'Unable to submit payment.');
    }
  }),
};
