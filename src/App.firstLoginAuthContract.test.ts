import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const app = read('src/App.tsx');
const authAdapter = read('src/infrastructure/supabase/clinicOwnerAuth.ts');

describe('Phase 2E.1 Clinic Owner frontend first-login contract', () => {
  it('uses Supabase sign-in and excludes Clinic Owner accounts from the legacy mock branch', () => {
    expect(app).toContain('client.auth.signInWithPassword({ email: email.trim(), password })');
    expect(authAdapter).toContain('client.auth.signInWithPassword({ email, password })');
    expect(app).toContain("user.role === 'associate' || user.role === 'staff'");
  });

  it('loads authoritative first-login state and routes the required-password case only to Change Password', () => {
    expect(authAdapter).toContain("client.rpc('get_my_first_login_state')");
    expect(app).toContain("clinicOwnerAccess.kind === 'password_change_required'");
    expect(app).toContain("setCurrentRoute('/clinic/change-password')");
    expect(app).toContain('!firstLoginRouteGateActive');
  });

  it('uses the authenticated RLS-scoped membership row for tenant scope after the password gate clears', () => {
    expect(authAdapter).toContain(".from('subscriber_memberships')");
    expect(authAdapter).toContain(".eq('id', membership.membershipId)");
    expect(authAdapter).toContain("kind: 'ready'");
    expect(app).toContain('usesRealClinicOwnerAuthority');
  });

  it('does not retain a local Clinic Owner password-change authority', () => {
    expect(app).not.toContain('mockAuthService.updatePassword');
    expect(app).not.toContain('handleLoadClinicOwnerCredentials');
    expect(app).not.toContain('Copy Temp Password');
    expect(authAdapter).toContain("{ body: { newPassword } }");
    expect(authAdapter).not.toMatch(/body:\s*\{[^}]+(?:userId|membershipId|subscriberId|clinicId|actorId|temporaryPassword)/);
  });

  it('refreshes authoritative access after password completion and signs out through Supabase', () => {
    expect(app).toContain('const refreshedAccess = await resolveClinicOwnerAccess(client)');
    expect(app).toContain('await signOutClinicOwner(client)');
    expect(authAdapter).toContain('await client.auth.signOut()');
  });

  it('does not manually persist passwords, access tokens, or first-login authority', () => {
    expect(authAdapter).not.toMatch(/localStorage|sessionStorage|accessToken|refreshToken/);
    expect(authAdapter).not.toContain('mustChangePassword: true');
  });

  it('preserves the approved Login and Change Password structural anchors', () => {
    for (const label of ['Welcome Back', 'Email Address', 'Password', 'Secure your account', 'New Password', 'Confirm New Password']) {
      expect(app).toContain(label);
    }
  });
});
