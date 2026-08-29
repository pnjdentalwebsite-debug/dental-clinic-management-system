import { requireSupabaseClient } from './client';

export interface FirstLoginMembership {
  membershipId: string;
  role: string;
  accountStatus: string;
  mustChangePassword: boolean;
}

export interface FirstLoginState {
  memberships: FirstLoginMembership[];
  activeClinicOwnerMembershipCount: number;
  hasMultipleActiveClinicOwnerMemberships: boolean;
}

export interface ClinicOwnerScope {
  membershipId: string;
  subscriberId: string;
}

export type ClinicOwnerAccess =
  | { kind: 'signed_out' }
  | { kind: 'loading' }
  | { kind: 'password_change_required'; email: string; membership: FirstLoginMembership }
  | { kind: 'ready'; email: string; scope: ClinicOwnerScope }
  | {
      kind: 'error';
      code:
        | 'AUTH_CONFIGURATION_REQUIRED'
        | 'INVALID_CREDENTIALS'
        | 'SESSION_UNAVAILABLE'
        | 'FIRST_LOGIN_STATE_UNAVAILABLE'
        | 'NO_ACTIVE_CLINIC_OWNER_MEMBERSHIP'
        | 'MULTIPLE_ACTIVE_CLINIC_OWNER_MEMBERSHIPS'
        | 'TENANT_SCOPE_UNAVAILABLE';
      message: string;
    };

type AuthClient = ReturnType<typeof requireSupabaseClient>;

const passwordHasLetter = (value: string) => /\p{L}/u.test(value);
const passwordHasNumber = (value: string) => /\p{N}/u.test(value);

export function validateInitialPassword(password: string): string | null {
  if (password.length < 12 || password.length > 256) {
    return 'Use 12 to 256 characters.';
  }
  if (!passwordHasLetter(password) || !passwordHasNumber(password)) {
    return 'Include at least one letter and one number.';
  }
  return null;
}

function isFirstLoginMembership(value: unknown): value is FirstLoginMembership {
  if (!value || typeof value !== 'object') return false;
  const membership = value as Record<string, unknown>;
  return typeof membership.membershipId === 'string'
    && typeof membership.role === 'string'
    && typeof membership.accountStatus === 'string'
    && typeof membership.mustChangePassword === 'boolean';
}

function parseFirstLoginState(value: unknown): FirstLoginState | null {
  if (!value || typeof value !== 'object') return null;
  const state = value as Record<string, unknown>;
  if (!Array.isArray(state.memberships)
    || !state.memberships.every(isFirstLoginMembership)
    || typeof state.activeClinicOwnerMembershipCount !== 'number'
    || typeof state.hasMultipleActiveClinicOwnerMemberships !== 'boolean') {
    return null;
  }
  return {
    memberships: state.memberships,
    activeClinicOwnerMembershipCount: state.activeClinicOwnerMembershipCount,
    hasMultipleActiveClinicOwnerMemberships: state.hasMultipleActiveClinicOwnerMemberships,
  };
}

function activeClinicOwnerMembership(state: FirstLoginState): FirstLoginMembership | null {
  const activeOwners = state.memberships.filter((membership) => (
    membership.role === 'clinic_owner' && membership.accountStatus === 'active'
  ));
  return activeOwners.length === 1 ? activeOwners[0] : null;
}

async function resolveScope(
  client: AuthClient,
  membership: FirstLoginMembership,
): Promise<ClinicOwnerScope | null> {
  const { data, error } = await client
    .from('subscriber_memberships')
    .select('id, subscriber_id, role, account_status')
    .eq('id', membership.membershipId)
    .eq('role', 'clinic_owner')
    .eq('account_status', 'active')
    .maybeSingle();
  if (error || !data || typeof data.subscriber_id !== 'string') return null;
  return { membershipId: membership.membershipId, subscriberId: data.subscriber_id };
}

