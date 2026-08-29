import { uuid } from './http.ts';
import { PlatformAdminApiError } from './platform-admin.ts';

export type ProvisioningAttemptStatus = 'claimed' | 'database_provisioned' | 'completed' | 'failed';
export type CredentialDeliveryStatus = 'pending' | 'sent' | 'failed' | 'not_required';

export interface ProvisioningAttemptRow {
  id: string;
  registration_id: string;
  status: ProvisioningAttemptStatus;
  owner_email_normalized: string;
  auth_user_id: string | null;
  auth_user_created_by_attempt: boolean;
  subscriber_id: string | null;
  clinic_id: string | null;
  subscription_id: string | null;
  credential_delivery_status: CredentialDeliveryStatus;
  credential_sent_at: string | null;
  failure_code: string | null;
}

type AuthUser = {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
};

export interface SafeProvisionedScope {
  registrationId: string;
  registrationNumber: string;
  provisioningStatus: 'completed';
  subscriber: { id: string };
  clinic: { id: string; name: string };
  subscription: { id: string; status: string };
  owner: { userId: string; email: string };
  credentialDelivery: { status: CredentialDeliveryStatus; code?: string };
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function registrationIdOnly(payload: Record<string, unknown>): string {
  const unexpected = Object.keys(payload).filter((key) => key !== 'registrationId');
  if (unexpected.length > 0) {
    throw new PlatformAdminApiError('INVALID_REQUEST', 422, 'Only registrationId may be supplied.');
  }
  try {
    return uuid(payload.registrationId, 'registrationId');
  } catch {
    throw new PlatformAdminApiError('INVALID_REQUEST', 422, 'registrationId must be a UUID.');
  }
}

export async function loadProvisioningAttempt(admin: any, registrationId: string): Promise<ProvisioningAttemptRow> {
  const { data, error } = await admin
    .from('registration_provisioning_attempts')
    .select([
      'id',
      'registration_id',
      'status',
      'owner_email_normalized',
      'auth_user_id',
      'auth_user_created_by_attempt',
      'subscriber_id',
      'clinic_id',
      'subscription_id',
      'credential_delivery_status',
      'credential_sent_at',
      'failure_code',
    ].join(', '))
    .eq('registration_id', registrationId)
    .maybeSingle();
  if (error || !data) {
    throw new PlatformAdminApiError('PROVISIONING_ATTEMPT_UNAVAILABLE', 503, 'Provisioning state is temporarily unavailable.');
  }
  return data as ProvisioningAttemptRow;
}

export async function findAuthUserByEmail(admin: any, normalizedEmail: string): Promise<AuthUser | null> {
  const perPage = 1000;
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new PlatformAdminApiError('AUTH_IDENTITY_LOOKUP_FAILED', 503, 'Auth identity resolution is temporarily unavailable.');
    }
    const users = (data?.users ?? []) as AuthUser[];
    const match = users.find((user) => normalizeEmail(user.email ?? '') === normalizedEmail);
    if (match) return match;
    if (users.length < perPage) return null;
  }
}

export async function getAuthUserById(admin: any, userId: string): Promise<AuthUser> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data?.user) {
    throw new PlatformAdminApiError('AUTH_IDENTITY_UNAVAILABLE', 409, 'The recorded Auth identity is unavailable.');
  }
  return data.user as AuthUser;
}

export async function hasSubscriberMembership(admin: any, userId: string): Promise<boolean> {
  const { count, error } = await admin
    .from('subscriber_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) {
    throw new PlatformAdminApiError('IDENTITY_ASSIGNMENT_CHECK_FAILED', 503, 'Identity assignment could not be verified.');
  }
  return (count ?? 0) > 0;
}

