import { describe, expect, it, vi } from 'vitest';
import {
  completeClinicOwnerInitialPassword,
  resolveClinicOwnerAccess,
  signInClinicOwner,
  signOutClinicOwner,
  validateInitialPassword,
} from './clinicOwnerAuth';

const membership = {
  membershipId: 'membership-1',
  role: 'clinic_owner',
  accountStatus: 'active',
  mustChangePassword: false,
};

function clientFixture(overrides: Record<string, unknown> = {}) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: { subscriber_id: 'subscriber-1' }, error: null });
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { email: 'owner@example.com' } } }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session: { user: { email: 'owner@example.com' } } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    rpc: vi.fn().mockResolvedValue({
      data: { memberships: [membership], activeClinicOwnerMembershipCount: 1, hasMultipleActiveClinicOwnerMemberships: false },
      error: null,
    }),
    from: vi.fn().mockReturnValue(query),
    functions: { invoke: vi.fn().mockResolvedValue({ data: { completed: true, mustChangePassword: false }, error: null }) },
    ...overrides,
  } as any;
}

describe('Clinic Owner Supabase first-login adapter', () => {
  it('uses Supabase password sign-in and immediately loads authoritative first-login state', async () => {
    const client = clientFixture();
    const result = await signInClinicOwner('owner@example.com', 'temporary-password', client);
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'owner@example.com', password: 'temporary-password' });
    expect(client.rpc).toHaveBeenCalledWith('get_my_first_login_state');
    expect(result).toMatchObject({ kind: 'ready', scope: { subscriberId: 'subscriber-1' } });
  });

  it('forces first-login password completion without querying tenant scope', async () => {
    const client = clientFixture({
      rpc: vi.fn().mockResolvedValue({
        data: { memberships: [{ ...membership, mustChangePassword: true }], activeClinicOwnerMembershipCount: 1, hasMultipleActiveClinicOwnerMemberships: false },
        error: null,
      }),
    });
    await expect(resolveClinicOwnerAccess(client)).resolves.toMatchObject({ kind: 'password_change_required' });
    expect(client.from).not.toHaveBeenCalled();
  });

  it('fails safely for zero or multiple active Clinic Owner memberships', async () => {
    const noOwner = clientFixture({ rpc: vi.fn().mockResolvedValue({ data: { memberships: [], activeClinicOwnerMembershipCount: 0, hasMultipleActiveClinicOwnerMemberships: false }, error: null }) });
    const multipleOwners = clientFixture({ rpc: vi.fn().mockResolvedValue({ data: { memberships: [membership, { ...membership, membershipId: 'membership-2' }], activeClinicOwnerMembershipCount: 2, hasMultipleActiveClinicOwnerMemberships: true }, error: null }) });
    await expect(resolveClinicOwnerAccess(noOwner)).resolves.toMatchObject({ kind: 'error', code: 'NO_ACTIVE_CLINIC_OWNER_MEMBERSHIP' });
    await expect(resolveClinicOwnerAccess(multipleOwners)).resolves.toMatchObject({ kind: 'error', code: 'MULTIPLE_ACTIVE_CLINIC_OWNER_MEMBERSHIPS' });
  });

  it('handles an expired or invalid session without resolving any tenant authority', async () => {
    const expiredSession = clientFixture({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
      },
    });
    const invalidSession = clientFixture({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: { message: 'expired' } }),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
      },
    });
    await expect(resolveClinicOwnerAccess(expiredSession)).resolves.toEqual({ kind: 'signed_out' });
    await expect(resolveClinicOwnerAccess(invalidSession)).resolves.toMatchObject({ kind: 'error', code: 'SESSION_UNAVAILABLE' });
    expect(expiredSession.rpc).not.toHaveBeenCalled();
    expect(invalidSession.rpc).not.toHaveBeenCalled();
  });

  it('accepts only the deployed password policy before calling the function', () => {
    expect(validateInitialPassword('short1lette')).toBeTruthy();
    expect(validateInitialPassword('123456789012')).toBeTruthy();
    expect(validateInitialPassword('abcdefghijkl')).toBeTruthy();
    expect(validateInitialPassword('Password1234')).toBeNull();
  });

  it('calls complete-initial-password with only newPassword', async () => {
    const client = clientFixture();
    await expect(completeClinicOwnerInitialPassword('Password1234', client)).resolves.toEqual({ ok: true });
    expect(client.functions.invoke).toHaveBeenCalledWith('complete-initial-password', { body: { newPassword: 'Password1234' } });
  });

  it('maps backend errors without exposing provider details', async () => {
    const response = new Response(JSON.stringify({ error: { code: 'INVALID_PASSWORD' } }));
    const client = clientFixture({ functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: { context: response } }) } });
    await expect(completeClinicOwnerInitialPassword('Password1234', client)).resolves.toEqual({ ok: false, code: 'INVALID_PASSWORD', message: 'Your password does not meet the required policy.' });
  });

  it('signs out through the configured Supabase client', async () => {
    const client = clientFixture();
    await signOutClinicOwner(client);
    expect(client.auth.signOut).toHaveBeenCalledTimes(1);
  });
});