export async function resolveClinicOwnerAccess(
  client: AuthClient = requireSupabaseClient(),
): Promise<ClinicOwnerAccess> {
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  const session = sessionData.session;
  if (sessionError || !session?.user?.email) {
    return sessionError
      ? { kind: 'error', code: 'SESSION_UNAVAILABLE', message: 'Your sign-in session is unavailable. Please sign in again.' }
      : { kind: 'signed_out' };
  }

  const { data, error } = await client.rpc('get_my_first_login_state');
  const firstLoginState = parseFirstLoginState(data);
  if (error || !firstLoginState) {
    return { kind: 'error', code: 'FIRST_LOGIN_STATE_UNAVAILABLE', message: 'Your Clinic Owner access state is temporarily unavailable.' };
  }
  if (firstLoginState.hasMultipleActiveClinicOwnerMemberships
    || firstLoginState.activeClinicOwnerMembershipCount > 1) {
    return { kind: 'error', code: 'MULTIPLE_ACTIVE_CLINIC_OWNER_MEMBERSHIPS', message: 'Your account has multiple active Clinic Owner memberships. Please contact platform support.' };
  }
  if (firstLoginState.activeClinicOwnerMembershipCount !== 1) {
    return { kind: 'error', code: 'NO_ACTIVE_CLINIC_OWNER_MEMBERSHIP', message: 'Your account does not have an active Clinic Owner membership.' };
  }

  const membership = activeClinicOwnerMembership(firstLoginState);
  if (!membership) {
    return { kind: 'error', code: 'NO_ACTIVE_CLINIC_OWNER_MEMBERSHIP', message: 'Your Clinic Owner membership could not be resolved safely.' };
  }
  if (membership.mustChangePassword) {
    return { kind: 'password_change_required', email: session.user.email, membership };
  }

  const scope = await resolveScope(client, membership);
  if (!scope) {
    return { kind: 'error', code: 'TENANT_SCOPE_UNAVAILABLE', message: 'Your Clinic Owner tenant scope is unavailable. Please contact platform support.' };
  }
  return { kind: 'ready', email: session.user.email, scope };
}

export async function signInClinicOwner(
  email: string,
  password: string,
  client: AuthClient = requireSupabaseClient(),
): Promise<ClinicOwnerAccess> {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return { kind: 'error', code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect. Please try again.' };
  }
  return resolveClinicOwnerAccess(client);
}

async function functionErrorCode(error: unknown): Promise<string | null> {
  const context = (error as { context?: Response } | null)?.context;
  if (!context) return null;
  const payload = await context.clone().json().catch(() => null) as { error?: { code?: unknown } } | null;
  return typeof payload?.error?.code === 'string' ? payload.error.code : null;
}

export async function completeClinicOwnerInitialPassword(
  newPassword: string,
  client: AuthClient = requireSupabaseClient(),
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  const { data, error } = await client.functions.invoke<{ completed?: unknown; mustChangePassword?: unknown }>(
    'complete-initial-password',
    { body: { newPassword } },
  );
  if (error) {
    const code = await functionErrorCode(error);
    const messages: Record<string, string> = {
      INITIAL_PASSWORD_ALREADY_COMPLETED: 'Your initial password was already completed. Refreshing your access state is required.',
      NO_ACTIVE_CLINIC_OWNER_MEMBERSHIP: 'Your account does not have an active Clinic Owner membership.',
      MULTIPLE_ACTIVE_CLINIC_OWNER_MEMBERSHIPS: 'Your account has multiple active Clinic Owner memberships. Please contact platform support.',
      INVALID_PASSWORD: 'Your password does not meet the required policy.',
    };
    return { ok: false, code: code ?? 'INITIAL_PASSWORD_UPDATE_FAILED', message: messages[code ?? ''] ?? 'Unable to update your password. Please try again.' };
  }
  if (data?.completed !== true || data.mustChangePassword !== false) {
    return { ok: false, code: 'INITIAL_PASSWORD_UPDATE_FAILED', message: 'Password completion could not be confirmed.' };
  }
  return { ok: true };
}

export async function signOutClinicOwner(client: AuthClient = requireSupabaseClient()): Promise<void> {
  await client.auth.signOut();
}
