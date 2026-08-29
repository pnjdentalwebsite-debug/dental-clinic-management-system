import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { errorResponse, preflight, randomPassword, requestJson, response } from "../_shared/http.ts";
import { sendInitialClinicOwnerCredentialEmail } from '../_shared/registration-email.ts';
import { platformAdminErrorResponse, PlatformAdminApiError, requirePlatformAdmin } from '../_shared/platform-admin.ts';
import {
  findAuthUserByEmail,
  getAuthUserById,
  hasSubscriberMembership,
  loadProvisioningAttempt,
  loadSafeProvisionedScope,
  normalizeEmail,
  provisioningRpcError,
  recordCredentialDelivery,
  registrationIdOnly,
  type ProvisioningAttemptRow,
} from '../_shared/platform-provisioning.ts';

const SAFE_FAILURE = {
  authCreate: 'AUTH_IDENTITY_CREATE_FAILED',
  authRecord: 'AUTH_IDENTITY_RECORD_FAILED',
  authRotate: 'AUTH_TEMPORARY_PASSWORD_ROTATION_FAILED',
  database: 'DATABASE_PROVISIONING_FAILED',
  delivery: 'INITIAL_CREDENTIAL_DELIVERY_FAILED',
} as const;

async function failAttempt(admin: any, attemptId: string, actorId: string, failureCode: string): Promise<void> {
  await admin.rpc('fail_registration_provisioning_attempt', {
    p_provisioning_attempt_id: attemptId,
    p_platform_admin_user_id: actorId,
    p_failure_code: failureCode,
  });
}

async function recordCreatedIdentity(admin: any, attempt: ProvisioningAttemptRow, userId: string): Promise<void> {
  const { data, error } = await admin
    .from('registration_provisioning_attempts')
    .update({ auth_user_id: userId, auth_user_created_by_attempt: true })
    .eq('id', attempt.id)
    .eq('registration_id', attempt.registration_id)
    .eq('status', 'claimed')
    .is('auth_user_id', null)
    .select('id')
    .maybeSingle();
  if (error || !data) {
    throw new PlatformAdminApiError('AUTH_IDENTITY_RECORD_FAILED', 409, 'The Auth identity could not be bound to this provisioning attempt.');
  }
}