export async function loadSafeProvisionedScope(
  admin: any,
  registrationId: string,
  attempt: ProvisioningAttemptRow,
): Promise<SafeProvisionedScope> {
  if (!attempt.auth_user_id || !attempt.subscriber_id || !attempt.clinic_id || !attempt.subscription_id) {
    throw new PlatformAdminApiError('PROVISIONED_SCOPE_INCOMPLETE', 409, 'The provisioned scope is incomplete.');
  }
  const [registrationResult, clinicResult, subscriptionResult] = await Promise.all([
    admin.from('registrations').select('registration_number, owner_email').eq('id', registrationId).single(),
    admin.from('clinics').select('id, name').eq('id', attempt.clinic_id).single(),
    admin.from('subscriptions').select('id, status').eq('id', attempt.subscription_id).single(),
  ]);
  if (registrationResult.error || clinicResult.error || subscriptionResult.error) {
    throw new PlatformAdminApiError('PROVISIONED_SCOPE_UNAVAILABLE', 503, 'The provisioned scope is temporarily unavailable.');
  }
  return {
    registrationId,
    registrationNumber: registrationResult.data.registration_number,
    provisioningStatus: 'completed',
    subscriber: { id: attempt.subscriber_id },
    clinic: { id: clinicResult.data.id, name: clinicResult.data.name },
    subscription: { id: subscriptionResult.data.id, status: subscriptionResult.data.status },
    owner: { userId: attempt.auth_user_id, email: normalizeEmail(registrationResult.data.owner_email) },
    credentialDelivery: {
      status: attempt.credential_delivery_status,
      ...(attempt.failure_code ? { code: attempt.failure_code } : {}),
    },
  };
}

export async function recordCredentialDelivery(
  admin: any,
  attempt: ProvisioningAttemptRow,
  actorId: string,
  status: 'sent' | 'failed',
  safeFailureCode?: string,
): Promise<ProvisioningAttemptRow> {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('registration_provisioning_attempts')
    .update({
      status: 'completed',
      credential_delivery_status: status,
      credential_sent_at: status === 'sent' ? now : null,
      failure_code: status === 'failed' ? safeFailureCode ?? 'INITIAL_CREDENTIAL_DELIVERY_FAILED' : null,
    })
    .eq('id', attempt.id)
    .in('status', ['database_provisioned', 'completed'])
    .select([
      'id', 'registration_id', 'status', 'owner_email_normalized', 'auth_user_id',
      'auth_user_created_by_attempt', 'subscriber_id', 'clinic_id', 'subscription_id',
      'credential_delivery_status', 'credential_sent_at', 'failure_code',
    ].join(', '))
    .single();
  if (error || !data) {
    throw new PlatformAdminApiError('CREDENTIAL_STATE_PERSIST_FAILED', 503, 'Credential delivery state could not be recorded.');
  }

  const eventType = status === 'sent'
    ? 'platform.initial_credential.sent'
    : 'platform.initial_credential.delivery_failed';
  const { error: auditError } = await admin.from('audit_events').insert({
    actor_user_id: actorId,
    subscriber_id: attempt.subscriber_id,
    clinic_id: attempt.clinic_id,
    event_type: eventType,
    entity_type: 'registration_provisioning_attempt',
    entity_id: attempt.id,
    metadata: {
      registration_id: attempt.registration_id,
      credential_delivery_status: status,
      ...(status === 'failed' ? { failure_code: safeFailureCode ?? 'INITIAL_CREDENTIAL_DELIVERY_FAILED' } : {}),
    },
  });
  if (auditError) {
    throw new PlatformAdminApiError('CREDENTIAL_AUDIT_FAILED', 503, 'Credential delivery audit state could not be recorded.');
  }
  return data as ProvisioningAttemptRow;
}

export function provisioningRpcError(error: unknown, fallback: string): PlatformAdminApiError {
  const message = typeof (error as { message?: unknown })?.message === 'string'
    ? (error as { message: string }).message
    : '';
  if (message.includes('was not found')) return new PlatformAdminApiError('NOT_FOUND', 404, 'Registration was not found.');
  if (message.includes('already linked to another subscriber')) {
    return new PlatformAdminApiError('IDENTITY_ALREADY_ASSIGNED', 409, 'The owner identity is already assigned to another subscriber.');
  }
  if (message.includes('not eligible') || message.includes('required for provisioning') || message.includes('does not match')) {
    return new PlatformAdminApiError('PROVISIONING_NOT_ELIGIBLE', 409, fallback);
  }
  if (message.includes('missing its completed provisioning ledger')) {
    return new PlatformAdminApiError('PROVISIONING_LEDGER_CONFLICT', 409, fallback);
  }
  return new PlatformAdminApiError('PROVISIONING_FAILED', 409, fallback);
}
