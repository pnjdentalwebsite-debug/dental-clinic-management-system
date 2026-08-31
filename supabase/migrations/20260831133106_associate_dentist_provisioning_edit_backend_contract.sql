-- Phase 2E.3C.2A: Associate Dentist provisioning and edit contract.
--
-- The browser never receives direct write policies for Associate memberships,
-- professional profiles, or clinic assignments. The Associate-specific Edge
-- Function is the only caller of these service_role-only RPCs. Its verified
-- actor is still revalidated here before every authoritative write.

create table public.associate_provisioning_attempts (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.subscribers(id) on delete restrict,
  actor_user_id uuid not null references public.profiles(id) on delete restrict,
  email_normalized text not null check (email_normalized = lower(btrim(email_normalized))),
  request_payload jsonb not null,
  status text not null default 'claimed'
    check (status in ('claimed', 'database_provisioned', 'completed', 'failed')),
  auth_user_id uuid references public.profiles(id) on delete restrict,
  auth_user_created_by_attempt boolean not null default false,
  membership_id uuid unique references public.subscriber_memberships(id) on delete restrict,
  credential_delivery_status text not null default 'pending'
    check (credential_delivery_status in ('pending', 'sent', 'failed')),
  credential_sent_at timestamptz,
  failure_code text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscriber_id, email_normalized),
  check (jsonb_typeof(request_payload) = 'object'),
  check (failure_code is null or length(failure_code) <= 120),
  check ((credential_delivery_status = 'sent') or credential_sent_at is null),
  check ((status = 'failed') or failed_at is null),
  check ((status in ('database_provisioned', 'completed')) or completed_at is null)
);

create index associate_provisioning_attempts_status_started_idx
  on public.associate_provisioning_attempts (status, started_at);

alter table public.associate_provisioning_attempts enable row level security;
revoke all on table public.associate_provisioning_attempts from public, anon, authenticated;
grant select, insert, update, delete on table public.associate_provisioning_attempts to service_role;

create trigger associate_provisioning_attempts_set_updated_at
  before update on public.associate_provisioning_attempts
  for each row execute function app_private.set_updated_at();

