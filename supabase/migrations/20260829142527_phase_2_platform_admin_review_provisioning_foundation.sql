-- Phase 2C.1 Platform Admin review and provisioning database foundation.
-- Additive tenant-safe foundation only. No registrations are approved and no
-- Auth, subscriber, clinic, or subscription records are seeded by this file.

alter table public.profiles
  add column if not exists display_name text;

alter table public.subscriptions
  add column if not exists billing_cycle text,
  add column if not exists amount_centavos bigint,
  add column if not exists source_payment_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'subscriptions_billing_cycle_check'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_billing_cycle_check
      check (billing_cycle is null or billing_cycle in ('monthly', 'annual'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'subscriptions_amount_centavos_nonnegative'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_amount_centavos_nonnegative
      check (amount_centavos is null or amount_centavos >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'subscriptions_source_payment_id_fkey'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_source_payment_id_fkey
      foreign key (source_payment_id) references public.payments(id) on delete restrict;
  end if;
end;
$$;

create unique index if not exists subscriptions_source_payment_unique
  on public.subscriptions (source_payment_id)
  where source_payment_id is not null;

create unique index if not exists payments_one_approved_registration
  on public.payments (registration_id)
  where registration_id is not null and status = 'approved';

create unique index if not exists payments_one_reviewable_registration
  on public.payments (registration_id)
  where registration_id is not null and status in ('pending_verification', 'approved');

create table if not exists public.registration_provisioning_attempts (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.registrations(id) on delete restrict,
  status text not null default 'claimed'
    check (status in ('claimed', 'database_provisioned', 'completed', 'failed')),
  owner_email_normalized text not null
    check (owner_email_normalized = lower(btrim(owner_email_normalized))),
  auth_user_id uuid references public.profiles(id) on delete restrict,
  auth_user_created_by_attempt boolean not null default false,
  started_by uuid not null references public.platform_admins(user_id) on delete restrict,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  failure_code text,
  subscriber_id uuid references public.subscribers(id) on delete restrict,
  clinic_id uuid references public.clinics(id) on delete restrict,
  subscription_id uuid references public.subscriptions(id) on delete restrict,
  credential_delivery_status text not null default 'pending'
    check (credential_delivery_status in ('pending', 'sent', 'failed', 'not_required')),
  credential_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (failure_code is null or length(failure_code) <= 120),
  check ((status = 'failed') or failed_at is null),
  check ((status in ('database_provisioned', 'completed')) or completed_at is null),
  check ((credential_delivery_status = 'sent') or credential_sent_at is null)
);

create index if not exists registration_provisioning_attempts_status_started_idx
  on public.registration_provisioning_attempts (status, started_at);

alter table public.registration_provisioning_attempts enable row level security;
revoke all on table public.registration_provisioning_attempts from public, anon, authenticated;
grant select, insert, update, delete on table public.registration_provisioning_attempts to service_role;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'registration_provisioning_attempts_set_updated_at'
      and tgrelid = 'public.registration_provisioning_attempts'::regclass
      and not tgisinternal
  ) then
    create trigger registration_provisioning_attempts_set_updated_at
      before update on public.registration_provisioning_attempts
      for each row execute procedure app_private.set_updated_at();
  end if;
end;
$$;

create or replace function app_private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, first_name, last_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'last_name'), '')
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    updated_at = now();
  return new;
end;
$$;

revoke all on function app_private.handle_new_auth_user() from public, anon, authenticated;

