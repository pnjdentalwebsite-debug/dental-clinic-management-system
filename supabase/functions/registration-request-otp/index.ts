import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { email, errorResponse, preflight, requestJson, response, uuid } from "../_shared/http.ts";
import { sendRegistrationOtpEmail } from "../_shared/registration-email.ts";

const OTP_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

async function otpHash(registrationId: string, ownerEmail: string, code: string): Promise<string> {
  const pepper = Deno.env.get('REGISTRATION_OTP_PEPPER');
  if (!pepper || pepper.length < 32) throw new Error('Registration OTP security is not configured.');
  const input = new TextEncoder().encode(`${pepper}:${registrationId}:${ownerEmail}:${code}`);
  const digest = await crypto.subtle.digest('SHA-256', input);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function generateOtp(): string {
  const sample = new Uint32Array(1);
  crypto.getRandomValues(sample);
  return String(sample[0] % 1_000_000).padStart(6, '0');
}

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    const options = preflight(req);
    if (options) return options;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);
    try {
      const admin = ctx.supabaseAdmin as any;
      const payload = await requestJson(req);
      const registrationId = uuid(payload.registrationId, 'registrationId');
      const ownerEmail = email(payload.ownerEmail);
      const { data: registration, error: registrationError } = await admin
        .from('registrations')
        .select('id, owner_email, registration_status, email_verified_at')
        .eq('id', registrationId)
        .eq('owner_email', ownerEmail)
        .maybeSingle();
      if (registrationError || !registration || registration.email_verified_at || registration.registration_status !== 'pending_verification') {
        return errorResponse(req, 'Unable to issue a verification code.', 400);
      }

      const { data: active } = await admin
        .from('registration_email_otp_challenges')
        .select('id, resend_available_at')
        .eq('registration_id', registrationId)
        .eq('owner_email_normalized', ownerEmail)
        .is('consumed_at', null)
        .maybeSingle();
      if (active && new Date(active.resend_available_at).getTime() > Date.now()) {
        return errorResponse(req, 'Please wait before requesting another verification code.', 429);
      }
      const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
      const { count: recentCount, error: countError } = await admin
        .from('registration_email_otp_challenges')
        .select('id', { count: 'exact', head: true })
        .eq('registration_id', registrationId)
        .eq('owner_email_normalized', ownerEmail)
        .gte('created_at', oneHourAgo);
      if (countError) throw new Error('Unable to issue a verification code.');
      if ((recentCount ?? 0) >= 5) return errorResponse(req, 'Verification code request limit reached. Please try again later.', 429);

      const code = generateOtp();
      const hash = await otpHash(registrationId, ownerEmail, code);
      if (active) {
        const { error } = await admin.from('registration_email_otp_challenges')
          .update({ consumed_at: new Date().toISOString() }).eq('id', active.id);
        if (error) throw new Error('Unable to issue a verification code.');
      }
      const now = Date.now();
      const { error: insertError } = await admin.from('registration_email_otp_challenges').insert({
        registration_id: registrationId,
        owner_email_normalized: ownerEmail,
        otp_hash: hash,
        expires_at: new Date(now + OTP_TTL_MINUTES * 60_000).toISOString(),
        resend_available_at: new Date(now + RESEND_COOLDOWN_SECONDS * 1_000).toISOString(),
        max_attempts: 5,
      });
      if (insertError) throw new Error('Unable to issue a verification code.');

      try {
        await sendRegistrationOtpEmail({ to: ownerEmail, code, expiresInMinutes: OTP_TTL_MINUTES });
      } catch (deliveryError) {
        await admin.from('registration_email_otp_challenges')
          .update({ consumed_at: new Date().toISOString() })
          .eq('registration_id', registrationId).eq('owner_email_normalized', ownerEmail).is('consumed_at', null);
        throw deliveryError;
      }
      return response(req, { sent: true, expiresInSeconds: OTP_TTL_MINUTES * 60, resendAfterSeconds: RESEND_COOLDOWN_SECONDS });
    } catch (error) {
      return errorResponse(req, error instanceof Error ? error.message : 'Unable to issue a verification code.');
    }
  }),
};
