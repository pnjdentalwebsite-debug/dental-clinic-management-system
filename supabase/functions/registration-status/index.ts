import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { email, errorResponse, preflight, requestJson, response } from "../_shared/http.ts";

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    const options = preflight(req);
    if (options) return options;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);

    try {
      const payload = await requestJson(req);
      const ownerEmail = email(payload.ownerEmail);
      const { data: registration, error } = await ctx.supabaseAdmin
        .from('registrations')
        .select('payment_status, registration_status, provisioned_at')
        .eq('owner_email', ownerEmail)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error('Unable to check registration status.');
      if (!registration) return response(req, { state: 'not_found' });
      if (registration.provisioned_at && registration.payment_status === 'approved') return response(req, { state: 'account_ready' });
      if (registration.registration_status === 'rejected') return response(req, { state: 'rejected' });
      if (registration.payment_status === 'pending_verification') return response(req, { state: 'payment_under_review' });
      return response(req, { state: 'payment_pending' });
    } catch (error) {
      return errorResponse(req, error instanceof Error ? error.message : 'Unable to check registration status.');
    }
  }),
};