create function app_private.resolve_associate_provisioning_owner(p_actor_user_id uuid)
returns table (
  actor_user_id uuid,
  membership_id uuid,
  subscriber_id uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_active_owner_count integer;
  v_membership public.subscriber_memberships%rowtype;
begin
  if p_actor_user_id is null then
    raise exception using errcode = 'PT401', message = 'AUTH_REQUIRED';
  end if;

  select count(*)::integer
  into v_active_owner_count
  from public.subscriber_memberships membership
  where membership.user_id = p_actor_user_id
    and membership.role = 'clinic_owner'
    and membership.account_status = 'active';

  if v_active_owner_count = 0 then
    raise exception using errcode = 'PT403', message = 'CLINIC_OWNER_ACCESS_REQUIRED';
  end if;
  if v_active_owner_count > 1 then
    raise exception using errcode = 'PT409', message = 'CLINIC_OWNER_CONTEXT_AMBIGUOUS';
  end if;

  select membership.*
  into strict v_membership
  from public.subscriber_memberships membership
  where membership.user_id = p_actor_user_id
    and membership.role = 'clinic_owner'
    and membership.account_status = 'active';

  if v_membership.must_change_password then
    raise exception using errcode = 'PT403', message = 'FIRST_LOGIN_REQUIRED';
  end if;

  return query select p_actor_user_id, v_membership.id, v_membership.subscriber_id;
exception
  when sqlstate 'P0003' then
    raise exception using errcode = 'PT409', message = 'CLINIC_OWNER_CONTEXT_AMBIGUOUS';
  when sqlstate 'P0002' then
    raise exception using errcode = 'PT403', message = 'CLINIC_OWNER_ACCESS_REQUIRED';
end;
$$;

create function app_private.normalize_associate_create_input(p_input jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_allowed_keys constant text[] := array[
    'email', 'firstName', 'middleName', 'lastName', 'mobileNumber', 'address',
    'licenseNumber', 'ptrNumber', 's2LicenseNumber', 'designation',
    'specialization', 'calendarColor', 'certificatesAndQualifications', 'clinicIds'
  ];
  v_key text;
  v_email text;
  v_first_name text;
  v_middle_name text;
  v_last_name text;
  v_mobile_number text;
  v_address text;
  v_license_number text;
  v_ptr_number text;
  v_s2_license_number text;
  v_designation text;
  v_specialization text;
  v_calendar_color text;
  v_certificates text;
  v_clinic_ids uuid[];
  v_clinic_id text;
begin
  if p_input is null or jsonb_typeof(p_input) <> 'object' then
    raise exception using errcode = 'PT422', message = 'INVALID_ASSOCIATE_INPUT';
  end if;

  for v_key in select jsonb_object_keys(p_input) loop
    if not (v_key = any(v_allowed_keys)) then
      raise exception using errcode = 'PT422', message = 'INVALID_ASSOCIATE_INPUT';
    end if;
  end loop;

  v_email := lower(nullif(btrim(p_input ->> 'email'), ''));
  v_first_name := nullif(btrim(p_input ->> 'firstName'), '');
  v_last_name := nullif(btrim(p_input ->> 'lastName'), '');
  v_license_number := nullif(btrim(p_input ->> 'licenseNumber'), '');
  v_ptr_number := nullif(btrim(p_input ->> 'ptrNumber'), '');
  v_s2_license_number := nullif(btrim(p_input ->> 's2LicenseNumber'), '');
  v_designation := nullif(btrim(p_input ->> 'designation'), '');
  v_specialization := nullif(btrim(p_input ->> 'specialization'), '');

  if v_email is null or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    or v_first_name is null or v_last_name is null
    or v_license_number is null or v_ptr_number is null or v_s2_license_number is null
    or v_designation is null or v_specialization is null then
    raise exception using errcode = 'PT422', message = 'INVALID_ASSOCIATE_INPUT';
  end if;

  if length(v_email) > 254 or length(v_first_name) > 120 or length(v_last_name) > 120
    or length(v_license_number) > 120 or length(v_ptr_number) > 120
    or length(v_s2_license_number) > 120 or length(v_designation) > 120
    or length(v_specialization) > 120 then
    raise exception using errcode = 'PT422', message = 'INVALID_ASSOCIATE_INPUT';
  end if;

  v_middle_name := nullif(btrim(p_input ->> 'middleName'), '');
  v_mobile_number := nullif(btrim(p_input ->> 'mobileNumber'), '');
  v_address := nullif(btrim(p_input ->> 'address'), '');
  v_calendar_color := coalesce(nullif(btrim(p_input ->> 'calendarColor'), ''), '#2563eb');
  v_certificates := nullif(btrim(p_input ->> 'certificatesAndQualifications'), '');
  if (v_middle_name is not null and length(v_middle_name) > 120)
    or (v_mobile_number is not null and length(v_mobile_number) > 80)
    or (v_address is not null and length(v_address) > 1000)
    or length(v_calendar_color) > 20
    or v_calendar_color !~ '^#[0-9A-Fa-f]{6}$'
    or (v_certificates is not null and length(v_certificates) > 4000) then
    raise exception using errcode = 'PT422', message = 'INVALID_ASSOCIATE_INPUT';
  end if;

  if jsonb_typeof(p_input -> 'clinicIds') <> 'array'
    or jsonb_array_length(p_input -> 'clinicIds') = 0 then
    raise exception using errcode = 'PT422', message = 'INVALID_CLINIC_ASSIGNMENT';
  end if;
  for v_clinic_id in select jsonb_array_elements_text(p_input -> 'clinicIds') loop
    if v_clinic_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception using errcode = 'PT422', message = 'INVALID_CLINIC_ASSIGNMENT';
    end if;
  end loop;
  select array_agg(value::uuid order by value::uuid)
  into v_clinic_ids
  from jsonb_array_elements_text(p_input -> 'clinicIds') entry(value);
  if cardinality(v_clinic_ids) <> cardinality(array(select distinct id from unnest(v_clinic_ids) id)) then
    raise exception using errcode = 'PT422', message = 'INVALID_CLINIC_ASSIGNMENT';
  end if;

  return jsonb_strip_nulls(jsonb_build_object(
    'email', v_email,
    'firstName', v_first_name,
    'middleName', v_middle_name,
    'lastName', v_last_name,
    'mobileNumber', v_mobile_number,
    'address', v_address,
    'licenseNumber', v_license_number,
    'ptrNumber', v_ptr_number,
    's2LicenseNumber', v_s2_license_number,
    'designation', v_designation,
    'specialization', v_specialization,
    'calendarColor', v_calendar_color,
    'certificatesAndQualifications', v_certificates,
    'clinicIds', to_jsonb(v_clinic_ids)
  ));
end;
$$;

create function app_private.normalize_associate_edit_input(p_input jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_allowed_keys constant text[] := array[
    'firstName', 'middleName', 'lastName', 'mobileNumber', 'address',
    'licenseNumber', 'ptrNumber', 's2LicenseNumber', 'designation',
    'specialization', 'calendarColor', 'certificatesAndQualifications', 'clinicIds'
  ];
  v_key text;
  v_result jsonb := '{}'::jsonb;
  v_value text;
  v_clinic_ids uuid[];
  v_clinic_id text;
begin
  if p_input is null or jsonb_typeof(p_input) <> 'object' or p_input = '{}'::jsonb then
    raise exception using errcode = 'PT422', message = 'INVALID_ASSOCIATE_INPUT';
  end if;
  for v_key in select jsonb_object_keys(p_input) loop
    if not (v_key = any(v_allowed_keys)) then
      raise exception using errcode = 'PT422', message = 'INVALID_ASSOCIATE_INPUT';
    end if;
  end loop;

  foreach v_key in array array['firstName', 'lastName', 'licenseNumber', 'ptrNumber', 's2LicenseNumber', 'designation', 'specialization'] loop
    if p_input ? v_key then
      v_value := nullif(btrim(p_input ->> v_key), '');
      if v_value is null or length(v_value) > 120 then
        raise exception using errcode = 'PT422', message = 'INVALID_ASSOCIATE_INPUT';
      end if;
      v_result := v_result || jsonb_build_object(v_key, v_value);
    end if;
  end loop;

  foreach v_key in array array['middleName', 'mobileNumber', 'address', 'certificatesAndQualifications'] loop
    if p_input ? v_key then
      v_value := nullif(btrim(p_input ->> v_key), '');
      if (v_key = 'middleName' and v_value is not null and length(v_value) > 120)
        or (v_key = 'mobileNumber' and v_value is not null and length(v_value) > 80)
        or (v_key = 'address' and v_value is not null and length(v_value) > 1000)
        or (v_key = 'certificatesAndQualifications' and v_value is not null and length(v_value) > 4000) then
        raise exception using errcode = 'PT422', message = 'INVALID_ASSOCIATE_INPUT';
      end if;
      v_result := v_result || jsonb_build_object(v_key, v_value);
    end if;
  end loop;

  if p_input ? 'calendarColor' then
    v_value := nullif(btrim(p_input ->> 'calendarColor'), '');
    if v_value is null or length(v_value) > 20 or v_value !~ '^#[0-9A-Fa-f]{6}$' then
      raise exception using errcode = 'PT422', message = 'INVALID_ASSOCIATE_INPUT';
    end if;
    v_result := v_result || jsonb_build_object('calendarColor', v_value);
  end if;

  if p_input ? 'clinicIds' then
    if jsonb_typeof(p_input -> 'clinicIds') <> 'array' or jsonb_array_length(p_input -> 'clinicIds') = 0 then
      raise exception using errcode = 'PT422', message = 'INVALID_CLINIC_ASSIGNMENT';
    end if;
    for v_clinic_id in select jsonb_array_elements_text(p_input -> 'clinicIds') loop
      if v_clinic_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
        raise exception using errcode = 'PT422', message = 'INVALID_CLINIC_ASSIGNMENT';
      end if;
    end loop;
    select array_agg(value::uuid order by value::uuid)
    into v_clinic_ids
    from jsonb_array_elements_text(p_input -> 'clinicIds') entry(value);
    if cardinality(v_clinic_ids) <> cardinality(array(select distinct id from unnest(v_clinic_ids) id)) then
      raise exception using errcode = 'PT422', message = 'INVALID_CLINIC_ASSIGNMENT';
    end if;
    v_result := v_result || jsonb_build_object('clinicIds', to_jsonb(v_clinic_ids));
  end if;
  return v_result;
end;
$$;

create function app_private.resolve_associate_quota(p_limits jsonb)
returns table (quota_type text, quota_value bigint)
language plpgsql
immutable
security definer
set search_path = ''
as $$
declare
  v_entry_count integer;
  v_entry jsonb;
  v_type text;
  v_numeric_value numeric;
begin
  if p_limits is null or jsonb_typeof(p_limits) <> 'array' then
    raise exception using errcode = 'PT409', message = 'SUBSCRIPTION_NOT_ELIGIBLE';
  end if;
  select count(*)::integer, min(entry.value::text)::jsonb
  into v_entry_count, v_entry
  from jsonb_array_elements(p_limits) entry(value)
  where entry.value ->> 'key' = 'associates';
  if v_entry_count <> 1 or v_entry is null or jsonb_typeof(v_entry) <> 'object' then
    raise exception using errcode = 'PT409', message = 'SUBSCRIPTION_NOT_ELIGIBLE';
  end if;
  v_type := v_entry ->> 'type';
  if v_type = 'number' then
    if jsonb_typeof(v_entry -> 'value') <> 'number' or (v_entry ->> 'value') !~ '^(0|[1-9][0-9]*)$' then
      raise exception using errcode = 'PT409', message = 'SUBSCRIPTION_NOT_ELIGIBLE';
    end if;
    v_numeric_value := (v_entry ->> 'value')::numeric;
    if v_numeric_value > 9223372036854775807::numeric then
      raise exception using errcode = 'PT409', message = 'SUBSCRIPTION_NOT_ELIGIBLE';
    end if;
    return query select 'number'::text, v_numeric_value::bigint;
    return;
  end if;
  if v_type = 'unlimited' then
    return query select 'unlimited'::text, null::bigint;
    return;
  end if;
  if v_type = 'not_included' then
    return query select 'not_included'::text, 0::bigint;
    return;
  end if;
  raise exception using errcode = 'PT409', message = 'SUBSCRIPTION_NOT_ELIGIBLE';
end;
$$;

create function app_private.lock_associate_subscription_context(p_subscriber_id uuid)
returns table (subscription_id uuid, plan_id uuid, quota_type text, quota_value bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscriber public.subscribers%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_subscription_count integer;
  v_quota record;
begin
  select subscriber.* into v_subscriber
  from public.subscribers subscriber
  where subscriber.id = p_subscriber_id
  for update;
  if not found or v_subscriber.account_status <> 'active' then
    raise exception using errcode = 'PT409', message = 'SUBSCRIPTION_NOT_ELIGIBLE';
  end if;

  select count(*)::integer into v_subscription_count
  from public.subscriptions subscription
  where subscription.subscriber_id = v_subscriber.id
    and subscription.status in ('active', 'expiring_soon')
    and (subscription.starts_at is null or subscription.starts_at <= now())
    and (subscription.expires_at is null or subscription.expires_at > now());
  if v_subscription_count <> 1 then
    raise exception using errcode = 'PT409', message = 'SUBSCRIPTION_NOT_ELIGIBLE';
  end if;

  select subscription.* into v_subscription
  from public.subscriptions subscription
  where subscription.subscriber_id = v_subscriber.id
    and subscription.status in ('active', 'expiring_soon')
    and (subscription.starts_at is null or subscription.starts_at <= now())
    and (subscription.expires_at is null or subscription.expires_at > now())
  for share;
  select plan.* into v_plan
  from public.plans plan
  where plan.id = v_subscription.plan_id
    and plan.status = 'active'
  for share;
  if not found then
    raise exception using errcode = 'PT409', message = 'SUBSCRIPTION_NOT_ELIGIBLE';
  end if;
  select * into v_quota from app_private.resolve_associate_quota(v_plan.limits);
  return query select v_subscription.id, v_plan.id, v_quota.quota_type, v_quota.quota_value;
end;
$$;

create function app_private.validate_associate_clinic_ids(p_subscriber_id uuid, p_clinic_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_valid_count integer;
begin
  if coalesce(cardinality(p_clinic_ids), 0) = 0 then
    raise exception using errcode = 'PT422', message = 'INVALID_CLINIC_ASSIGNMENT';
  end if;
  select count(*)::integer into v_valid_count
  from public.clinics clinic
  where clinic.id = any(p_clinic_ids)
    and clinic.subscriber_id = p_subscriber_id
    and clinic.status = 'active';
  if v_valid_count <> cardinality(p_clinic_ids) then
    raise exception using errcode = 'PT422', message = 'INVALID_CLINIC_ASSIGNMENT';
  end if;
end;
$$;

create function public.begin_associate_provisioning(
  p_actor_user_id uuid,
  p_input jsonb
)
returns table (
  attempt_id uuid,
  attempt_status text,
  operation text,
  auth_user_id uuid,
  membership_id uuid,
  credential_delivery_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_context record;
  v_input jsonb;
  v_attempt public.associate_provisioning_attempts%rowtype;
  v_clinic_ids uuid[];
  v_quota record;
  v_active_associates bigint;
  v_attempt_found boolean := false;
begin
  select * into v_context from app_private.resolve_associate_provisioning_owner(p_actor_user_id);
  v_input := app_private.normalize_associate_create_input(p_input);
  v_clinic_ids := array(select jsonb_array_elements_text(v_input -> 'clinicIds'))::uuid[];

  select * into v_attempt
  from public.associate_provisioning_attempts attempt
  where attempt.subscriber_id = v_context.subscriber_id
    and attempt.email_normalized = v_input ->> 'email'
  for update;
  v_attempt_found := found;

  if v_attempt_found and v_attempt.status = 'completed' and v_attempt.credential_delivery_status = 'sent' then
    return query select v_attempt.id, v_attempt.status, 'completed'::text, v_attempt.auth_user_id,
      v_attempt.membership_id, v_attempt.credential_delivery_status;
    return;
  end if;
  if v_attempt_found and v_attempt.status in ('database_provisioned', 'completed') then
    if v_attempt.auth_user_id is null or v_attempt.membership_id is null then
      raise exception using errcode = 'PT409', message = 'ASSOCIATE_PROVISIONING_FAILED';
    end if;
    return query select v_attempt.id, v_attempt.status, 'delivery_retry'::text, v_attempt.auth_user_id,
      v_attempt.membership_id, v_attempt.credential_delivery_status;
    return;
  end if;
  if v_attempt_found and v_attempt.status = 'claimed' then
    raise exception using errcode = 'PT409', message = 'ASSOCIATE_PROVISIONING_FAILED';
  end if;
  if v_attempt_found and v_attempt.status = 'failed' and v_attempt.auth_user_id is not null then
    raise exception using errcode = 'PT409', message = 'ASSOCIATE_EMAIL_UNAVAILABLE';
  end if;

  select * into v_quota from app_private.lock_associate_subscription_context(v_context.subscriber_id);
  perform app_private.validate_associate_clinic_ids(v_context.subscriber_id, v_clinic_ids);
  select count(*)::bigint into v_active_associates
  from public.subscriber_memberships membership
  where membership.subscriber_id = v_context.subscriber_id
    and membership.role = 'associate'
    and membership.account_status = 'active';
  if v_quota.quota_type = 'not_included'
    or (v_quota.quota_type = 'number' and v_active_associates >= v_quota.quota_value) then
    raise exception using errcode = 'PT409', message = 'ASSOCIATE_QUOTA_REACHED';
  end if;

  if v_attempt_found then
    update public.associate_provisioning_attempts attempt
    set actor_user_id = v_context.actor_user_id,
        request_payload = v_input,
        status = 'claimed',
        credential_delivery_status = 'pending',
        credential_sent_at = null,
        failure_code = null,
        failed_at = null,
        started_at = now()
    where attempt.id = v_attempt.id
    returning * into v_attempt;
  else
    insert into public.associate_provisioning_attempts (
      subscriber_id, actor_user_id, email_normalized, request_payload, status
    ) values (
      v_context.subscriber_id, v_context.actor_user_id, v_input ->> 'email', v_input, 'claimed'
    ) returning * into v_attempt;
  end if;

  insert into public.audit_events (
    actor_user_id, subscriber_id, event_type, entity_type, entity_id, metadata
  ) values (
    v_context.actor_user_id, v_context.subscriber_id,
    'associate.provisioning.started', 'associate_provisioning_attempt', v_attempt.id,
    jsonb_build_object('email_normalized', v_attempt.email_normalized, 'clinic_ids', to_jsonb(v_clinic_ids))
  );
  return query select v_attempt.id, v_attempt.status, 'create'::text, null::uuid, null::uuid,
    v_attempt.credential_delivery_status;
end;
$$;

create function public.record_associate_provisioning_auth_identity(
  p_attempt_id uuid,
  p_actor_user_id uuid,
  p_auth_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_context record;
  v_attempt public.associate_provisioning_attempts%rowtype;
  v_auth_email text;
begin
  select * into v_context from app_private.resolve_associate_provisioning_owner(p_actor_user_id);
  select attempt.* into v_attempt
  from public.associate_provisioning_attempts attempt
  where attempt.id = p_attempt_id
    and attempt.subscriber_id = v_context.subscriber_id
    and attempt.actor_user_id = v_context.actor_user_id
    and attempt.status = 'claimed'
    and attempt.auth_user_id is null
  for update;
  if not found then
    raise exception using errcode = 'PT409', message = 'ASSOCIATE_PROVISIONING_FAILED';
  end if;
  select lower(btrim(user_record.email)) into v_auth_email
  from auth.users user_record
  where user_record.id = p_auth_user_id;
  if v_auth_email is null or v_auth_email <> v_attempt.email_normalized then
    raise exception using errcode = 'PT409', message = 'ASSOCIATE_EMAIL_UNAVAILABLE';
  end if;
  if exists (
    select 1 from public.subscriber_memberships membership where membership.user_id = p_auth_user_id
  ) then
    raise exception using errcode = 'PT409', message = 'ASSOCIATE_EMAIL_UNAVAILABLE';
  end if;
  update public.associate_provisioning_attempts attempt
  set auth_user_id = p_auth_user_id, auth_user_created_by_attempt = true
  where attempt.id = v_attempt.id;
end;
$$;

create function public.complete_associate_provisioning(
  p_attempt_id uuid,
  p_actor_user_id uuid,
  p_auth_user_id uuid
)
returns table (
  membership_id uuid,
  associate_number text,
  credential_delivery_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_context record;
  v_attempt public.associate_provisioning_attempts%rowtype;
  v_input jsonb;
  v_clinic_ids uuid[];
  v_quota record;
  v_active_associates bigint;
  v_membership_id uuid;
  v_associate_number text;
  v_auth_email text;
  v_created boolean := false;
  v_number_attempts integer := 0;
begin
  select * into v_context from app_private.resolve_associate_provisioning_owner(p_actor_user_id);
  select attempt.* into v_attempt
  from public.associate_provisioning_attempts attempt
  where attempt.id = p_attempt_id
    and attempt.subscriber_id = v_context.subscriber_id
    and attempt.actor_user_id = v_context.actor_user_id
  for update;
  if not found then
    raise exception using errcode = 'PT409', message = 'ASSOCIATE_PROVISIONING_FAILED';
  end if;
  if v_attempt.status in ('database_provisioned', 'completed')
    and v_attempt.auth_user_id = p_auth_user_id
    and v_attempt.membership_id is not null then
    select profile.associate_number into v_associate_number
    from public.associate_dentist_profiles profile
    where profile.membership_id = v_attempt.membership_id;
    return query select v_attempt.membership_id, v_associate_number, v_attempt.credential_delivery_status;
    return;
  end if;
  if v_attempt.status <> 'claimed' or v_attempt.auth_user_id <> p_auth_user_id
    or not v_attempt.auth_user_created_by_attempt then
    raise exception using errcode = 'PT409', message = 'ASSOCIATE_PROVISIONING_FAILED';
  end if;

  select lower(btrim(user_record.email)) into v_auth_email
  from auth.users user_record
  where user_record.id = p_auth_user_id;
  if v_auth_email is null or v_auth_email <> v_attempt.email_normalized
    or exists (select 1 from public.subscriber_memberships membership where membership.user_id = p_auth_user_id) then
    raise exception using errcode = 'PT409', message = 'ASSOCIATE_EMAIL_UNAVAILABLE';
  end if;

  v_input := v_attempt.request_payload;
  v_clinic_ids := array(select jsonb_array_elements_text(v_input -> 'clinicIds'))::uuid[];
  select * into v_quota from app_private.lock_associate_subscription_context(v_context.subscriber_id);
  perform app_private.validate_associate_clinic_ids(v_context.subscriber_id, v_clinic_ids);
  select count(*)::bigint into v_active_associates
  from public.subscriber_memberships membership
  where membership.subscriber_id = v_context.subscriber_id
    and membership.role = 'associate'
    and membership.account_status = 'active';
  if v_quota.quota_type = 'not_included'
    or (v_quota.quota_type = 'number' and v_active_associates >= v_quota.quota_value) then
    raise exception using errcode = 'PT409', message = 'ASSOCIATE_QUOTA_REACHED';
  end if;

  insert into public.profiles (id, email, first_name, middle_name, last_name, mobile_number, address)
  values (
    p_auth_user_id, v_attempt.email_normalized, v_input ->> 'firstName', nullif(v_input ->> 'middleName', ''),
    v_input ->> 'lastName', nullif(v_input ->> 'mobileNumber', ''), nullif(v_input ->> 'address', '')
  ) on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    middle_name = excluded.middle_name,
    last_name = excluded.last_name,
    mobile_number = excluded.mobile_number,
    address = excluded.address,
    updated_at = now();

  insert into public.subscriber_memberships (
    subscriber_id, user_id, role, account_status, activated_at, must_change_password, password_changed_at
  ) values (
    v_context.subscriber_id, p_auth_user_id, 'associate', 'active', now(), true, null
  ) returning id into v_membership_id;

  while not v_created loop
    v_number_attempts := v_number_attempts + 1;
    if v_number_attempts > 10 then
      raise exception using errcode = 'PT503', message = 'ASSOCIATE_PROVISIONING_FAILED';
    end if;
    v_associate_number := 'DEN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    begin
      insert into public.associate_dentist_profiles (
        membership_id, subscriber_id, associate_number, license_number, ptr_number, s2_license_number,
        designation, specialization, calendar_color, certificates_and_qualifications
      ) values (
        v_membership_id, v_context.subscriber_id, v_associate_number,
        v_input ->> 'licenseNumber', v_input ->> 'ptrNumber', v_input ->> 's2LicenseNumber',
        v_input ->> 'designation', v_input ->> 'specialization', v_input ->> 'calendarColor',
        nullif(v_input ->> 'certificatesAndQualifications', '')
      );
      v_created := true;
    exception when unique_violation then
      -- The generated number has a unique database constraint; retry only that improbable collision.
      null;
    end;
  end loop;

  insert into public.clinic_assignments (
    subscriber_id, clinic_id, membership_id, assignment_role, status, assigned_by
  )
  select v_context.subscriber_id, clinic_id, v_membership_id, 'associate', 'active', v_context.actor_user_id
  from unnest(v_clinic_ids) clinic_id;

  update public.associate_provisioning_attempts attempt
  set status = 'database_provisioned', membership_id = v_membership_id,
      completed_at = now(), failure_code = null, failed_at = null,
      credential_delivery_status = 'pending', credential_sent_at = null
  where attempt.id = v_attempt.id;

  insert into public.audit_events (
    actor_user_id, subscriber_id, event_type, entity_type, entity_id, metadata
  ) values (
    v_context.actor_user_id, v_context.subscriber_id,
    'associate.provisioned', 'subscriber_membership', v_membership_id,
    jsonb_build_object('attempt_id', v_attempt.id, 'clinic_ids', to_jsonb(v_clinic_ids), 'associate_number', v_associate_number)
  );
  return query select v_membership_id, v_associate_number, 'pending'::text;
end;
$$;

create function public.fail_associate_provisioning_attempt(
  p_attempt_id uuid,
  p_actor_user_id uuid,
  p_failure_code text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_context record;
  v_attempt public.associate_provisioning_attempts%rowtype;
  v_code text := nullif(btrim(p_failure_code), '');
begin
  select * into v_context from app_private.resolve_associate_provisioning_owner(p_actor_user_id);
  if v_code is null or length(v_code) > 120 then
    raise exception using errcode = 'PT422', message = 'ASSOCIATE_PROVISIONING_FAILED';
  end if;
  select attempt.* into v_attempt
  from public.associate_provisioning_attempts attempt
  where attempt.id = p_attempt_id
    and attempt.subscriber_id = v_context.subscriber_id
    and attempt.actor_user_id = v_context.actor_user_id
  for update;
  if not found or v_attempt.status in ('database_provisioned', 'completed') then
    raise exception using errcode = 'PT409', message = 'ASSOCIATE_PROVISIONING_FAILED';
  end if;
  update public.associate_provisioning_attempts attempt
  set status = 'failed', failure_code = v_code, failed_at = now()
  where attempt.id = v_attempt.id;
  insert into public.audit_events (
    actor_user_id, subscriber_id, event_type, entity_type, entity_id, metadata
  ) values (
    v_context.actor_user_id, v_context.subscriber_id,
    'associate.provisioning.failed', 'associate_provisioning_attempt', v_attempt.id,
    jsonb_build_object('failure_code', v_code)
  );
end;
$$;

create function public.clear_failed_associate_attempt_auth_identity(
  p_attempt_id uuid,
  p_actor_user_id uuid,
  p_auth_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_context record;
begin
  select * into v_context from app_private.resolve_associate_provisioning_owner(p_actor_user_id);
  update public.associate_provisioning_attempts attempt
  set auth_user_id = null, auth_user_created_by_attempt = false
  where attempt.id = p_attempt_id
    and attempt.subscriber_id = v_context.subscriber_id
    and attempt.actor_user_id = v_context.actor_user_id
    and attempt.status = 'failed'
    and attempt.auth_user_id = p_auth_user_id
    and attempt.auth_user_created_by_attempt
    and attempt.membership_id is null;
  if not found then
    raise exception using errcode = 'PT409', message = 'ASSOCIATE_PROVISIONING_FAILED';
  end if;
end;
$$;

create function public.prepare_associate_credential_retry(
  p_attempt_id uuid,
  p_actor_user_id uuid
)
returns table (auth_user_id uuid, membership_id uuid, email_normalized text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_context record;
  v_attempt public.associate_provisioning_attempts%rowtype;
begin
  select * into v_context from app_private.resolve_associate_provisioning_owner(p_actor_user_id);
  select attempt.* into v_attempt
  from public.associate_provisioning_attempts attempt
  where attempt.id = p_attempt_id
    and attempt.subscriber_id = v_context.subscriber_id
    and attempt.actor_user_id = v_context.actor_user_id
    and attempt.status in ('database_provisioned', 'completed')
    and attempt.credential_delivery_status = 'failed'
  for update;
  if not found or v_attempt.auth_user_id is null or v_attempt.membership_id is null then
    raise exception using errcode = 'PT409', message = 'CREDENTIAL_DELIVERY_FAILED';
  end if;
  update public.subscriber_memberships membership
  set must_change_password = true, password_changed_at = null
  where membership.id = v_attempt.membership_id
    and membership.subscriber_id = v_context.subscriber_id
    and membership.user_id = v_attempt.auth_user_id
    and membership.role = 'associate'
    and membership.account_status = 'active';
  if not found then
    raise exception using errcode = 'PT409', message = 'ASSOCIATE_PROVISIONING_FAILED';
  end if;
  update public.associate_provisioning_attempts attempt
  set credential_delivery_status = 'pending', credential_sent_at = null, failure_code = null
  where attempt.id = v_attempt.id;
  insert into public.audit_events (
    actor_user_id, subscriber_id, event_type, entity_type, entity_id, metadata
  ) values (
    v_context.actor_user_id, v_context.subscriber_id,
    'associate.credential.retry_started', 'associate_provisioning_attempt', v_attempt.id,
    jsonb_build_object('membership_id', v_attempt.membership_id)
  );
  return query select v_attempt.auth_user_id, v_attempt.membership_id, v_attempt.email_normalized;
end;
$$;

create function public.record_associate_credential_delivery(
  p_attempt_id uuid,
  p_actor_user_id uuid,
  p_delivery_status text,
  p_failure_code text default null
)
returns table (membership_id uuid, associate_number text, credential_delivery_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_context record;
  v_attempt public.associate_provisioning_attempts%rowtype;
  v_failure_code text := nullif(btrim(p_failure_code), '');
  v_associate_number text;
begin
  select * into v_context from app_private.resolve_associate_provisioning_owner(p_actor_user_id);
  if p_delivery_status not in ('sent', 'failed')
    or (p_delivery_status = 'failed' and (v_failure_code is null or length(v_failure_code) > 120)) then
    raise exception using errcode = 'PT422', message = 'CREDENTIAL_DELIVERY_FAILED';
  end if;
  select attempt.* into v_attempt
  from public.associate_provisioning_attempts attempt
  where attempt.id = p_attempt_id
    and attempt.subscriber_id = v_context.subscriber_id
    and attempt.actor_user_id = v_context.actor_user_id
    and attempt.status in ('database_provisioned', 'completed')
    and attempt.membership_id is not null
  for update;
  if not found then
    raise exception using errcode = 'PT409', message = 'CREDENTIAL_DELIVERY_FAILED';
  end if;
  select profile.associate_number into v_associate_number
  from public.associate_dentist_profiles profile
  where profile.membership_id = v_attempt.membership_id
    and profile.subscriber_id = v_context.subscriber_id;
  if v_associate_number is null then
    raise exception using errcode = 'PT409', message = 'ASSOCIATE_PROVISIONING_FAILED';
  end if;
  update public.associate_provisioning_attempts attempt
  set status = 'completed', credential_delivery_status = p_delivery_status,
      credential_sent_at = case when p_delivery_status = 'sent' then now() else null end,
      failure_code = case when p_delivery_status = 'failed' then v_failure_code else null end
  where attempt.id = v_attempt.id;
  insert into public.audit_events (
    actor_user_id, subscriber_id, event_type, entity_type, entity_id, metadata
  ) values (
    v_context.actor_user_id, v_context.subscriber_id,
    case when p_delivery_status = 'sent' then 'associate.credential.sent' else 'associate.credential.delivery_failed' end,
    'associate_provisioning_attempt', v_attempt.id,
    jsonb_build_object('membership_id', v_attempt.membership_id, 'credential_delivery_status', p_delivery_status)
      || case when p_delivery_status = 'failed' then jsonb_build_object('failure_code', v_failure_code) else '{}'::jsonb end
  );
  return query select v_attempt.membership_id, v_associate_number, p_delivery_status;
end;
$$;

create function public.update_my_associate_dentist(
  p_actor_user_id uuid,
  p_membership_id uuid,
  p_input jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_context record;
  v_input jsonb;
  v_membership public.subscriber_memberships%rowtype;
  v_clinic_ids uuid[];
  v_changed_keys jsonb;
begin
  select * into v_context from app_private.resolve_associate_provisioning_owner(p_actor_user_id);
  v_input := app_private.normalize_associate_edit_input(p_input);
  select membership.* into v_membership
  from public.subscriber_memberships membership
  where membership.id = p_membership_id
    and membership.subscriber_id = v_context.subscriber_id
    and membership.role = 'associate'
  for update;
  if not found then
    raise exception using errcode = 'PT404', message = 'ASSOCIATE_NOT_FOUND';
  end if;
  if v_input ? 'clinicIds' then
    v_clinic_ids := array(select jsonb_array_elements_text(v_input -> 'clinicIds'))::uuid[];
    perform app_private.validate_associate_clinic_ids(v_context.subscriber_id, v_clinic_ids);
  end if;

  update public.profiles profile
  set first_name = case when v_input ? 'firstName' then v_input ->> 'firstName' else profile.first_name end,
      middle_name = case when v_input ? 'middleName' then nullif(v_input ->> 'middleName', '') else profile.middle_name end,
      last_name = case when v_input ? 'lastName' then v_input ->> 'lastName' else profile.last_name end,
      mobile_number = case when v_input ? 'mobileNumber' then nullif(v_input ->> 'mobileNumber', '') else profile.mobile_number end,
      address = case when v_input ? 'address' then nullif(v_input ->> 'address', '') else profile.address end,
      updated_at = now()
  where profile.id = v_membership.user_id;

  update public.associate_dentist_profiles profile
  set license_number = case when v_input ? 'licenseNumber' then v_input ->> 'licenseNumber' else profile.license_number end,
      ptr_number = case when v_input ? 'ptrNumber' then v_input ->> 'ptrNumber' else profile.ptr_number end,
      s2_license_number = case when v_input ? 's2LicenseNumber' then v_input ->> 's2LicenseNumber' else profile.s2_license_number end,
      designation = case when v_input ? 'designation' then v_input ->> 'designation' else profile.designation end,
      specialization = case when v_input ? 'specialization' then v_input ->> 'specialization' else profile.specialization end,
      calendar_color = case when v_input ? 'calendarColor' then v_input ->> 'calendarColor' else profile.calendar_color end,
      certificates_and_qualifications = case when v_input ? 'certificatesAndQualifications' then nullif(v_input ->> 'certificatesAndQualifications', '') else profile.certificates_and_qualifications end,
      updated_at = now()
  where profile.membership_id = v_membership.id
    and profile.subscriber_id = v_context.subscriber_id;
  if not found then
    raise exception using errcode = 'PT409', message = 'ASSOCIATE_UPDATE_FAILED';
  end if;

  if v_input ? 'clinicIds' then
    delete from public.clinic_assignments assignment
    where assignment.subscriber_id = v_context.subscriber_id
      and assignment.membership_id = v_membership.id
      and assignment.assignment_role = 'associate';
    insert into public.clinic_assignments (
      subscriber_id, clinic_id, membership_id, assignment_role, status, assigned_by
    )
    select v_context.subscriber_id, clinic_id, v_membership.id, 'associate', 'active', v_context.actor_user_id
    from unnest(v_clinic_ids) clinic_id;
  end if;

  select coalesce(jsonb_agg(key_name order by key_name), '[]'::jsonb)
  into v_changed_keys
  from jsonb_object_keys(v_input) key_name;
  insert into public.audit_events (
    actor_user_id, subscriber_id, event_type, entity_type, entity_id, metadata
  ) values (
    v_context.actor_user_id, v_context.subscriber_id,
    'associate.updated', 'subscriber_membership', v_membership.id,
    jsonb_build_object('changed_fields', v_changed_keys)
      || case when v_input ? 'clinicIds' then jsonb_build_object('clinic_ids', v_input -> 'clinicIds') else '{}'::jsonb end
  );
  return jsonb_build_object('membershipId', v_membership.id, 'updated', true);
end;
$$;

comment on table public.associate_provisioning_attempts is
  'Server-only Associate provisioning ledger. It stores no password or credential plaintext and supports safe credential-delivery retry state.';
comment on function public.begin_associate_provisioning(uuid, jsonb) is
  'Service-role-only Associate provisioning claim. Tenant, role, quota, clinic validation, and retry state are server-authoritative.';
comment on function public.complete_associate_provisioning(uuid, uuid, uuid) is
  'Service-role-only transaction that creates one active must-change-password Associate membership, profile, assignments, and audit event.';
comment on function public.update_my_associate_dentist(uuid, uuid, jsonb) is
  'Service-role-only Associate edit boundary. It preserves email, tenant, role, account status, and generated identity authority.';

revoke all on function app_private.resolve_associate_provisioning_owner(uuid) from public, anon, authenticated;
revoke all on function app_private.normalize_associate_create_input(jsonb) from public, anon, authenticated;
revoke all on function app_private.normalize_associate_edit_input(jsonb) from public, anon, authenticated;
revoke all on function app_private.resolve_associate_quota(jsonb) from public, anon, authenticated;
revoke all on function app_private.lock_associate_subscription_context(uuid) from public, anon, authenticated;
revoke all on function app_private.validate_associate_clinic_ids(uuid, uuid[]) from public, anon, authenticated;
revoke all on function public.begin_associate_provisioning(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.record_associate_provisioning_auth_identity(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.complete_associate_provisioning(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.fail_associate_provisioning_attempt(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.clear_failed_associate_attempt_auth_identity(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.prepare_associate_credential_retry(uuid, uuid) from public, anon, authenticated;
revoke all on function public.record_associate_credential_delivery(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.update_my_associate_dentist(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.begin_associate_provisioning(uuid, jsonb) to service_role;
grant execute on function public.record_associate_provisioning_auth_identity(uuid, uuid, uuid) to service_role;
grant execute on function public.complete_associate_provisioning(uuid, uuid, uuid) to service_role;
grant execute on function public.fail_associate_provisioning_attempt(uuid, uuid, text) to service_role;
grant execute on function public.clear_failed_associate_attempt_auth_identity(uuid, uuid, uuid) to service_role;
grant execute on function public.prepare_associate_credential_retry(uuid, uuid) to service_role;
grant execute on function public.record_associate_credential_delivery(uuid, uuid, text, text) to service_role;
grant execute on function public.update_my_associate_dentist(uuid, uuid, jsonb) to service_role;

-- Associate browser reads remain intact. Direct owner writes are replaced with
-- the service-only contract above; Platform Admin writes remain available.
drop policy if exists memberships_manage_owner on public.subscriber_memberships;
create policy memberships_insert_platform
  on public.subscriber_memberships for insert to authenticated
  with check (app_private.is_platform_admin());
create policy memberships_update_platform
  on public.subscriber_memberships for update to authenticated
  using (app_private.is_platform_admin()) with check (app_private.is_platform_admin());
create policy memberships_delete_platform
  on public.subscriber_memberships for delete to authenticated
  using (app_private.is_platform_admin());

drop policy if exists associates_manage_owner on public.associate_dentist_profiles;
create policy associates_insert_platform
  on public.associate_dentist_profiles for insert to authenticated
  with check (app_private.is_platform_admin());
create policy associates_update_platform
  on public.associate_dentist_profiles for update to authenticated
  using (app_private.is_platform_admin()) with check (app_private.is_platform_admin());
create policy associates_delete_platform
  on public.associate_dentist_profiles for delete to authenticated
  using (app_private.is_platform_admin());

drop policy if exists assignments_manage_owner on public.clinic_assignments;
create policy assignments_insert_platform
  on public.clinic_assignments for insert to authenticated
  with check (app_private.is_platform_admin());
create policy assignments_update_platform
  on public.clinic_assignments for update to authenticated
  using (app_private.is_platform_admin()) with check (app_private.is_platform_admin());
create policy assignments_delete_platform
  on public.clinic_assignments for delete to authenticated
  using (app_private.is_platform_admin());

revoke truncate on table public.subscriber_memberships, public.associate_dentist_profiles,
  public.clinic_assignments, public.associate_provisioning_attempts from anon, authenticated;
