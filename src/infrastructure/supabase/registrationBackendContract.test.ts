/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('Phase 1C registration backend contract', () => {
  const migration = read('supabase/migrations/20260829120000_registration_phase_1_backend_foundation.sql');
  const planMigration = read('supabase/migrations/20260829130000_phase_1_development_plan_catalog.sql');

  it('keeps OTP hashes and privileged RPCs inaccessible to browser roles', () => {
    expect(migration).toContain('otp_hash text not null');
    expect(migration).toContain('revoke all on table public.registration_email_otp_challenges from public, anon, authenticated');
    expect(migration).toContain('revoke all on function public.verify_registration_email_otp');
    expect(migration).toContain('revoke all on function public.submit_registration_payment_atomic');
  });

  it('requires verified email and derives payment amount from the linked active plan', () => {
    expect(migration).toContain('v_registration.email_verified_at is null');
    expect(migration).toContain("plan.status = 'active'");
    expect(migration).toContain('v_plan.monthly_amount_centavos');
    expect(migration).toContain('payments_one_pending_registration');
  });

  it('binds public status to registration id and normalized owner email', () => {
    const statusFunction = read('supabase/functions/registration-status/index.ts');
    expect(statusFunction).toContain("uuid(payload.registrationId, 'registrationId')");
    expect(statusFunction).toContain(".eq('id', registrationId)");
    expect(statusFunction).toContain(".eq('owner_email', ownerEmail)");
    expect(statusFunction).not.toContain('provisioned_at');
  });

  it('does not expose or log the generated OTP', () => {
    const requestFunction = read('supabase/functions/registration-request-otp/index.ts');
    expect(requestFunction).toContain('otp_hash: hash');
    expect(requestFunction).not.toMatch(/response\([^\n]+code/);
    expect(requestFunction).not.toContain('console.log');
  });

  it('sends the gateway credential only in the server-side mail payload', () => {
    const emailAdapter = read('supabase/functions/_shared/registration-email.ts');
    expect(emailAdapter).toContain('gatewayToken: token');
    expect(emailAdapter).not.toContain('Authorization: `Bearer ${token}`');
    expect(emailAdapter).not.toContain('console.log');
  });

  it('uses the atomic RPC from the existing payment edge function', () => {
    const paymentFunction = read('supabase/functions/registration-submit-payment/index.ts');
    expect(paymentFunction).toContain("rpc('submit_registration_payment_atomic'");
    expect(paymentFunction).not.toContain(".from('payments').insert");
  });

  it('starts registration before OTP and normalizes yearly billing', () => {
    const submitFunction = read('supabase/functions/registration-submit/index.ts');
    expect(submitFunction).toContain("payload.billingCycle === 'yearly'");
    expect(submitFunction).toContain("registration_status: 'pending_verification'");
  });

  it('upserts the approved centavo plan catalog by stable plan code', () => {
    expect(planMigration).toContain("'basic', 'Basic', 500000::bigint, 5100000::bigint");
    expect(planMigration).toContain("'plus', 'Plus', 850000::bigint, 8670000::bigint");
    expect(planMigration).toContain("'max', 'Max', 1000000::bigint, 10200000::bigint");
    expect(planMigration).toContain('on conflict (plan_code) do update');
    expect(planMigration).toContain("'active'::public.account_status");
  });

  it('keeps the public plan endpoint restricted to display-safe fields', () => {
    const plansFunction = read('supabase/functions/registration-plans/index.ts');
    expect(plansFunction).toContain(".eq('status', 'active')");
    expect(plansFunction).toContain('monthlyAmountCentavos');
    expect(plansFunction).toContain('annualAmountCentavos');
    expect(plansFunction).not.toContain(".select('*')");
  });

  it('maps the six public registration steps through the browser-safe Edge Function adapter', () => {
    const adapter = read('src/infrastructure/supabase/onboarding.ts');
    expect(adapter).toContain("invoke<{ plans: RegistrationPlan[] }>('registration-plans', {})");
    expect(adapter).toContain("'registration-submit', input");
    expect(adapter).toContain("'registration-request-otp', { registrationId, ownerEmail }");
    expect(adapter).toContain("'registration-verify-otp', { registrationId, ownerEmail, otp }");
    expect(adapter).toContain("'registration-submit-payment', { registrationId, ownerEmail, paymentMethod, referenceNumber }");
    expect(adapter).toContain("'registration-status', { registrationId, ownerEmail }");
  });

  it('maps the yearly UI selection to the authoritative annual registration cycle', () => {
    const app = read('src/App.tsx');
    expect(app).toContain("billingCycle: regBillingCycle === 'yearly' ? 'annual' : 'monthly'");
    expect(app).toContain('annualAmountCentavos');
  });

  it('keeps only public continuation identifiers in session storage', () => {
    const app = read('src/App.tsx');
    expect(app).toContain("const REGISTRATION_CONTINUATION_KEY = 'pnj_registration_continuation'");
    expect(app).toContain('registrationNumber: result.registration.registration_number');
    expect(app).not.toContain("sessionStorage.setItem(REGISTRATION_CONTINUATION_KEY, JSON.stringify({ otp");
  });

  it('removes mock registration, OTP, and payment calls from the public registration handlers', () => {
    const app = read('src/App.tsx');
    const start = app.indexOf('// Onboarding submissions');
    const end = app.indexOf('// Platform admin approvals');
    const registrationRuntime = app.slice(start, end);
    expect(registrationRuntime).not.toContain('mockRegistrationService');
    expect(registrationRuntime).not.toContain('mockOtpService');
    expect(registrationRuntime).not.toContain('centralizedPaymentService');
    expect(registrationRuntime).not.toContain('DEMO-PAY-REF');
    expect(registrationRuntime).toContain('onboardingApi.submitRegistrationPayment(activeRegistrationId, regEmail, paymentMethod, paymentRef.trim())');
  });

  it('does not render the hardcoded OTP or a demo payment bypass in the registration wizard', () => {
    const app = read('src/App.tsx');
    const verificationView = app.slice(app.indexOf('{/* STEP 5: EMAIL VERIFICATION */}'), app.indexOf('{/* STEP 6: PAYMENT SCREEN */}'));
    const paymentView = app.slice(app.indexOf('{/* STEP 6: PAYMENT SCREEN */}'), app.indexOf('{/* STATUS AND SUCCESS PAGES */}'));
    expect(verificationView).not.toContain('DEMO_OTP');
    expect(paymentView).not.toContain("id: 'Demo Payment'");
  });
});
