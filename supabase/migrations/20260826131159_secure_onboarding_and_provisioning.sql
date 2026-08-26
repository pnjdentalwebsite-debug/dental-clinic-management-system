-- Secure onboarding and account-provisioning contract.
-- These procedures are invoked only by trusted Edge Functions using the
-- service role. They are deliberately not callable by browser roles.

alter table public.registrations
  add column if not exists billing_cycle text not null default 'monthly'
    check (billing_cycle in ('monthly', 'annual'));

alter table public.subscriber_memberships
  add column if not exists must_change_password boolean not null default false,
  add column if not exists password_changed_at timestamptz;

create or replace function public.approve_registration_provisioning(
  p_registration_id uuid,
  p_owner_user_id uuid,
  p_actor_user_id uuid
)
returns table (
  subscriber_id uuid,
  clinic_id uuid,
  membership_id uuid,
  subscriber_number text,
  clinic_number text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registration public.registrations%rowtype;
  v_payment_id uuid;
  v_subscriber_id uuid;
  v_clinic_id uuid;
  v_membership_id uuid;
  v_subscriber_number text;
  v_clinic_number text;
begin
  if not exists (
    select 1 from public.platform_admins admin
    where admin.user_id = p_actor_user_id
  ) then
    raise exception 'Only a platform administrator can approve a registration.';
  end if;

  select * into v_registration
  from public.registrations registration
  where registration.id = p_registration_id
  for update;

  if not found then
    raise exception 'Registration was not found.';
  end if;

  -- Approval is idempotent. A retry must return the already-provisioned scope
  -- instead of creating another subscriber or clinic.
  if v_registration.provisioned_at is not null then
    select subscriber.id, subscriber.subscriber_number
      into v_subscriber_id, v_subscriber_number
    from public.subscribers subscriber
    where subscriber.registration_id = v_registration.id;

    select clinic.id, clinic.clinic_number
      into v_clinic_id, v_clinic_number
    from public.clinics clinic
    where clinic.subscriber_id = v_subscriber_id and clinic.is_primary
    order by clinic.created_at asc
    limit 1;

    select membership.id into v_membership_id
    from public.subscriber_memberships membership
    where membership.subscriber_id = v_subscriber_id
      and membership.user_id = p_owner_user_id
      and membership.role = 'clinic_owner'
    limit 1;

    return query select v_subscriber_id, v_clinic_id, v_membership_id, v_subscriber_number, v_clinic_number;
    return;
  end if;

  if v_registration.payment_status <> 'pending_verification'
    or v_registration.registration_status <> 'pending_review' then
    raise exception 'Registration is not awaiting payment approval.';
  end if;

  if v_registration.plan_id is null then
    raise exception 'Registration has no active subscription plan.';
  end if;

  select payment.id into v_payment_id
  from public.payments payment
  where payment.registration_id = v_registration.id
    and payment.status = 'pending_verification'
  order by payment.submitted_at desc
  limit 1
  for update;

  if v_payment_id is null then
    raise exception 'No pending payment was found for this registration.';
  end if;

  v_subscriber_number := 'SUB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  v_clinic_number := 'CLN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  insert into public.subscribers (
    subscriber_number, registration_id, business_name, email, mobile_number, account_status, activated_at
  ) values (
    v_subscriber_number,
    v_registration.id,
    v_registration.clinic_name,
    lower(v_registration.owner_email),
    v_registration.owner_mobile,
    'active',
    now()
  ) returning id into v_subscriber_id;

  insert into public.subscriber_memberships (
    subscriber_id, user_id, role, account_status, activated_at, must_change_password
  ) values (
    v_subscriber_id, p_owner_user_id, 'clinic_owner', 'active', now(), true
  ) returning id into v_membership_id;

  insert into public.subscriptions (subscriber_id, plan_id, status, starts_at)
  values (v_subscriber_id, v_registration.plan_id, 'active', now());

  insert into public.clinics (
    subscriber_id, clinic_number, branch_type, name, email, contact_number,
    address_line_1, city, province, status, is_primary, activated_at
  ) values (
    v_subscriber_id,
    v_clinic_number,
    'main',
    v_registration.clinic_name,
    lower(v_registration.clinic_email),
    v_registration.clinic_mobile,
    coalesce(nullif(btrim(v_registration.clinic_address), ''), 'Address pending'),
    'Unspecified',
    'Unspecified',
    'active',
    true,
    now()
  ) returning id into v_clinic_id;

  update public.payments
  set subscriber_id = v_subscriber_id,
      status = 'approved',
      reviewed_at = now(),
      reviewed_by = p_actor_user_id
  where id = v_payment_id;

  update public.registrations
  set payment_status = 'approved',
      registration_status = 'approved',
      reviewed_at = now(),
      reviewed_by = p_actor_user_id,
      provisioned_at = now()
  where id = v_registration.id;

  return query select v_subscriber_id, v_clinic_id, v_membership_id, v_subscriber_number, v_clinic_number;
end;
$$;

create or replace function public.provision_member_account(
  p_subscriber_id uuid,
  p_actor_user_id uuid,
  p_user_id uuid,
  p_role public.app_role,
  p_first_name text,
  p_middle_name text,
  p_last_name text,
  p_mobile_number text,
  p_address text,
  p_position text,
  p_license_number text,
  p_ptr_number text,
  p_s2_license_number text,
  p_designation text,
  p_specialization text,
  p_calendar_color text,
  p_certificates_and_qualifications text,
  p_clinic_ids uuid[]
)
returns table (membership_id uuid, personnel_number text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_personnel_number text;
  v_clinic_id uuid;
begin
  if p_role not in ('staff', 'associate') then
    raise exception 'Only staff and associate accounts can be provisioned here.';
  end if;

  if not exists (
    select 1 from public.subscriber_memberships owner_membership
    where owner_membership.subscriber_id = p_subscriber_id
      and owner_membership.user_id = p_actor_user_id
      and owner_membership.role = 'clinic_owner'
      and owner_membership.account_status = 'active'
  ) and not exists (
    select 1 from public.platform_admins admin where admin.user_id = p_actor_user_id
  ) then
    raise exception 'Only the active clinic owner can provision this account.';
  end if;

  if coalesce(array_length(p_clinic_ids, 1), 0) = 0 then
    raise exception 'At least one authorized clinic is required.';
  end if;

  if exists (
    select 1
    from unnest(p_clinic_ids) clinic_id
    left join public.clinics clinic on clinic.id = clinic_id
    where clinic.id is null
      or clinic.subscriber_id <> p_subscriber_id
      or clinic.status <> 'active'
  ) then
    raise exception 'Every authorized clinic must be active and belong to this subscriber.';
  end if;

  insert into public.profiles (id, email, first_name, middle_name, last_name, mobile_number, address)
  select p_user_id, lower(user_record.email), nullif(btrim(p_first_name), ''), nullif(btrim(p_middle_name), ''),
         nullif(btrim(p_last_name), ''), nullif(btrim(p_mobile_number), ''), nullif(btrim(p_address), '')
  from auth.users user_record
  where user_record.id = p_user_id
  on conflict (id) do update set
    first_name = excluded.first_name,
    middle_name = excluded.middle_name,
    last_name = excluded.last_name,
    mobile_number = excluded.mobile_number,
    address = excluded.address,
    updated_at = now();

  if not found then
    raise exception 'The Auth account was not found.';
  end if;

  insert into public.subscriber_memberships (
    subscriber_id, user_id, role, account_status, activated_at, must_change_password
  ) values (
    p_subscriber_id, p_user_id, p_role, 'active', now(), true
  ) returning id into v_membership_id;

  if p_role = 'staff' then
    if nullif(btrim(p_position), '') is null then
      raise exception 'A staff position is required.';
    end if;
    v_personnel_number := 'STF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    insert into public.staff_profiles (membership_id, subscriber_id, staff_number, position, phone_number)
    values (v_membership_id, p_subscriber_id, v_personnel_number, btrim(p_position), nullif(btrim(p_mobile_number), ''));
  else
    if nullif(btrim(p_license_number), '') is null
      or nullif(btrim(p_ptr_number), '') is null
      or nullif(btrim(p_s2_license_number), '') is null
      or nullif(btrim(p_designation), '') is null
      or nullif(btrim(p_specialization), '') is null then
      raise exception 'Associate license, PTR, S2, designation, and specialization are required.';
    end if;
    v_personnel_number := 'DEN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    insert into public.associate_dentist_profiles (
      membership_id, subscriber_id, associate_number, license_number, ptr_number, s2_license_number,
      designation, specialization, calendar_color, certificates_and_qualifications
    ) values (
      v_membership_id, p_subscriber_id, v_personnel_number, btrim(p_license_number), btrim(p_ptr_number),
      btrim(p_s2_license_number), btrim(p_designation), btrim(p_specialization),
      coalesce(nullif(btrim(p_calendar_color), ''), '#2563eb'), nullif(btrim(p_certificates_and_qualifications), '')
    );
  end if;

  foreach v_clinic_id in array p_clinic_ids loop
    insert into public.clinic_assignments (
      subscriber_id, clinic_id, membership_id, assignment_role, status, assigned_by
    ) values (
      p_subscriber_id, v_clinic_id, v_membership_id, p_role, 'active', p_actor_user_id
    );
  end loop;

  return query select v_membership_id, v_personnel_number;
end;
$$;

revoke all on function public.approve_registration_provisioning(uuid, uuid, uuid) from public;
revoke all on function public.provision_member_account(uuid, uuid, uuid, public.app_role, text, text, text, text, text, text, text, text, text, text, text, text, text, uuid[]) from public;
grant execute on function public.approve_registration_provisioning(uuid, uuid, uuid) to service_role;
grant execute on function public.provision_member_account(uuid, uuid, uuid, public.app_role, text, text, text, text, text, text, text, text, text, text, text, text, text, uuid[]) to service_role;
