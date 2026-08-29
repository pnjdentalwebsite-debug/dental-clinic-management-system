/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const functions = {
  list: read('supabase/functions/platform-registration-review-list/index.ts'),
  detail: read('supabase/functions/platform-registration-review-detail/index.ts'),
  payment: read('supabase/functions/platform-review-payment/index.ts'),
  rejection: read('supabase/functions/platform-reject-registration/index.ts'),
};
const config = read('supabase/config.toml');
const sharedAuth = read('supabase/functions/_shared/platform-admin.ts');
const dto = read('supabase/functions/_shared/registration-review.ts');

describe('Phase 2C.2A Platform Admin review API contract', () => {
  it('requires a verified user JWT and an authoritative platform-admin ledger entry', () => {
    for (const source of Object.values(functions)) {
      expect(source).toContain("withSupabase({ auth: 'user' }");
      expect(source).toContain('requirePlatformAdmin(ctx)');
      expect(source).not.toContain("auth: ['publishable', 'secret']");
    }
    expect(sharedAuth).toContain(".from('platform_admins')");
    expect(sharedAuth).toContain(".eq('user_id', actorId)");
    expect(sharedAuth).not.toContain('app_metadata');
    expect(sharedAuth).not.toContain('user_metadata');
  });

  it('keeps all four function configurations JWT-protected', () => {
    for (const name of [
      'platform-registration-review-list',
      'platform-registration-review-detail',
      'platform-review-payment',
      'platform-reject-registration',
    ]) {
      expect(config).toContain(`[functions.${name}]\nenabled = true\nverify_jwt = true`);
    }
  });

  it('returns an allowlisted list DTO with server-derived plan amount and safe payment fields', () => {
    expect(functions.list).toContain(".from('registrations')");
    expect(functions.list).toContain(".eq('registration_status', registrationStatus)");
    expect(functions.list).toContain(".eq('payments.status', paymentStatus)");
    expect(functions.list).toContain(".ilike('registration_number'");
    expect(dto).toContain('applicableAmountCentavos');
    expect(dto).toContain('amountCentavos: payment.amount_centavos');
    expect(dto).not.toContain('otp_hash');
    expect(dto).not.toContain('temporaryPassword');
    expect(dto).not.toContain('provisioning_attempt');
  });

  it('returns only the approved structured detail fields', () => {
    expect(functions.detail).toContain('owner_address, owner_city, owner_province, owner_postal_code');
    expect(functions.detail).toContain('clinic_address, clinic_city, clinic_province, clinic_postal_code');
    expect(functions.detail).toContain('dentist_count, staff_count, location_count');
    expect(functions.detail).toContain('works_with_laboratory, laboratory_name');
    expect(functions.detail).toContain('notes)');
    expect(functions.detail).not.toContain('registration_provisioning_attempts');
    expect(functions.detail).not.toContain('otp_hash');
  });

  it('does not accept browser-authoritative payment fields or browser actor identity', () => {
    expect(functions.payment).toContain("uuid(payload.registrationId, 'registrationId')");
    expect(functions.payment).toContain("uuid(payload.paymentId, 'paymentId')");
    expect(functions.payment).toContain("text(payload.decision, 'Decision', 10)");
    expect(functions.payment).toContain('p_platform_admin_user_id: actorId');
    expect(functions.payment).not.toContain('payload.amount');
    expect(functions.payment).not.toContain('payload.subscriberId');
    expect(functions.payment).not.toContain('payload.actorId');
    expect(functions.payment).not.toContain('payload.reviewedBy');
    expect(functions.payment).toContain("rpc('review_registration_payment_atomic'");
  });

  it('requires and bounds a normalized rejection reason', () => {
    expect(functions.payment).toContain('optionalText(payload.reason, 1000)');
    expect(functions.payment).toContain("decision === 'reject' && !reason");
    expect(functions.rejection).toContain("text(payload.reason, 'Rejection reason', 1000)");
    expect(functions.rejection).toContain("rpc('reject_registration_atomic'");
  });

  it('keeps review operations outside Auth and tenant provisioning', () => {
    for (const source of [functions.payment, functions.rejection]) {
      expect(source).not.toContain('.auth.admin.createUser');
      expect(source).not.toContain("rpc('approve_registration_provisioning'");
      expect(source).not.toContain(".from('subscribers').insert");
      expect(source).not.toContain(".from('clinics').insert");
      expect(source).not.toContain(".from('subscriptions').insert");
    }
  });

  it('maps domain failures to safe typed errors and exposes no privileged credentials', () => {
    expect(sharedAuth).toContain("code: 'INTERNAL_ERROR'");
    expect(sharedAuth).toContain("new PlatformAdminApiError('STATE_CONFLICT'");
    expect(sharedAuth).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(sharedAuth).not.toContain('SUPABASE_SECRET_KEY');
    expect(JSON.stringify(functions)).not.toContain('service_role');
  });
});