async function compensateCreatedIdentity(admin: any, attemptId: string, userId: string): Promise<boolean> {
  const { data: attempt } = await admin
    .from('registration_provisioning_attempts')
    .select('id, status, auth_user_id, auth_user_created_by_attempt')
    .eq('id', attemptId)
    .maybeSingle();
  if (!attempt || attempt.status !== 'claimed' || attempt.auth_user_id !== userId || !attempt.auth_user_created_by_attempt) {
    return false;
  }
  if (await hasSubscriberMembership(admin, userId)) return false;

  const { data: cleared, error: clearError } = await admin
    .from('registration_provisioning_attempts')
    .update({ auth_user_id: null, auth_user_created_by_attempt: false })
    .eq('id', attemptId)
    .eq('status', 'claimed')
    .eq('auth_user_id', userId)
    .eq('auth_user_created_by_attempt', true)
    .select('id')
    .maybeSingle();
  if (clearError || !cleared) return false;

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (!deleteError) return true;

  // Preserve ledger ownership if Auth compensation could not complete.
  await admin
    .from('registration_provisioning_attempts')
    .update({ auth_user_id: userId, auth_user_created_by_attempt: true })
    .eq('id', attemptId)
    .eq('status', 'claimed')
    .is('auth_user_id', null);
  return false;
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const options = preflight(req);
    if (options) return options;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);

    let activeAttempt: ProvisioningAttemptRow | null = null;
    let actorId: string | null = null;
    let createdByThisInvocation = false;
    let ownerUserId: string | null = null;
    let temporaryPassword: string | null = null;

    try {
      actorId = await requirePlatformAdmin(ctx);
      const admin = ctx.supabaseAdmin as any;
      const payload = await requestJson(req);
      const registrationId = registrationIdOnly(payload);

      const { data: registration, error: registrationError } = await admin
        .from('registrations')
        .select('id, registration_number, owner_email, owner_name')
        .eq('id', registrationId)
        .single();
      if (registrationError || !registration) {
        throw new PlatformAdminApiError('REGISTRATION_UNAVAILABLE', 503, 'Registration identity data is unavailable.');
      }
      const ownerEmail = normalizeEmail(registration.owner_email);
      const authIdentityBeforeClaim = await findAuthUserByEmail(admin, ownerEmail);

      const { data: priorAttempt } = await admin
        .from('registration_provisioning_attempts')
        .select('id, status')
        .eq('registration_id', registrationId)
        .maybeSingle();

      const { data: beginData, error: beginError } = await admin.rpc('begin_registration_provisioning', {
        p_registration_id: registrationId,
        p_platform_admin_user_id: actorId,
      });
      if (beginError || !beginData?.[0]) {
        throw provisioningRpcError(beginError, 'Registration is not eligible for provisioning.');
      }

      activeAttempt = await loadProvisioningAttempt(admin, registrationId);
      if (activeAttempt.status === 'database_provisioned' || activeAttempt.status === 'completed') {
        return response(req, await loadSafeProvisionedScope(admin, registrationId, activeAttempt));
      }
      if (priorAttempt?.status === 'claimed') {
        throw new PlatformAdminApiError('PROVISIONING_IN_PROGRESS', 409, 'Provisioning is already in progress for this registration.');
      }
      if (activeAttempt.status !== 'claimed') {
        throw new PlatformAdminApiError('PROVISIONING_STATE_CONFLICT', 409, 'Provisioning is not currently claimable.');
      }

      if (ownerEmail !== activeAttempt.owner_email_normalized) {
        throw new PlatformAdminApiError('PROVISIONING_EMAIL_CONFLICT', 409, 'Registration and provisioning identity emails do not match.');
      }

      if (activeAttempt.auth_user_id) {
        if (!activeAttempt.auth_user_created_by_attempt) {
          throw new PlatformAdminApiError('EXISTING_UNASSIGNED_IDENTITY', 409, 'An existing unassigned Auth identity requires explicit linking.');
        }
        const recordedUser = await getAuthUserById(admin, activeAttempt.auth_user_id);
        if (normalizeEmail(recordedUser.email ?? '') !== ownerEmail) {
          throw new PlatformAdminApiError('PROVISIONING_EMAIL_CONFLICT', 409, 'The recorded Auth identity does not match this registration.');
        }
        if (await hasSubscriberMembership(admin, recordedUser.id)) {
          throw new PlatformAdminApiError('IDENTITY_ALREADY_ASSIGNED', 409, 'The Auth identity is already assigned to a subscriber.');
        }
        ownerUserId = recordedUser.id;
        temporaryPassword = randomPassword();
        const { error: rotateError } = await admin.auth.admin.updateUserById(ownerUserId, {
          password: temporaryPassword,
        });
        if (rotateError) {
          await failAttempt(admin, activeAttempt.id, actorId, SAFE_FAILURE.authRotate);
          throw new PlatformAdminApiError('AUTH_IDENTITY_UPDATE_FAILED', 503, 'The attempt-owned Auth identity could not be prepared.');
        }
      } else {
        const existingUser = authIdentityBeforeClaim ?? await findAuthUserByEmail(admin, ownerEmail);
        if (existingUser) {
          if (!authIdentityBeforeClaim) {
            throw new PlatformAdminApiError('PROVISIONING_IN_PROGRESS', 409, 'Another provisioning invocation is resolving this Auth identity.');
          }
          const assigned = await hasSubscriberMembership(admin, existingUser.id);
          await failAttempt(
            admin,
            activeAttempt.id,
            actorId,
            assigned ? 'IDENTITY_ALREADY_ASSIGNED' : 'EXISTING_UNASSIGNED_IDENTITY',
          );
          throw new PlatformAdminApiError(
            assigned ? 'IDENTITY_ALREADY_ASSIGNED' : 'EXISTING_UNASSIGNED_IDENTITY',
            409,
            assigned
              ? 'The Auth identity is already assigned to another subscriber.'
              : 'An existing unassigned Auth identity requires explicit linking.',
          );
        }

        temporaryPassword = randomPassword();
        const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
          email: ownerEmail,
          password: temporaryPassword,
          email_confirm: true,
          app_metadata: { pnj_role: 'clinic_owner' },
          user_metadata: { display_name: registration.owner_name },
        });
        if (createUserError || !createdUser.user) {
          const racedAttempt = await loadProvisioningAttempt(admin, registrationId);
          const racedUser = await findAuthUserByEmail(admin, ownerEmail);
          if (
            racedAttempt.status === 'database_provisioned'
            || racedAttempt.status === 'completed'
          ) {
            return response(req, await loadSafeProvisionedScope(admin, registrationId, racedAttempt));
          }
          if (
            racedUser
            && racedAttempt.status === 'claimed'
            && (
              racedAttempt.auth_user_id === null
              || (
                racedAttempt.auth_user_id === racedUser.id
                && racedAttempt.auth_user_created_by_attempt
              )
            )
          ) {
            throw new PlatformAdminApiError('PROVISIONING_IN_PROGRESS', 409, 'Another provisioning invocation is resolving this Auth identity.');
          }
          await failAttempt(admin, activeAttempt.id, actorId, SAFE_FAILURE.authCreate);
          throw new PlatformAdminApiError('AUTH_IDENTITY_CREATE_FAILED', 409, 'The clinic owner Auth identity could not be created.');
        }
        const createdOwnerUserId = createdUser.user.id;
        ownerUserId = createdOwnerUserId;
        createdByThisInvocation = true;
        try {
          await recordCreatedIdentity(admin, activeAttempt, createdOwnerUserId);
        } catch (error) {
          await admin.auth.admin.deleteUser(createdOwnerUserId);
          await failAttempt(admin, activeAttempt.id, actorId, SAFE_FAILURE.authRecord);
          throw error;
        }
      }

      const { data: provisioned, error: provisionError } = await admin.rpc('approve_registration_provisioning', {
        p_registration_id: registrationId,
        p_provisioning_attempt_id: activeAttempt.id,
        p_owner_user_id: ownerUserId,
        p_actor_user_id: actorId,
      });
      if (provisionError || !provisioned?.[0]) {
        const afterRpc = await loadProvisioningAttempt(admin, registrationId);
        if (afterRpc.status !== 'database_provisioned' && afterRpc.status !== 'completed') {
          if (createdByThisInvocation && ownerUserId) {
            await compensateCreatedIdentity(admin, activeAttempt.id, ownerUserId);
          }
          await failAttempt(admin, activeAttempt.id, actorId, SAFE_FAILURE.database);
          throw provisioningRpcError(provisionError, 'Tenant provisioning could not be completed.');
        }
        activeAttempt = afterRpc;
      } else {
        activeAttempt = await loadProvisioningAttempt(admin, registrationId);
      }

      let deliveryStatus: 'sent' | 'failed' = 'sent';
      let deliveryCode: string | undefined;
      try {
        if (!temporaryPassword) throw new Error('Credential material is unavailable.');
        await sendInitialClinicOwnerCredentialEmail({ to: ownerEmail, temporaryPassword });
      } catch {
        deliveryStatus = 'failed';
        deliveryCode = SAFE_FAILURE.delivery;
      } finally {
        temporaryPassword = null;
      }

      try {
        activeAttempt = await recordCredentialDelivery(
          admin,
          activeAttempt,
          actorId,
          deliveryStatus,
          deliveryCode,
        );
      } catch {
        const safeScope = await loadSafeProvisionedScope(admin, registrationId, activeAttempt);
        safeScope.credentialDelivery = { status: 'failed', code: 'CREDENTIAL_STATE_PERSIST_FAILED' };
        return response(req, safeScope);
      }
      return response(req, await loadSafeProvisionedScope(admin, registrationId, activeAttempt));
    } catch (error) {
      temporaryPassword = null;
      return platformAdminErrorResponse(req, error, 'Unable to approve and provision this registration.');
    }
  }),
};