create or replace function public.review_registration_payment_atomic(
  p_registration_id uuid,
  p_payment_id uuid,
  p_platform_admin_user_id uuid,
  p_decision text,
  p_reason text default null
)
returns table (
  payment_id uuid,
  payment_status public.payment_status,
  registration_status text,
  reviewed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registration public.registrations%rowtype;
  v_payment public.payments%rowtype;
  v_plan public.plans%rowtype;
  v_decision text := lower(btrim(coalesce(p_decision, '')));
  v_reason text := nullif(btrim(p_reason), '');
  v_authoritative_amount bigint;
  v_reviewed_at timestamptz := now();
begin
  if not exists (
    select 1 from public.platform_admins admin
    where admin.user_id = p_platform_admin_user_id
  ) then
    raise exception 'Platform administrator access is required.';
  end if;

  if v_decision not in ('approve', 'reject') then
    raise exception 'Payment decision must be approve or reject.';
  end if;
  if v_reason is not null and length(v_reason) > 1000 then
    raise exception 'Payment review reason is too long.';
  end if;
  if v_decision = 'reject' and v_reason is null then
    raise exception 'A payment rejection reason is required.';
  end if;

  select registration.* into v_registration
  from public.registrations registration
  where registration.id = p_registration_id
  for update;
  if not found then raise exception 'Registration was not found.'; end if;

  select payment.* into v_payment
  from public.payments payment
  where payment.id = p_payment_id
  for update;
  if not found or v_payment.registration_id is distinct from v_registration.id then
    raise exception 'Payment was not found for this registration.';
  end if;

  if v_decision = 'approve'
    and v_payment.status = 'approved'
    and v_registration.payment_status = 'approved'
    and v_registration.registration_status = 'pending_review' then
    return query select v_payment.id, v_payment.status, v_registration.registration_status, v_payment.reviewed_at;
    return;
  end if;
  if v_decision = 'reject'
    and v_payment.status = 'rejected'
    and v_registration.payment_status = 'rejected'
    and v_registration.registration_status = 'pending_payment' then
    return query select v_payment.id, v_payment.status, v_registration.registration_status, v_payment.reviewed_at;
    return;
  end if;

  if v_payment.status <> 'pending_verification'
    or v_registration.payment_status <> 'pending_verification'
    or v_registration.registration_status <> 'pending_review' then
    raise exception 'Payment is not awaiting review.';
  end if;
  if v_registration.email_verified_at is null then
    raise exception 'Registration email verification is required.';
  end if;

  select plan.* into v_plan
  from public.plans plan
  where plan.id = v_registration.plan_id
    and plan.status = 'active';
  if not found then raise exception 'The registration plan is unavailable.'; end if;

  v_authoritative_amount := case
    when v_registration.billing_cycle = 'annual'
      then coalesce(v_plan.annual_amount_centavos, v_plan.monthly_amount_centavos * 12)
    else v_plan.monthly_amount_centavos
  end;
  if v_payment.amount_centavos <> v_authoritative_amount then
    raise exception 'Payment amount does not match the authoritative registration amount.';
  end if;

  if v_decision = 'approve' then
    update public.payments payment
    set status = 'approved',
        reviewed_at = v_reviewed_at,
        reviewed_by = p_platform_admin_user_id
    where payment.id = v_payment.id
    returning payment.* into v_payment;

    update public.registrations registration
    set payment_status = 'approved',
        reviewed_at = v_reviewed_at,
        reviewed_by = p_platform_admin_user_id
    where registration.id = v_registration.id
    returning registration.* into v_registration;

    insert into public.audit_events (
      actor_user_id, event_type, entity_type, entity_id, metadata
    ) values (
      p_platform_admin_user_id,
      'platform.payment.accepted',
      'payment',
      v_payment.id,
      jsonb_build_object(
        'registration_id', v_registration.id,
        'from_status', 'pending_verification',
        'to_status', 'approved',
        'amount_centavos', v_payment.amount_centavos
      )
    );
  else
    update public.payments payment
    set status = 'rejected',
        reviewed_at = v_reviewed_at,
        reviewed_by = p_platform_admin_user_id,
        notes = v_reason
    where payment.id = v_payment.id
    returning payment.* into v_payment;

    update public.registrations registration
    set payment_status = 'rejected',
        registration_status = 'pending_payment',
        reviewed_at = v_reviewed_at,
        reviewed_by = p_platform_admin_user_id
    where registration.id = v_registration.id
    returning registration.* into v_registration;

    insert into public.audit_events (
      actor_user_id, event_type, entity_type, entity_id, metadata
    ) values (
      p_platform_admin_user_id,
      'platform.payment.rejected',
      'payment',
      v_payment.id,
      jsonb_build_object(
        'registration_id', v_registration.id,
        'from_status', 'pending_verification',
        'to_status', 'rejected',
        'reason', v_reason
      )
    );
  end if;

  return query select v_payment.id, v_payment.status, v_registration.registration_status, v_payment.reviewed_at;
end;
$$;

create or replace function public.reject_registration_atomic(
  p_registration_id uuid,
  p_platform_admin_user_id uuid,
  p_reason text
)
returns table (
  registration_id uuid,
  registration_status text,
  payment_status public.payment_status,
  reviewed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registration public.registrations%rowtype;
  v_pending_payment public.payments%rowtype;
  v_reason text := nullif(btrim(p_reason), '');
  v_reviewed_at timestamptz := now();
begin
  if not exists (
    select 1 from public.platform_admins admin
    where admin.user_id = p_platform_admin_user_id
  ) then
    raise exception 'Platform administrator access is required.';
  end if;
  if v_reason is null then raise exception 'A registration rejection reason is required.'; end if;
  if length(v_reason) > 1000 then raise exception 'Registration rejection reason is too long.'; end if;

  select registration.* into v_registration
  from public.registrations registration
  where registration.id = p_registration_id
  for update;
  if not found then raise exception 'Registration was not found.'; end if;

  if v_registration.registration_status = 'rejected' then
    return query select v_registration.id, v_registration.registration_status,
      v_registration.payment_status, v_registration.reviewed_at;
    return;
  end if;
  if v_registration.provisioned_at is not null or v_registration.registration_status = 'approved' then
    raise exception 'A provisioned registration cannot be rejected.';
  end if;
  if v_registration.payment_status = 'approved' or exists (
    select 1 from public.payments payment
    where payment.registration_id = v_registration.id and payment.status = 'approved'
  ) then
    raise exception 'A registration with an approved payment cannot be rejected until a refund workflow exists.';
  end if;
  if v_registration.registration_status = 'cancelled' then
    raise exception 'A cancelled registration cannot be rejected.';
  end if;

  select payment.* into v_pending_payment
  from public.payments payment
  where payment.registration_id = v_registration.id
    and payment.status = 'pending_verification'
  order by payment.submitted_at desc
  limit 1
  for update;

  if found then
    update public.payments payment
    set status = 'rejected', reviewed_at = v_reviewed_at,
        reviewed_by = p_platform_admin_user_id, notes = v_reason
    where payment.id = v_pending_payment.id;

    insert into public.audit_events (
      actor_user_id, event_type, entity_type, entity_id, metadata
    ) values (
      p_platform_admin_user_id,
      'platform.payment.rejected',
      'payment',
      v_pending_payment.id,
      jsonb_build_object('registration_id', v_registration.id, 'reason', v_reason, 'source', 'registration_rejection')
    );
    v_registration.payment_status := 'rejected';
  end if;

  update public.registrations registration
  set registration_status = 'rejected',
      payment_status = v_registration.payment_status,
      rejection_reason = v_reason,
      reviewed_at = v_reviewed_at,
      reviewed_by = p_platform_admin_user_id
  where registration.id = v_registration.id
  returning registration.* into v_registration;

  insert into public.audit_events (
    actor_user_id, event_type, entity_type, entity_id, metadata
  ) values (
    p_platform_admin_user_id,
    'platform.registration.rejected',
    'registration',
    v_registration.id,
    jsonb_build_object('reason', v_reason, 'payment_status', v_registration.payment_status)
  );

  return query select v_registration.id, v_registration.registration_status,
    v_registration.payment_status, v_registration.reviewed_at;
end;
$$;

create or replace function public.begin_registration_provisioning(
  p_registration_id uuid,
  p_platform_admin_user_id uuid
)
returns table (
  attempt_id uuid,
  attempt_status text,
  auth_user_id uuid,
  subscriber_id uuid,
  clinic_id uuid,
  subscription_id uuid,
  credential_delivery_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registration public.registrations%rowtype;
  v_plan public.plans%rowtype;
  v_payment public.payments%rowtype;
  v_attempt public.registration_provisioning_attempts%rowtype;
  v_approved_payment_count integer;
  v_authoritative_amount bigint;
begin
  if not exists (
    select 1 from public.platform_admins admin
    where admin.user_id = p_platform_admin_user_id
  ) then
    raise exception 'Platform administrator access is required.';
  end if;

  select registration.* into v_registration
  from public.registrations registration
  where registration.id = p_registration_id
  for update;
  if not found then raise exception 'Registration was not found.'; end if;

  select attempt.* into v_attempt
  from public.registration_provisioning_attempts attempt
  where attempt.registration_id = v_registration.id
  for update;

  if v_registration.provisioned_at is not null then
    if not found or v_attempt.status not in ('database_provisioned', 'completed') then
      raise exception 'Provisioned registration is missing its completed provisioning ledger.';
    end if;
    return query select v_attempt.id, v_attempt.status, v_attempt.auth_user_id,
      v_attempt.subscriber_id, v_attempt.clinic_id, v_attempt.subscription_id,
      v_attempt.credential_delivery_status;
    return;
  end if;

  if v_registration.email_verified_at is null
    or v_registration.registration_status <> 'pending_review'
    or v_registration.payment_status <> 'approved' then
    raise exception 'Registration is not eligible for provisioning.';
  end if;

  select plan.* into v_plan
  from public.plans plan
  where plan.id = v_registration.plan_id and plan.status = 'active';
  if not found then raise exception 'The registration plan is unavailable.'; end if;

  select count(*)::integer into v_approved_payment_count
  from public.payments payment
  where payment.registration_id = v_registration.id and payment.status = 'approved';
  if v_approved_payment_count <> 1 then
    raise exception 'Exactly one approved payment is required for provisioning.';
  end if;

  select payment.* into v_payment
  from public.payments payment
  where payment.registration_id = v_registration.id and payment.status = 'approved'
  for update;

  v_authoritative_amount := case
    when v_registration.billing_cycle = 'annual'
      then coalesce(v_plan.annual_amount_centavos, v_plan.monthly_amount_centavos * 12)
    else v_plan.monthly_amount_centavos
  end;
  if v_payment.amount_centavos <> v_authoritative_amount then
    raise exception 'Approved payment amount does not match the authoritative registration amount.';
  end if;

  if nullif(btrim(v_registration.clinic_name), '') is null
    or nullif(btrim(v_registration.clinic_email), '') is null
    or nullif(btrim(v_registration.clinic_address), '') is null
    or nullif(btrim(v_registration.clinic_city), '') is null
    or nullif(btrim(v_registration.clinic_province), '') is null then
    raise exception 'Complete structured clinic address information is required before provisioning.';
  end if;

  if exists (
    select 1 from public.subscribers subscriber
    where lower(btrim(subscriber.email)) = lower(btrim(v_registration.owner_email))
      and subscriber.registration_id is distinct from v_registration.id
  ) then
    raise exception 'The owner email is already linked to another subscriber.';
  end if;

  if v_attempt.id is null then
    insert into public.registration_provisioning_attempts (
      registration_id, status, owner_email_normalized, started_by, started_at
    ) values (
      v_registration.id, 'claimed', lower(btrim(v_registration.owner_email)),
      p_platform_admin_user_id, now()
    ) returning * into v_attempt;

    insert into public.audit_events (
      actor_user_id, event_type, entity_type, entity_id, metadata
    ) values (
      p_platform_admin_user_id,
      'platform.provisioning.started',
      'registration_provisioning_attempt',
      v_attempt.id,
      jsonb_build_object('registration_id', v_registration.id)
    );
  elsif v_attempt.status = 'failed' then
    update public.registration_provisioning_attempts attempt
    set status = 'claimed', started_by = p_platform_admin_user_id,
        started_at = now(), failed_at = null, failure_code = null
    where attempt.id = v_attempt.id
    returning * into v_attempt;

    insert into public.audit_events (
      actor_user_id, event_type, entity_type, entity_id, metadata
    ) values (
      p_platform_admin_user_id,
      'platform.provisioning.started',
      'registration_provisioning_attempt',
      v_attempt.id,
      jsonb_build_object('registration_id', v_registration.id, 'retry', true)
    );
  end if;

  return query select v_attempt.id, v_attempt.status, v_attempt.auth_user_id,
    v_attempt.subscriber_id, v_attempt.clinic_id, v_attempt.subscription_id,
    v_attempt.credential_delivery_status;
end;
$$;

create or replace function public.fail_registration_provisioning_attempt(
  p_provisioning_attempt_id uuid,
  p_platform_admin_user_id uuid,
  p_failure_code text
)
returns table (attempt_id uuid, attempt_status text, failed_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.registration_provisioning_attempts%rowtype;
  v_failure_code text := nullif(btrim(p_failure_code), '');
begin
  if not exists (
    select 1 from public.platform_admins admin
    where admin.user_id = p_platform_admin_user_id
  ) then
    raise exception 'Platform administrator access is required.';
  end if;
  if v_failure_code is null or length(v_failure_code) > 120 then
    raise exception 'A safe provisioning failure code is required.';
  end if;

  select attempt.* into v_attempt
  from public.registration_provisioning_attempts attempt
  where attempt.id = p_provisioning_attempt_id
  for update;
  if not found then raise exception 'Provisioning attempt was not found.'; end if;
  if v_attempt.status in ('database_provisioned', 'completed') then
    raise exception 'A completed provisioning attempt cannot be marked failed.';
  end if;

  update public.registration_provisioning_attempts attempt
  set status = 'failed', failed_at = now(), failure_code = v_failure_code
  where attempt.id = v_attempt.id
  returning attempt.* into v_attempt;

  insert into public.audit_events (
    actor_user_id, event_type, entity_type, entity_id, metadata
  ) values (
    p_platform_admin_user_id,
    'platform.provisioning.failed',
    'registration_provisioning_attempt',
    v_attempt.id,
    jsonb_build_object('registration_id', v_attempt.registration_id, 'failure_code', v_failure_code)
  );

  return query select v_attempt.id, v_attempt.status, v_attempt.failed_at;
end;
$$;

-- The former three-argument function combined payment review and provisioning.
-- Remove that unsafe signature before installing the approved Phase 2 contract.
drop function if exists public.approve_registration_provisioning(uuid, uuid, uuid);

create function public.approve_registration_provisioning(
  p_registration_id uuid,
  p_provisioning_attempt_id uuid,
  p_owner_user_id uuid,
  p_actor_user_id uuid
)
returns table (
  subscriber_id uuid,
  clinic_id uuid,
  membership_id uuid,
  subscription_id uuid,
  subscriber_number text,
  clinic_number text,
  attempt_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registration public.registrations%rowtype;
  v_plan public.plans%rowtype;
  v_payment public.payments%rowtype;
  v_attempt public.registration_provisioning_attempts%rowtype;
  v_profile public.profiles%rowtype;
  v_auth_email text;
  v_approved_payment_count integer;
  v_authoritative_amount bigint;
  v_subscriber_id uuid;
  v_clinic_id uuid;
  v_membership_id uuid;
  v_subscription_id uuid;
  v_subscriber_number text;
  v_clinic_number text;
  v_now timestamptz := now();
begin
  if not exists (
    select 1 from public.platform_admins admin where admin.user_id = p_actor_user_id
  ) then
    raise exception 'Only a platform administrator can approve a registration.';
  end if;

  select registration.* into v_registration
  from public.registrations registration
  where registration.id = p_registration_id
  for update;
  if not found then raise exception 'Registration was not found.'; end if;

  select attempt.* into v_attempt
  from public.registration_provisioning_attempts attempt
  where attempt.id = p_provisioning_attempt_id
    and attempt.registration_id = v_registration.id
  for update;
  if not found then raise exception 'Provisioning attempt was not found for this registration.'; end if;

  if v_registration.provisioned_at is not null then
    if v_attempt.status not in ('database_provisioned', 'completed')
      or v_attempt.auth_user_id is distinct from p_owner_user_id then
      raise exception 'Completed provisioning identity does not match this request.';
    end if;

    select subscriber.id, subscriber.subscriber_number
      into v_subscriber_id, v_subscriber_number
    from public.subscribers subscriber
    where subscriber.registration_id = v_registration.id;
    select clinic.id, clinic.clinic_number into v_clinic_id, v_clinic_number
    from public.clinics clinic
    where clinic.subscriber_id = v_subscriber_id and clinic.is_primary
    order by clinic.created_at limit 1;
    select membership.id into v_membership_id
    from public.subscriber_memberships membership
    where membership.subscriber_id = v_subscriber_id
      and membership.user_id = p_owner_user_id
      and membership.role = 'clinic_owner';
    select subscription.id into v_subscription_id
    from public.subscriptions subscription
    where subscription.subscriber_id = v_subscriber_id
      and subscription.status in ('pending', 'active', 'expiring_soon', 'suspended')
    order by subscription.created_at limit 1;

    return query select v_subscriber_id, v_clinic_id, v_membership_id,
      v_subscription_id, v_subscriber_number, v_clinic_number, v_attempt.status;
    return;
  end if;

  if v_attempt.status <> 'claimed' then
    raise exception 'Provisioning attempt is not currently claimed.';
  end if;
  if v_attempt.owner_email_normalized <> lower(btrim(v_registration.owner_email)) then
    raise exception 'Provisioning attempt email does not match the registration.';
  end if;
  if v_attempt.auth_user_id is not null and v_attempt.auth_user_id <> p_owner_user_id then
    raise exception 'Provisioning attempt Auth identity does not match this request.';
  end if;
  if v_registration.email_verified_at is null
    or v_registration.registration_status <> 'pending_review'
    or v_registration.payment_status <> 'approved' then
    raise exception 'Registration is not eligible for approval.';
  end if;

  select plan.* into v_plan
  from public.plans plan
  where plan.id = v_registration.plan_id and plan.status = 'active';
  if not found then raise exception 'Registration has no active subscription plan.'; end if;

  select count(*)::integer into v_approved_payment_count
  from public.payments payment
  where payment.registration_id = v_registration.id and payment.status = 'approved';
  if v_approved_payment_count <> 1 then
    raise exception 'Exactly one approved payment is required for provisioning.';
  end if;
  select payment.* into v_payment
  from public.payments payment
  where payment.registration_id = v_registration.id and payment.status = 'approved'
  for update;

  v_authoritative_amount := case
    when v_registration.billing_cycle = 'annual'
      then coalesce(v_plan.annual_amount_centavos, v_plan.monthly_amount_centavos * 12)
    else v_plan.monthly_amount_centavos
  end;
  if v_payment.amount_centavos <> v_authoritative_amount then
    raise exception 'Approved payment amount does not match the authoritative registration amount.';
  end if;

  if nullif(btrim(v_registration.clinic_name), '') is null
    or nullif(btrim(v_registration.clinic_email), '') is null
    or nullif(btrim(v_registration.clinic_address), '') is null
    or nullif(btrim(v_registration.clinic_city), '') is null
    or nullif(btrim(v_registration.clinic_province), '') is null then
    raise exception 'Complete structured clinic address information is required before provisioning.';
  end if;

  select lower(btrim(auth_user.email)) into v_auth_email
  from auth.users auth_user
  where auth_user.id = p_owner_user_id
    and auth_user.email_confirmed_at is not null;
  if not found then raise exception 'A confirmed Auth account is required.'; end if;

  select profile.* into v_profile
  from public.profiles profile
  where profile.id = p_owner_user_id;
  if not found then raise exception 'A public profile is required for the owner Auth account.'; end if;
  if v_auth_email <> lower(btrim(v_registration.owner_email))
    or lower(btrim(v_profile.email)) <> lower(btrim(v_registration.owner_email)) then
    raise exception 'Auth, profile, and registration emails must match.';
  end if;

  if exists (select 1 from public.platform_admins admin where admin.user_id = p_owner_user_id) then
    raise exception 'A Platform Admin identity cannot be provisioned automatically as a Clinic Owner.';
  end if;
  if exists (
    select 1 from public.subscriber_memberships membership
    where membership.user_id = p_owner_user_id
  ) then
    raise exception 'The owner Auth identity is already linked to a subscriber.';
  end if;
  if exists (
    select 1 from public.subscribers subscriber
    where lower(btrim(subscriber.email)) = lower(btrim(v_registration.owner_email))
  ) then
    raise exception 'The owner email is already linked to another subscriber.';
  end if;

  update public.profiles profile
  set email = lower(btrim(v_registration.owner_email)),
      display_name = v_registration.owner_name,
      mobile_number = nullif(btrim(v_registration.owner_mobile), ''),
      address = nullif(btrim(v_registration.owner_address), ''),
      updated_at = v_now
  where profile.id = p_owner_user_id;

  v_subscriber_number := 'SUB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  v_clinic_number := 'CLN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  insert into public.subscribers (
    subscriber_number, registration_id, business_name, email,
    mobile_number, account_status, activated_at
  ) values (
    v_subscriber_number, v_registration.id, v_registration.clinic_name,
    lower(btrim(v_registration.owner_email)), v_registration.owner_mobile,
    'active', v_now
  ) returning id into v_subscriber_id;

  insert into public.subscriber_memberships (
    subscriber_id, user_id, role, account_status, activated_at, must_change_password
  ) values (
    v_subscriber_id, p_owner_user_id, 'clinic_owner', 'active', v_now, true
  ) returning id into v_membership_id;

  insert into public.subscriptions (
    subscriber_id, plan_id, status, starts_at, expires_at,
    billing_cycle, amount_centavos, source_payment_id
  ) values (
    v_subscriber_id,
    v_registration.plan_id,
    'active',
    v_now,
    case when v_registration.billing_cycle = 'annual'
      then v_now + interval '1 year'
      else v_now + interval '1 month'
    end,
    v_registration.billing_cycle,
    v_payment.amount_centavos,
    v_payment.id
  ) returning id into v_subscription_id;

  insert into public.clinics (
    subscriber_id, clinic_number, branch_type, name, email, contact_number,
    address_line_1, city, province, postal_code, country, timezone,
    status, is_primary, activated_at
  ) values (
    v_subscriber_id, v_clinic_number, 'main', v_registration.clinic_name,
    lower(btrim(v_registration.clinic_email)), v_registration.clinic_mobile,
    btrim(v_registration.clinic_address), btrim(v_registration.clinic_city),
    btrim(v_registration.clinic_province), nullif(btrim(v_registration.clinic_postal_code), ''),
    'Philippines', 'Asia/Manila', 'active', true, v_now
  ) returning id into v_clinic_id;

  update public.payments payment
  set subscriber_id = v_subscriber_id
  where payment.id = v_payment.id;

  update public.registrations registration
  set registration_status = 'approved', payment_status = 'approved',
      reviewed_at = coalesce(registration.reviewed_at, v_now),
      reviewed_by = p_actor_user_id, provisioned_at = v_now
  where registration.id = v_registration.id;

  update public.registration_provisioning_attempts attempt
  set status = 'database_provisioned', auth_user_id = p_owner_user_id,
      subscriber_id = v_subscriber_id, clinic_id = v_clinic_id,
      subscription_id = v_subscription_id, completed_at = v_now,
      failed_at = null, failure_code = null
  where attempt.id = v_attempt.id
  returning attempt.* into v_attempt;

  insert into public.audit_events (
    actor_user_id, subscriber_id, clinic_id, event_type, entity_type, entity_id, metadata
  ) values
  (
    p_actor_user_id, v_subscriber_id, v_clinic_id,
    'platform.registration.approved', 'registration', v_registration.id,
    jsonb_build_object('payment_id', v_payment.id, 'subscription_id', v_subscription_id)
  ),
  (
    p_actor_user_id, v_subscriber_id, v_clinic_id,
    'platform.provisioning.completed', 'registration_provisioning_attempt', v_attempt.id,
    jsonb_build_object(
      'registration_id', v_registration.id,
      'membership_id', v_membership_id,
      'subscription_id', v_subscription_id
    )
  );

  return query select v_subscriber_id, v_clinic_id, v_membership_id,
    v_subscription_id, v_subscriber_number, v_clinic_number, v_attempt.status;
end;
$$;

revoke execute on function public.review_registration_payment_atomic(uuid, uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.reject_registration_atomic(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.begin_registration_provisioning(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.fail_registration_provisioning_attempt(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.approve_registration_provisioning(uuid, uuid, uuid, uuid) from public, anon, authenticated;

grant execute on function public.review_registration_payment_atomic(uuid, uuid, uuid, text, text) to service_role;
grant execute on function public.reject_registration_atomic(uuid, uuid, text) to service_role;
grant execute on function public.begin_registration_provisioning(uuid, uuid) to service_role;
grant execute on function public.fail_registration_provisioning_attempt(uuid, uuid, text) to service_role;
grant execute on function public.approve_registration_provisioning(uuid, uuid, uuid, uuid) to service_role;
