import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { errorResponse, preflight, requestJson, response, text } from "../_shared/http.ts";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    const options = preflight(req);
    if (options) return options;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);

    try {
      const userId = ctx.userClaims?.id;
      if (!userId) return errorResponse(req, 'Authentication is required.', 401);
      const payload = await requestJson(req);
      const password = text(payload.password, 'New password', 256);
      if (password.length < 12) return errorResponse(req, 'Choose a password with at least 12 characters.', 422);
      // withSupabase already verified the request JWT. Update only that verified
      // user ID through the admin client because Edge Function contexts do not
      // retain a mutable GoTrue session for auth.updateUser().
      const { error: authError } = await ctx.supabaseAdmin.auth.admin.updateUserById(userId, { password });
      if (authError) throw new Error(authError.message);
      const { error: membershipError } = await ctx.supabaseAdmin
        .from('subscriber_memberships')
        .update({ must_change_password: false, password_changed_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('must_change_password', true);
      if (membershipError) throw new Error(membershipError.message);
      return response(req, { ok: true });
    } catch (error) {
      return errorResponse(req, error instanceof Error ? error.message : 'Unable to update password.');
    }
  }),
};
