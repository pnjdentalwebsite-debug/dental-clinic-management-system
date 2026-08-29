import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { errorResponse, preflight, randomPassword, requestJson, response } from "../_shared/http.ts";
import { sendInitialClinicOwnerCredentialEmail } from '../_shared/registration-email.ts';
import { platformAdminErrorResponse, PlatformAdminApiError, requirePlatformAdmin } from '../_shared/platform-admin.ts';
import {
  getAuthUserById,
  loadProvisioningAttempt,
  normalizeEmail,
  recordCredentialDelivery,
  registrationIdOnly,
} from '../_shared/platform-provisioning.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const options = preflight(req);
    if (options) return options;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);

    let temporaryPassword: string | null = null;
    try {
      const actorId = await requirePlatformAdmin(ctx);
      const admin = ctx.supabaseAdmin as any;
      const payload = await requestJson(req);
      const registrationId = registrationIdOnly(payload);
      let attempt = await loadProvisioningAttempt(admin, registrationId);
      if (!['database_provisioned', 'completed'].includes(attempt.status)) {
        throw new PlatformAdminApiError('PROVISIONING_NOT_COMPLETED', 409, 'Tenant provisioning must complete before credentials can be resent.');
      }
      if (!attempt.auth_user_id || !attempt.auth_user_created_by_attempt || !attempt.subscriber_id) {
        throw new PlatformAdminApiError('CREDENTIAL_RESEND_NOT_ALLOWED', 409, 'This registration is not eligible for automatic credential delivery.');
      }

      const [registrationResult, profileResult, membershipResult] = await Promise.all([
        admin.from('registrations')
          .select('id, owner_email, provisioned_at')
          .eq('id', registrationId)
          .single(),
        admin.from('profiles')
          .select('id, email')
          .eq('id', attempt.auth_user_id)
          .single(),
        admin.from('subscriber_memberships')
          .select('id, subscriber_id, user_id, role, account_status')
          .eq('subscriber_id', attempt.subscriber_id)
          .eq('user_id', attempt.auth_user_id)
          .eq('role', 'clinic_owner')
          .eq('account_status', 'active')
          .maybeSingle(),
      ]);
      if (registrationResult.error || profileResult.error || membershipResult.error || !membershipResult.data) {
        throw new PlatformAdminApiError('CREDENTIAL_RESEND_NOT_ALLOWED', 409, 'Active Clinic Owner identity could not be verified.');
      }
      if (!registrationResult.data.provisioned_at) {
        throw new PlatformAdminApiError('PROVISIONING_NOT_COMPLETED', 409, 'Tenant provisioning must complete before credentials can be resent.');
      }

      const authUser = await getAuthUserById(admin, attempt.auth_user_id);
      if (!authUser.email_confirmed_at) {
        throw new PlatformAdminApiError('CREDENTIAL_RESEND_NOT_ALLOWED', 409, 'The Clinic Owner Auth email is not confirmed.');
      }
      const ownerEmail = normalizeEmail(registrationResult.data.owner_email);
      if (
        ownerEmail !== attempt.owner_email_normalized
        || normalizeEmail(profileResult.data.email) !== ownerEmail
        || normalizeEmail(authUser.email ?? '') !== ownerEmail
      ) {
        throw new PlatformAdminApiError('PROVISIONING_EMAIL_CONFLICT', 409, 'Registration, profile, and Auth emails do not match.');
      }

      const { data: pendingAttempt, error: pendingError } = await admin
        .from('registration_provisioning_attempts')
        .update({ credential_delivery_status: 'pending', credential_sent_at: null, failure_code: null })
        .eq('id', attempt.id)
        .in('status', ['database_provisioned', 'completed'])
        .select('id')
        .maybeSingle();
      if (pendingError || !pendingAttempt) {
        throw new PlatformAdminApiError('CREDENTIAL_STATE_PERSIST_FAILED', 503, 'Credential delivery state could not be prepared.');
      }

      temporaryPassword = randomPassword();
      const { error: passwordError } = await admin.auth.admin.updateUserById(attempt.auth_user_id, {
        password: temporaryPassword,
      });
      if (passwordError) {
        attempt = await recordCredentialDelivery(
          admin,
          attempt,
          actorId,
          'failed',
          'AUTH_TEMPORARY_PASSWORD_ROTATION_FAILED',
        );
        throw new PlatformAdminApiError('AUTH_IDENTITY_UPDATE_FAILED', 503, 'The temporary credential could not be rotated.');
      }

      const { data: updatedMembership, error: membershipError } = await admin
        .from('subscriber_memberships')
        .update({ must_change_password: true, password_changed_at: null })
        .eq('id', membershipResult.data.id)
        .eq('user_id', attempt.auth_user_id)
        .eq('role', 'clinic_owner')
        .eq('account_status', 'active')
        .select('id')
        .maybeSingle();
      if (membershipError || !updatedMembership) {
        attempt = await recordCredentialDelivery(
          admin,
          attempt,
          actorId,
          'failed',
          'PASSWORD_CHANGE_STATE_UPDATE_FAILED',
        );
        throw new PlatformAdminApiError('PASSWORD_CHANGE_STATE_UPDATE_FAILED', 503, 'The first-login password state could not be prepared.');
      }

      let deliveryStatus: 'sent' | 'failed' = 'sent';
      let deliveryCode: string | undefined;
      try {
        await sendInitialClinicOwnerCredentialEmail({ to: ownerEmail, temporaryPassword });
      } catch {
        deliveryStatus = 'failed';
        deliveryCode = 'INITIAL_CREDENTIAL_DELIVERY_FAILED';
      } finally {
        temporaryPassword = null;
      }
      attempt = await recordCredentialDelivery(admin, attempt, actorId, deliveryStatus, deliveryCode);
      return response(req, {
        registrationId,
        provisioningStatus: 'completed',
        credentialDelivery: {
          status: attempt.credential_delivery_status,
          ...(attempt.failure_code ? { code: attempt.failure_code } : {}),
        },
      });
    } catch (error) {
      temporaryPassword = null;
      return platformAdminErrorResponse(req, error, 'Unable to resend the initial credential.');
    }
  }),
};
