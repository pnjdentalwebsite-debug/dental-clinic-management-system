-- Phase 1C public registration backend foundation.
-- Additive only: no tenant, clinic, subscriber, or Auth account is provisioned.

alter table public.registrations
  add column if not exists owner_city text,
  add column if not exists owner_province text,
  add column if not exists owner_postal_code text,
  add column if not exists clinic_city text,
  add column if not exists clinic_province text,
  add column if not exists clinic_postal_code text,
  add column if not exists dentist_count integer,
  add column if not exists staff_count integer,
  add column if not exists location_count integer,
  add column if not exists works_with_laboratory boolean not null default false,
  add column if not exists laboratory_name text;

alter table public.registrations
  add constraint registrations_dentist_count_nonnegative check (dentist_count is null or dentist_count >= 0),
  add constraint registrations_staff_count_nonnegative check (staff_count is null or staff_count >= 0),
  add constraint registrations_location_count_nonnegative check (location_count is null or location_count >= 0),
  add constraint registrations_laboratory_consistency check (
    works_with_laboratory or laboratory_name is null or btrim(laboratory_name) = ''
  );

create table public.registration_email_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  owner_email_normalized text not null check (owner_email_normalized = lower(btrim(owner_email_normalized))),
  otp_hash text not null check (length(otp_hash) = 64),
  expires_at timestamptz not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts between 1 and 10),
  sent_at timestamptz not null default now(),
  resend_available_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (resend_available_at >= sent_at),
  check (attempt_count <= max_attempts)
);

create unique index registration_email_otp_one_active
  on public.registration_email_otp_challenges (registration_id, owner_email_normalized)
  where consumed_at is null;

create index registration_email_otp_registration_created
  on public.registration_email_otp_challenges (registration_id, created_at desc);

create unique index payments_one_pending_registration
  on public.payments (registration_id)
  where registration_id is not null and status = 'pending_verification';

alter table public.registration_email_otp_challenges enable row level security;
revoke all on table public.registration_email_otp_challenges from public, anon, authenticated;
grant select, insert, update, delete on table public.registration_email_otp_challenges to service_role;

-- Edge Functions are now the only authoritative public registration write path.
drop policy if exists registrations_submit_public on public.registrations;

create or replace function public.verify_registration_email_otp(
  p_registration_id uuid,
  p_owner_email text,
  p_otp_hash text
)
returns table (verified_at timestamptz, registration_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registration public.registrations%rowtype;
  v_challenge public.registration_email_otp_challenges%rowtype;
begin
  select * into v_registration
  from public.registrations registration
  where registration.id = p_registration_id
    and lower(btrim(registration.owner_email)) = lower(btrim(p_owner_email))
  for update;

  if not found then raise exception 'Verification failed.'; end if;
  if v_registration.email_verified_at is not null then
    return query select v_registration.email_verified_at, v_registration.registration_status;
    return;
  end if;
  if v_registration.registration_status <> 'pending_verification' then raise exception 'Verification failed.'; end if;

  select * into v_challenge
  from public.registration_email_otp_challenges challenge
  where challenge.registration_id = p_registration_id
    and challenge.owner_email_normalized = lower(btrim(p_owner_email))
    and challenge.consumed_at is null
  order by challenge.created_at desc
  limit 1
  for update;

  if not found or v_challenge.expires_at <= now() or v_challenge.attempt_count >= v_challenge.max_attempts then
    raise exception 'Verification failed.';
  end if;

  if v_challenge.otp_hash <> p_otp_hash then
    update public.registration_email_otp_challenges
    set attempt_count = attempt_count + 1
    where id = v_challenge.id;
    return;
  end if;

  update public.registration_email_otp_challenges
  set consumed_at = now()
  where id = v_challenge.id;

  update public.registrations
  set email_verified_at = now(), registration_status = 'pending_payment'
  where id = v_registration.id
  returning email_verified_at, public.registrations.registration_status
  into verified_at, registration_status;

  return next;
end;
$$;

create or replace function public.submit_registration_payment_atomic(
  p_registration_id uuid,
  p_owner_email text,
  p_payment_method text,
  p_reference_number text
)
returns table (payment_id uuid, payment_status public.payment_status, amount_centavos bigint, submitted_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registration public.registrations%rowtype;
  v_plan public.plans%rowtype;
  v_payment public.payments%rowtype;
  v_amount bigint;
  v_reference text := nullif(btrim(p_reference_number), '');
begin
  select * into v_registration
  from public.registrations registration
  where registration.id = p_registration_id
    and lower(btrim(registration.owner_email)) = lower(btrim(p_owner_email))
  for update;

  if not found then raise exception 'Registration payment submission failed.'; end if;
  if v_registration.email_verified_at is null then raise exception 'Email verification is required before payment submission.'; end if;
  if v_registration.registration_status not in ('pending_payment', 'pending_review') then
    raise exception 'Registration payment submission failed.';
  end if;

  select * into v_plan from public.plans plan
  where plan.id = v_registration.plan_id and plan.status = 'active';
  if not found then raise exception 'The selected plan is unavailable.'; end if;

  v_amount := case when v_registration.billing_cycle = 'annual'
    then coalesce(v_plan.annual_amount_centavos, v_plan.monthly_amount_centavos * 12)
    else v_plan.monthly_amount_centavos end;

  select * into v_payment from public.payments payment
  where payment.registration_id = v_registration.id
    and payment.status = 'pending_verification'
  order by payment.submitted_at desc limit 1 for update;

  if found then
    if lower(btrim(v_payment.payment_method)) = lower(btrim(p_payment_method))
      and coalesce(lower(btrim(v_payment.reference_number)), '') = coalesce(lower(v_reference), '') then
      return query select v_payment.id, v_payment.status, v_payment.amount_centavos, v_payment.submitted_at;
      return;
    end if;
    raise exception 'A different payment submission is already pending for this registration.';
  end if;

  insert into public.payments (registration_id, payment_method, reference_number, amount_centavos, status)
  values (v_registration.id, btrim(p_payment_method), v_reference, v_amount, 'pending_verification')
  returning * into v_payment;

  update public.registrations
  set payment_status = 'pending_verification', registration_status = 'pending_review'
  where id = v_registration.id;

  return query select v_payment.id, v_payment.status, v_payment.amount_centavos, v_payment.submitted_at;
end;
$$;

revoke all on function public.verify_registration_email_otp(uuid, text, text) from public, anon, authenticated;
revoke all on function public.submit_registration_payment_atomic(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.verify_registration_email_otp(uuid, text, text) to service_role;
grant execute on function public.submit_registration_payment_atomic(uuid, text, text, text) to service_role;
