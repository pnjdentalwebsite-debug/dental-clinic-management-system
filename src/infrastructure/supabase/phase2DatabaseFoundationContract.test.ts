/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260829142527_phase_2_platform_admin_review_provisioning_foundation.sql'),
  'utf8',
);

describe('Phase 2C.1 Platform Admin database foundation contract', () => {
  it('adds exact profile and subscription snapshot fields without replacing existing identity columns', () => {
    expect(migration).toContain('add column if not exists display_name text');
    expect(migration).toContain('add column if not exists billing_cycle text');
    expect(migration).toContain('add column if not exists amount_centavos bigint');
    expect(migration).toContain('add column if not exists source_payment_id uuid');
    expect(migration).toContain("billing_cycle in ('monthly', 'annual')");
    expect(migration).toContain('amount_centavos is null or amount_centavos >= 0');
    expect(migration).toContain('references public.payments(id) on delete restrict');
  });

  it('creates one durable provisioning attempt per registration without credential material', () => {
    expect(migration).toContain('create table if not exists public.registration_provisioning_attempts');
    expect(migration).toContain('registration_id uuid not null unique');
    expect(migration).toContain('auth_user_created_by_attempt boolean not null default false');
    expect(migration).toContain('credential_delivery_status text not null');
    expect(migration).not.toMatch(/registration_provisioning_attempts[\s\S]{0,1600}(password|otp_hash|auth_token)/i);
  });

  it('separates payment approval and rejection from tenant provisioning', () => {
    const start = migration.indexOf('create or replace function public.review_registration_payment_atomic');
    const end = migration.indexOf('create or replace function public.reject_registration_atomic');
    const reviewRpc = migration.slice(start, end);
    expect(reviewRpc).toContain("set status = 'approved'");
    expect(reviewRpc).toContain("set payment_status = 'approved'");
    expect(reviewRpc).toContain("set status = 'rejected'");
    expect(reviewRpc).toContain("registration_status = 'pending_payment'");
    expect(reviewRpc).toContain("'platform.payment.accepted'");
    expect(reviewRpc).toContain("'platform.payment.rejected'");
    expect(reviewRpc).not.toContain('insert into public.subscribers');
    expect(reviewRpc).not.toContain('insert into public.clinics');
    expect(reviewRpc).not.toContain('insert into public.subscriptions');
  });

  it('keeps payment review idempotent and protects one approved/reviewable payment per registration', () => {
    expect(migration).toContain("v_payment.status = 'approved'");
    expect(migration).toContain("v_payment.status = 'rejected'");
    expect(migration).toContain('payments_one_approved_registration');
    expect(migration).toContain('payments_one_reviewable_registration');
  });

  it('blocks registration rejection after payment approval and preserves rejected payment history', () => {
    expect(migration).toContain("v_registration.payment_status = 'approved'");
    expect(migration).toContain("payment.status = 'approved'");
    expect(migration).toContain('cannot be rejected until a refund workflow exists');
    expect(migration).toContain("set registration_status = 'rejected'");
    expect(migration).toContain("payment.status = 'pending_verification'");
  });

  it('claims provisioning idempotently and revalidates authoritative plan/payment data', () => {
    expect(migration).toContain('create or replace function public.begin_registration_provisioning');
    expect(migration).toContain('for update');
    expect(migration).toContain('Exactly one approved payment is required for provisioning.');
    expect(migration).toContain('v_payment.amount_centavos <> v_authoritative_amount');
    expect(migration).toContain("elsif v_attempt.status = 'failed'");
    expect(migration).toContain("jsonb_build_object('registration_id', v_registration.id, 'retry', true)");
  });

  it('maps structured clinic data and never provisions placeholder locations', () => {
    expect(migration).toContain('btrim(v_registration.clinic_address)');
    expect(migration).toContain('btrim(v_registration.clinic_city)');
    expect(migration).toContain('btrim(v_registration.clinic_province)');
    expect(migration).toContain("'Philippines', 'Asia/Manila', 'active', true");
    expect(migration).not.toContain("'Address pending'");
    expect(migration).not.toContain("'Unspecified'");
  });

  it('creates the subscription from the approved payment snapshot and billing cycle', () => {
    expect(migration).toContain('billing_cycle, amount_centavos, source_payment_id');
    expect(migration).toContain('v_registration.billing_cycle');
    expect(migration).toContain('v_payment.amount_centavos');
    expect(migration).toContain("v_now + interval '1 month'");
    expect(migration).toContain("v_now + interval '1 year'");
  });

  it('uses the Auth profile trigger and preserves the registration owner display name without parsing', () => {
    expect(migration).toContain('create or replace function app_private.handle_new_auth_user()');
    expect(migration).toContain("new.raw_user_meta_data ->> 'display_name'");
    expect(migration).toContain('display_name = v_registration.owner_name');
    expect(migration).not.toContain('split_part(v_registration.owner_name');
  });

  it('does not create a Clinic Owner clinic assignment', () => {
    const start = migration.indexOf('create function public.approve_registration_provisioning');
    const provisioningRpc = migration.slice(start);
    expect(provisioningRpc).toContain("'clinic_owner', 'active'");
    expect(provisioningRpc).not.toContain('insert into public.clinic_assignments');
  });

  it('writes the required safe transactional audit events', () => {
    for (const eventType of [
      'platform.payment.accepted',
      'platform.payment.rejected',
      'platform.registration.rejected',
      'platform.provisioning.started',
      'platform.registration.approved',
      'platform.provisioning.completed',
      'platform.provisioning.failed',
    ]) {
      expect(migration).toContain(`'${eventType}'`);
    }
  });

  it('restricts every privileged RPC to service_role', () => {
    const signatures = [
      'review_registration_payment_atomic(uuid, uuid, uuid, text, text)',
      'reject_registration_atomic(uuid, uuid, text)',
      'begin_registration_provisioning(uuid, uuid)',
      'fail_registration_provisioning_attempt(uuid, uuid, text)',
      'approve_registration_provisioning(uuid, uuid, uuid, uuid)',
    ];
    for (const signature of signatures) {
      expect(migration).toContain(`revoke execute on function public.${signature} from public, anon, authenticated`);
      expect(migration).toContain(`grant execute on function public.${signature} to service_role`);
    }
    expect(migration).toContain("security definer\nset search_path = ''");
  });
});
