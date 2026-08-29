import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { errorResponse, preflight, response } from "../_shared/http.ts";

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    const options = preflight(req);
    if (options) return options;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);
    try {
      const { data, error } = await ctx.supabaseAdmin
        .from('plans')
        .select('plan_code, name, monthly_amount_centavos, annual_amount_centavos, features')
        .eq('status', 'active')
        .order('monthly_amount_centavos', { ascending: true });
      if (error) throw new Error('Unable to load registration plans.');
      return response(req, {
        plans: (data ?? []).map((plan) => ({
          code: plan.plan_code,
          name: plan.name,
          features: plan.features,
          billingCycles: plan.annual_amount_centavos === null ? ['monthly'] : ['monthly', 'annual'],
          monthlyAmountCentavos: plan.monthly_amount_centavos,
          annualAmountCentavos: plan.annual_amount_centavos,
        })),
      });
    } catch (error) {
      return errorResponse(req, error instanceof Error ? error.message : 'Unable to load registration plans.');
    }
  }),
};
