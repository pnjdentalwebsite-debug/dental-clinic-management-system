import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { email, errorResponse, preflight, requestJson, response, text, uuid } from "../_shared/http.ts";

async function otpHash(registrationId: string, ownerEmail: string, code: string): Promise<string> {
  const pepper = Deno.env.get('REGISTRATION_OTP_PEPPER');
  if (!pepper || pepper.length < 32) throw new Error('Registration OTP security is not configured.');
  const input = new TextEncoder().encode(`${pepper}:${registrationId}:${ownerEmail}:${code}`);
  const digest = await crypto.subtle.digest('SHA-256', input);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    const options = preflight(req);
    if (options) return options;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);
    try {
      const payload = await requestJson(req);
      const registrationId = uuid(payload.registrationId, 'registrationId');
      const ownerEmail = email(payload.ownerEmail);
      const code = text(payload.otp, 'Verification code', 6);
      if (!/^\d{6}$/.test(code)) return errorResponse(req, 'Verification failed.', 400);
      const hash = await otpHash(registrationId, ownerEmail, code);
      const { data, error } = await ctx.supabaseAdmin.rpc('verify_registration_email_otp', {
        p_registration_id: registrationId, p_owner_email: ownerEmail, p_otp_hash: hash,
      });
      if (error || !data?.[0]) return errorResponse(req, 'Verification failed.', 400);
      return response(req, { verified: true, emailVerifiedAt: data[0].verified_at, registrationStatus: data[0].registration_status });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not configured')) return errorResponse(req, error.message, 503);
      return errorResponse(req, 'Verification failed.', 400);
    }
  }),
};
