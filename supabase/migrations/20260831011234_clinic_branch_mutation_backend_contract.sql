-- Phase 2E.3B.2A: authenticated Clinic Owner branch create/update authority.
--
-- The public RPCs are the only owner write boundary for clinics and business
-- hours. They derive tenant scope from auth.uid(), serialize quota-sensitive
-- work on the subscriber row, and write the clinic, hours, and audit event in
-- one PostgreSQL transaction.

alter table public.clinic_business_hours
  add constraint clinic_business_hours_break_window_check
  check (
    (break_start is null and break_end is null)
    or (
      is_open
      and opening_time is not null
      and closing_time is not null
      and break_start is not null
      and break_end is not null
      and opening_time < break_start
      and break_start < break_end
      and break_end < closing_time
    )
  );

create trigger clinic_business_hours_set_updated_at
  before update on public.clinic_business_hours
  for each row execute function app_private.set_updated_at();

create function app_private.resolve_clinic_owner_mutation_context()
returns table (
  actor_user_id uuid,
  membership_id uuid,
  subscriber_id uuid
)
language plpgsql
stable
set search_path = ''
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_active_owner_count integer;
  v_membership public.subscriber_memberships%rowtype;
begin
  if v_actor_user_id is null then
    raise exception using errcode = 'PT401', message = 'UNAUTHENTICATED';
  end if;

  select count(*)::integer
  into v_active_owner_count
  from public.subscriber_memberships membership
  where membership.user_id = v_actor_user_id
    and membership.role = 'clinic_owner'
    and membership.account_status = 'active';

  if v_active_owner_count = 0 then
    raise exception using errcode = 'PT403', message = 'OWNER_MEMBERSHIP_REQUIRED';
  end if;

  if v_active_owner_count > 1 then
    raise exception using errcode = 'PT409', message = 'OWNER_MEMBERSHIP_CONFLICT';
  end if;

  select membership.*
  into strict v_membership
  from public.subscriber_memberships membership
  where membership.user_id = v_actor_user_id
    and membership.role = 'clinic_owner'
    and membership.account_status = 'active';

  if v_membership.must_change_password then
    raise exception using errcode = 'PT403', message = 'PASSWORD_CHANGE_REQUIRED';
  end if;

  return query
  select v_actor_user_id, v_membership.id, v_membership.subscriber_id;
exception
  when sqlstate 'P0003' then
    raise exception using errcode = 'PT409', message = 'OWNER_MEMBERSHIP_CONFLICT';
  when sqlstate 'P0002' then
    raise exception using errcode = 'PT403', message = 'OWNER_MEMBERSHIP_REQUIRED';
end;
$$;

create function app_private.normalize_clinic_branch_input(
  p_input jsonb,
  p_allow_save_mode boolean
)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_allowed_keys text[];
  v_text_keys constant text[] := array[
    'saveMode',
    'branchType',
    'name',
    'legalBusinessName',
    'email',
    'contactNumber',
    'alternativeContactNumber',
    'addressLine1',
    'addressLine2',
    'barangay',
    'city',
    'province',
    'postalCode',
    'country',
    'timezone',
    'description',
    'visibility'
  ];
  v_key text;
  v_value text;
  v_max_length integer;
  v_result jsonb := '{}'::jsonb;
begin
  if p_input is null or jsonb_typeof(p_input) <> 'object' then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  v_allowed_keys := array[
    'branchType',
    'name',
    'legalBusinessName',
    'email',
    'contactNumber',
    'alternativeContactNumber',
    'addressLine1',
    'addressLine2',
    'barangay',
    'city',
    'province',
    'postalCode',
    'country',
    'timezone',
    'description',
    'visibility',
    'businessHours'
  ];

  if p_allow_save_mode then
    v_allowed_keys := array_append(v_allowed_keys, 'saveMode');
  end if;

  if exists (
    select 1
    from jsonb_object_keys(p_input) supplied(key_name)
    where not (supplied.key_name = any(v_allowed_keys))
  ) then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  foreach v_key in array v_text_keys loop
    if not (p_input ? v_key) then
      continue;
    end if;

    if v_key = 'saveMode' and not p_allow_save_mode then
      raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
    end if;

    if p_input -> v_key = 'null'::jsonb then
      v_result := jsonb_set(v_result, array[v_key], 'null'::jsonb, true);
      continue;
    end if;

    if jsonb_typeof(p_input -> v_key) <> 'string' then
      raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
    end if;

    v_value := nullif(btrim(p_input ->> v_key), '');
    v_max_length := case v_key
      when 'saveMode' then 20
      when 'branchType' then 20
      when 'visibility' then 20
      when 'name' then 200
      when 'legalBusinessName' then 200
      when 'email' then 320
      when 'contactNumber' then 20
      when 'alternativeContactNumber' then 20
      when 'addressLine1' then 300
      when 'addressLine2' then 300
      when 'barangay' then 100
      when 'city' then 100
      when 'province' then 100
      when 'postalCode' then 20
      when 'country' then 100
      when 'timezone' then 100
      when 'description' then 2000
      else 0
    end;

    if v_value is not null and char_length(v_value) > v_max_length then
      raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
    end if;

    if v_key = 'email' and v_value is not null then
      v_value := lower(v_value);
    end if;

    v_result := jsonb_set(
      v_result,
      array[v_key],
      coalesce(to_jsonb(v_value), 'null'::jsonb),
      true
    );
  end loop;

  if v_result ? 'saveMode'
    and coalesce(v_result ->> 'saveMode', '') not in ('draft', 'active') then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  if v_result ? 'branchType'
    and coalesce(v_result ->> 'branchType', '') not in ('main', 'satellite') then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  if v_result ? 'visibility'
    and coalesce(v_result ->> 'visibility', '') not in ('visible', 'hidden') then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  if v_result ? 'email'
    and (
      v_result ->> 'email' is null
      or (v_result ->> 'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    ) then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  foreach v_key in array array['contactNumber', 'alternativeContactNumber'] loop
    if v_result ? v_key
      and v_result ->> v_key is not null
      and (v_result ->> v_key) !~ '^[0-9+()[:space:]-]{7,20}$' then
      raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
    end if;
  end loop;

  if v_result ? 'timezone'
    and (
      v_result ->> 'timezone' is null
      or not exists (
        select 1
        from pg_catalog.pg_timezone_names timezone_record
        where timezone_record.name = v_result ->> 'timezone'
      )
    ) then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  if p_input ? 'businessHours' then
    if jsonb_typeof(p_input -> 'businessHours') <> 'array' then
      raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
    end if;
    v_result := jsonb_set(v_result, array['businessHours'], p_input -> 'businessHours', true);
  end if;

  return v_result;
end;
$$;

create function app_private.normalize_clinic_business_hours(
  p_business_hours jsonb,
  p_require_open_day boolean
)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_item jsonb;
  v_day integer;
  v_is_open boolean;
  v_opening_text text;
  v_closing_text text;
  v_break_start_text text;
  v_break_end_text text;
  v_opening_time time;
  v_closing_time time;
  v_break_start time;
  v_break_end time;
  v_seen_days integer[] := '{}';
  v_open_days integer := 0;
  v_result jsonb := '[]'::jsonb;
begin
  if p_business_hours is null
    or jsonb_typeof(p_business_hours) <> 'array'
    or jsonb_array_length(p_business_hours) <> 7 then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  for v_item in
    select hours.value
    from jsonb_array_elements(p_business_hours) hours(value)
  loop
    if jsonb_typeof(v_item) <> 'object' then
      raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
    end if;

    if exists (
      select 1
      from jsonb_object_keys(v_item) supplied(key_name)
      where supplied.key_name not in (
        'dayOfWeek', 'isOpen', 'openingTime', 'closingTime', 'breakStart', 'breakEnd'
      )
    ) then
      raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
    end if;

    if not (v_item ? 'dayOfWeek')
      or jsonb_typeof(v_item -> 'dayOfWeek') <> 'number'
      or (v_item ->> 'dayOfWeek') !~ '^[0-6]$' then
      raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
    end if;
    v_day := (v_item ->> 'dayOfWeek')::integer;

    if v_day = any(v_seen_days) then
      raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
    end if;
    v_seen_days := array_append(v_seen_days, v_day);

    if not (v_item ? 'isOpen') or jsonb_typeof(v_item -> 'isOpen') <> 'boolean' then
      raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
    end if;
    v_is_open := (v_item ->> 'isOpen')::boolean;

    if exists (
      select 1
      from unnest(array['openingTime', 'closingTime', 'breakStart', 'breakEnd']) time_key
      where v_item ? time_key
        and v_item -> time_key <> 'null'::jsonb
        and jsonb_typeof(v_item -> time_key) <> 'string'
    ) then
      raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
    end if;

    v_opening_text := nullif(btrim(v_item ->> 'openingTime'), '');
    v_closing_text := nullif(btrim(v_item ->> 'closingTime'), '');
    v_break_start_text := nullif(btrim(v_item ->> 'breakStart'), '');
    v_break_end_text := nullif(btrim(v_item ->> 'breakEnd'), '');

    if not v_is_open then
      v_opening_time := null;
      v_closing_time := null;
      v_break_start := null;
      v_break_end := null;
    else
      if v_opening_text is null
        or v_closing_text is null
        or v_opening_text !~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$'
        or v_closing_text !~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$' then
        raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
      end if;

      v_opening_time := v_opening_text::time;
      v_closing_time := v_closing_text::time;
      if v_opening_time >= v_closing_time then
        raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
      end if;

      if (v_break_start_text is null) <> (v_break_end_text is null) then
        raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
      end if;

      if v_break_start_text is not null then
        if v_break_start_text !~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$'
          or v_break_end_text !~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$' then
          raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
        end if;
        v_break_start := v_break_start_text::time;
        v_break_end := v_break_end_text::time;
        if v_break_start <= v_opening_time
          or v_break_start >= v_break_end
          or v_break_end >= v_closing_time then
          raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
        end if;
      else
        v_break_start := null;
        v_break_end := null;
      end if;

      v_open_days := v_open_days + 1;
    end if;

    v_result := v_result || jsonb_build_array(
      jsonb_build_object(
        'dayOfWeek', v_day,
        'isOpen', v_is_open,
        'openingTime', case when v_opening_time is null then null else to_char(v_opening_time, 'HH24:MI') end,
        'closingTime', case when v_closing_time is null then null else to_char(v_closing_time, 'HH24:MI') end,
        'breakStart', case when v_break_start is null then null else to_char(v_break_start, 'HH24:MI') end,
        'breakEnd', case when v_break_end is null then null else to_char(v_break_end, 'HH24:MI') end
      )
    );
  end loop;

  if cardinality(v_seen_days) <> 7 then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  if p_require_open_day and v_open_days = 0 then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  select jsonb_agg(hours.value order by (hours.value ->> 'dayOfWeek')::integer)
  into v_result
  from jsonb_array_elements(v_result) hours(value);

  return v_result;
end;
$$;

create function app_private.resolve_clinic_quota(p_limits jsonb)
returns table (
  quota_type text,
  quota_value bigint
)
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_entry_count integer;
  v_entry jsonb;
  v_type text;
  v_numeric_value numeric;
begin
  if p_limits is null or jsonb_typeof(p_limits) <> 'array' then
    raise exception using errcode = 'PT409', message = 'PLAN_UNAVAILABLE';
  end if;

  select count(*)::integer, min(entry.value::text)::jsonb
  into v_entry_count, v_entry
  from jsonb_array_elements(p_limits) entry(value)
  where entry.value ->> 'key' = 'clinics';

  if v_entry_count <> 1 or v_entry is null or jsonb_typeof(v_entry) <> 'object' then
    raise exception using errcode = 'PT409', message = 'PLAN_UNAVAILABLE';
  end if;

  v_type := v_entry ->> 'type';
  if v_type = 'number' then
    if jsonb_typeof(v_entry -> 'value') <> 'number'
      or (v_entry ->> 'value') !~ '^(0|[1-9][0-9]*)$' then
      raise exception using errcode = 'PT409', message = 'PLAN_UNAVAILABLE';
    end if;
    v_numeric_value := (v_entry ->> 'value')::numeric;
    if v_numeric_value > 9223372036854775807::numeric then
      raise exception using errcode = 'PT409', message = 'PLAN_UNAVAILABLE';
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

  raise exception using errcode = 'PT409', message = 'PLAN_UNAVAILABLE';
end;
$$;

create function app_private.clinic_branch_safe_dto(p_clinic_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', clinic.id,
    'clinicNumber', clinic.clinic_number,
    'branchType', clinic.branch_type,
    'name', clinic.name,
    'legalBusinessName', clinic.legal_business_name,
    'email', clinic.email,
    'contactNumber', clinic.contact_number,
    'alternativeContactNumber', clinic.alternative_contact_number,
    'addressLine1', clinic.address_line_1,
    'addressLine2', clinic.address_line_2,
    'barangay', clinic.barangay,
    'city', clinic.city,
    'province', clinic.province,
    'postalCode', clinic.postal_code,
    'country', clinic.country,
    'timezone', clinic.timezone,
    'description', clinic.description,
    'visibility', clinic.visibility,
    'status', clinic.status,
    'isPrimary', clinic.is_primary,
    'createdAt', clinic.created_at,
    'updatedAt', clinic.updated_at,
    'businessHours', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'dayOfWeek', hours.day_of_week,
            'isOpen', hours.is_open,
            'openingTime', case when hours.opening_time is null then null else to_char(hours.opening_time, 'HH24:MI') end,
            'closingTime', case when hours.closing_time is null then null else to_char(hours.closing_time, 'HH24:MI') end,
            'breakStart', case when hours.break_start is null then null else to_char(hours.break_start, 'HH24:MI') end,
            'breakEnd', case when hours.break_end is null then null else to_char(hours.break_end, 'HH24:MI') end
          )
          order by hours.day_of_week
        )
        from public.clinic_business_hours hours
        where hours.clinic_id = clinic.id
      ),
      '[]'::jsonb
    )
  )
  from public.clinics clinic
  where clinic.id = p_clinic_id;
$$;

create function public.create_my_clinic_branch(p_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_context record;
  v_input jsonb;
  v_hours jsonb;
  v_hour jsonb;
  v_subscriber public.subscribers%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_clinic public.clinics%rowtype;
  v_subscription_count integer;
  v_primary_count integer;
  v_active_primary_count integer;
  v_usage_before bigint;
  v_quota_type text;
  v_quota_value bigint;
  v_save_mode text;
  v_name text;
  v_legal_business_name text;
  v_email text;
  v_contact_number text;
  v_address_line_1 text;
  v_city text;
  v_province text;
  v_country text;
  v_timezone text;
  v_clinic_number text;
  v_constraint_name text;
  v_attempt integer;
begin
  select * into v_context
  from app_private.resolve_clinic_owner_mutation_context();

  v_input := app_private.normalize_clinic_branch_input(p_input, true);
  if not (v_input ? 'saveMode') or not (v_input ? 'businessHours') then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  v_save_mode := v_input ->> 'saveMode';
  v_name := v_input ->> 'name';
  v_legal_business_name := coalesce(v_input ->> 'legalBusinessName', v_name);
  v_email := v_input ->> 'email';
  v_contact_number := v_input ->> 'contactNumber';
  v_address_line_1 := v_input ->> 'addressLine1';
  v_city := v_input ->> 'city';
  v_province := v_input ->> 'province';
  v_country := coalesce(v_input ->> 'country', 'Philippines');
  v_timezone := coalesce(v_input ->> 'timezone', 'Asia/Manila');

  if v_input ->> 'branchType' is null
    or v_name is null
    or v_email is null
    or v_contact_number is null
    or v_address_line_1 is null
    or v_city is null
    or v_province is null
    or v_country is null
    or v_timezone is null then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_timezone_names timezone_record
    where timezone_record.name = v_timezone
  ) then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  v_hours := app_private.normalize_clinic_business_hours(
    v_input -> 'businessHours',
    v_save_mode = 'active'
  );

  select subscriber.*
  into v_subscriber
  from public.subscribers subscriber
  where subscriber.id = v_context.subscriber_id
  for update;

  if not found or v_subscriber.account_status <> 'active' then
    raise exception using errcode = 'PT409', message = 'SUBSCRIBER_UNAVAILABLE';
  end if;

  select count(*)::integer
  into v_subscription_count
  from public.subscriptions subscription
  where subscription.subscriber_id = v_subscriber.id
    and subscription.status in ('active', 'expiring_soon')
    and (subscription.starts_at is null or subscription.starts_at <= now())
    and (subscription.expires_at is null or subscription.expires_at > now());

  if v_subscription_count <> 1 then
    raise exception using errcode = 'PT409', message = 'SUBSCRIPTION_UNAVAILABLE';
  end if;

  select subscription.*
  into v_subscription
  from public.subscriptions subscription
  where subscription.subscriber_id = v_subscriber.id
    and subscription.status in ('active', 'expiring_soon')
    and (subscription.starts_at is null or subscription.starts_at <= now())
    and (subscription.expires_at is null or subscription.expires_at > now())
  for share;

  select plan.*
  into v_plan
  from public.plans plan
  where plan.id = v_subscription.plan_id
    and plan.status = 'active'
  for share;

  if not found then
    raise exception using errcode = 'PT409', message = 'PLAN_UNAVAILABLE';
  end if;

  select quota.quota_type, quota.quota_value
  into v_quota_type, v_quota_value
  from app_private.resolve_clinic_quota(v_plan.limits) quota;

  select count(*)::bigint
  into v_usage_before
  from public.clinics clinic
  where clinic.subscriber_id = v_subscriber.id
    and clinic.status in ('draft', 'pending', 'active', 'inactive');

  if v_quota_type = 'not_included'
    or (v_quota_type = 'number' and v_usage_before >= v_quota_value) then
    raise exception using errcode = 'PT409', message = 'CLINIC_QUOTA_REACHED';
  end if;

  select
    count(*) filter (where clinic.is_primary and clinic.status <> 'archived')::integer,
    count(*) filter (where clinic.is_primary and clinic.status = 'active')::integer
  into v_primary_count, v_active_primary_count
  from public.clinics clinic
  where clinic.subscriber_id = v_subscriber.id;

  if v_primary_count <> 1 or v_active_primary_count <> 1 then
    raise exception using errcode = 'PT409', message = 'PRIMARY_CLINIC_CONFLICT';
  end if;

  if exists (
    select 1
    from public.clinics clinic
    where clinic.subscriber_id = v_subscriber.id
      and (
        lower(btrim(clinic.name)) = lower(v_name)
        or (clinic.email is not null and lower(btrim(clinic.email)) = lower(v_email))
        or (
          lower(btrim(clinic.address_line_1)) = lower(v_address_line_1)
          and lower(btrim(clinic.city)) = lower(v_city)
        )
      )
  ) then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  for v_attempt in 1..5 loop
    v_clinic_number := 'CLN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    begin
      insert into public.clinics (
        subscriber_id,
        clinic_number,
        branch_type,
        name,
        legal_business_name,
        email,
        contact_number,
        alternative_contact_number,
        address_line_1,
        address_line_2,
        barangay,
        city,
        province,
        postal_code,
        country,
        timezone,
        description,
        status,
        visibility,
        is_primary,
        activated_at
      ) values (
        v_subscriber.id,
        v_clinic_number,
        v_input ->> 'branchType',
        v_name,
        v_legal_business_name,
        v_email,
        v_contact_number,
        v_input ->> 'alternativeContactNumber',
        v_address_line_1,
        v_input ->> 'addressLine2',
        v_input ->> 'barangay',
        v_city,
        v_province,
        v_input ->> 'postalCode',
        v_country,
        v_timezone,
        v_input ->> 'description',
        v_save_mode::public.clinic_status,
        coalesce(v_input ->> 'visibility', 'visible'),
        false,
        case when v_save_mode = 'active' then now() else null end
      )
      returning * into v_clinic;
      exit;
    exception
      when unique_violation then
        get stacked diagnostics v_constraint_name = constraint_name;
        if v_constraint_name = 'clinics_clinic_number_key' and v_attempt < 5 then
          continue;
        end if;
        if v_constraint_name = 'clinics_clinic_number_key' then
          raise exception using errcode = 'PT503', message = 'DATA_UNAVAILABLE';
        end if;
        raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
    end;
  end loop;

  if v_clinic.id is null then
    raise exception using errcode = 'PT503', message = 'DATA_UNAVAILABLE';
  end if;

  for v_hour in
    select hours.value
    from jsonb_array_elements(v_hours) hours(value)
  loop
    insert into public.clinic_business_hours (
      subscriber_id,
      clinic_id,
      day_of_week,
      is_open,
      opening_time,
      closing_time,
      break_start,
      break_end
    ) values (
      v_subscriber.id,
      v_clinic.id,
      (v_hour ->> 'dayOfWeek')::smallint,
      (v_hour ->> 'isOpen')::boolean,
      nullif(v_hour ->> 'openingTime', '')::time,
      nullif(v_hour ->> 'closingTime', '')::time,
      nullif(v_hour ->> 'breakStart', '')::time,
      nullif(v_hour ->> 'breakEnd', '')::time
    );
  end loop;

  insert into public.audit_events (
    actor_user_id,
    subscriber_id,
    clinic_id,
    event_type,
    entity_type,
    entity_id,
    metadata
  ) values (
    v_context.actor_user_id,
    v_subscriber.id,
    v_clinic.id,
    'clinic.branch.created',
    'clinic',
    v_clinic.id,
    jsonb_build_object(
      'save_mode', v_save_mode,
      'plan_id', v_plan.id,
      'subscription_id', v_subscription.id,
      'quota_type', v_quota_type,
      'quota_value', v_quota_value,
      'quota_usage_before', v_usage_before,
      'quota_usage_after', v_usage_before + 1
    )
  );

  return app_private.clinic_branch_safe_dto(v_clinic.id);
exception
  when others then
    if sqlstate like 'PT%' then
      raise;
    end if;
    raise exception using errcode = 'PT503', message = 'DATA_UNAVAILABLE';
end;
$$;

create function public.update_my_clinic_branch(
  p_clinic_id uuid,
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
  v_hours jsonb;
  v_hour jsonb;
  v_subscriber public.subscribers%rowtype;
  v_clinic public.clinics%rowtype;
  v_name text;
  v_legal_business_name text;
  v_email text;
  v_contact_number text;
  v_address_line_1 text;
  v_city text;
  v_province text;
  v_country text;
  v_timezone text;
  v_existing_hours integer;
  v_existing_open_hours integer;
  v_changed_fields jsonb;
begin
  select * into v_context
  from app_private.resolve_clinic_owner_mutation_context();

  v_input := app_private.normalize_clinic_branch_input(p_input, false);
  if v_input = '{}'::jsonb then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  select subscriber.*
  into v_subscriber
  from public.subscribers subscriber
  where subscriber.id = v_context.subscriber_id
  for update;

  if not found or v_subscriber.account_status <> 'active' then
    raise exception using errcode = 'PT409', message = 'SUBSCRIBER_UNAVAILABLE';
  end if;

  select clinic.*
  into v_clinic
  from public.clinics clinic
  where clinic.id = p_clinic_id
    and clinic.subscriber_id = v_subscriber.id
  for update;

  if not found then
    raise exception using errcode = 'PT404', message = 'CLINIC_NOT_FOUND';
  end if;

  if v_clinic.status = 'archived' then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  v_name := case when v_input ? 'name' then v_input ->> 'name' else v_clinic.name end;
  v_legal_business_name := case
    when v_input ? 'legalBusinessName' then v_input ->> 'legalBusinessName'
    else v_clinic.legal_business_name
  end;
  v_email := case when v_input ? 'email' then v_input ->> 'email' else v_clinic.email end;
  v_contact_number := case
    when v_input ? 'contactNumber' then v_input ->> 'contactNumber'
    else v_clinic.contact_number
  end;
  v_address_line_1 := case
    when v_input ? 'addressLine1' then v_input ->> 'addressLine1'
    else v_clinic.address_line_1
  end;
  v_city := case when v_input ? 'city' then v_input ->> 'city' else v_clinic.city end;
  v_province := case when v_input ? 'province' then v_input ->> 'province' else v_clinic.province end;
  v_country := case when v_input ? 'country' then v_input ->> 'country' else v_clinic.country end;
  v_timezone := case when v_input ? 'timezone' then v_input ->> 'timezone' else v_clinic.timezone end;

  if v_name is null
    or v_email is null
    or v_contact_number is null
    or v_address_line_1 is null
    or v_city is null
    or v_province is null
    or v_country is null
    or v_timezone is null then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  if char_length(v_name) > 200
    or char_length(v_email) > 320
    or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or char_length(v_contact_number) > 20
    or v_contact_number !~ '^[0-9+()[:space:]-]{7,20}$'
    or char_length(v_address_line_1) > 300
    or char_length(v_city) > 100
    or char_length(v_province) > 100
    or char_length(v_country) > 100
    or char_length(v_timezone) > 100 then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_timezone_names timezone_record
    where timezone_record.name = v_timezone
  ) then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  if exists (
    select 1
    from public.clinics clinic
    where clinic.subscriber_id = v_subscriber.id
      and clinic.id <> v_clinic.id
      and (
        lower(btrim(clinic.name)) = lower(v_name)
        or (clinic.email is not null and lower(btrim(clinic.email)) = lower(v_email))
        or (
          lower(btrim(clinic.address_line_1)) = lower(v_address_line_1)
          and lower(btrim(clinic.city)) = lower(v_city)
        )
      )
  ) then
    raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end if;

  if v_input ? 'businessHours' then
    v_hours := app_private.normalize_clinic_business_hours(
      v_input -> 'businessHours',
      v_clinic.status = 'active'
    );
  else
    select count(*)::integer, count(*) filter (where hours.is_open)::integer
    into v_existing_hours, v_existing_open_hours
    from public.clinic_business_hours hours
    where hours.clinic_id = v_clinic.id
      and hours.subscriber_id = v_subscriber.id;

    if v_existing_hours <> 7
      or (v_clinic.status = 'active' and v_existing_open_hours = 0) then
      raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
    end if;
  end if;

  begin
    update public.clinics clinic
    set branch_type = case when v_input ? 'branchType' then v_input ->> 'branchType' else clinic.branch_type end,
        name = v_name,
        legal_business_name = v_legal_business_name,
        email = v_email,
        contact_number = v_contact_number,
        alternative_contact_number = case
          when v_input ? 'alternativeContactNumber' then v_input ->> 'alternativeContactNumber'
          else clinic.alternative_contact_number
        end,
        address_line_1 = v_address_line_1,
        address_line_2 = case when v_input ? 'addressLine2' then v_input ->> 'addressLine2' else clinic.address_line_2 end,
        barangay = case when v_input ? 'barangay' then v_input ->> 'barangay' else clinic.barangay end,
        city = v_city,
        province = v_province,
        postal_code = case when v_input ? 'postalCode' then v_input ->> 'postalCode' else clinic.postal_code end,
        country = v_country,
        timezone = v_timezone,
        description = case when v_input ? 'description' then v_input ->> 'description' else clinic.description end,
        visibility = case when v_input ? 'visibility' then v_input ->> 'visibility' else clinic.visibility end
    where clinic.id = v_clinic.id
    returning clinic.* into v_clinic;
  exception
    when unique_violation then
      raise exception using errcode = 'PT422', message = 'INVALID_BRANCH_INPUT';
  end;

  if v_input ? 'businessHours' then
    delete from public.clinic_business_hours hours
    where hours.clinic_id = v_clinic.id
      and hours.subscriber_id = v_subscriber.id;

    for v_hour in
      select hours.value
      from jsonb_array_elements(v_hours) hours(value)
    loop
      insert into public.clinic_business_hours (
        subscriber_id,
        clinic_id,
        day_of_week,
        is_open,
        opening_time,
        closing_time,
        break_start,
        break_end
      ) values (
        v_subscriber.id,
        v_clinic.id,
        (v_hour ->> 'dayOfWeek')::smallint,
        (v_hour ->> 'isOpen')::boolean,
        nullif(v_hour ->> 'openingTime', '')::time,
        nullif(v_hour ->> 'closingTime', '')::time,
        nullif(v_hour ->> 'breakStart', '')::time,
        nullif(v_hour ->> 'breakEnd', '')::time
      );
    end loop;
  end if;

  select coalesce(jsonb_agg(supplied.key_name order by supplied.key_name), '[]'::jsonb)
  into v_changed_fields
  from jsonb_object_keys(v_input) supplied(key_name);

  insert into public.audit_events (
    actor_user_id,
    subscriber_id,
    clinic_id,
    event_type,
    entity_type,
    entity_id,
    metadata
  ) values (
    v_context.actor_user_id,
    v_subscriber.id,
    v_clinic.id,
    'clinic.branch.updated',
    'clinic',
    v_clinic.id,
    jsonb_build_object('changed_fields', v_changed_fields)
  );

  return app_private.clinic_branch_safe_dto(v_clinic.id);
exception
  when others then
    if sqlstate like 'PT%' then
      raise;
    end if;
    raise exception using errcode = 'PT503', message = 'DATA_UNAVAILABLE';
end;
$$;

comment on function public.create_my_clinic_branch(jsonb) is
  'Creates one authenticated Clinic Owner branch using server-derived tenant, plan quota, identity, hours, and audit authority.';
comment on function public.update_my_clinic_branch(uuid, jsonb) is
  'Updates editable fields and hours for one authenticated Clinic Owner branch while preserving tenant, identity, status, and primary authority.';

revoke all on function app_private.resolve_clinic_owner_mutation_context() from public, anon, authenticated;
revoke all on function app_private.normalize_clinic_branch_input(jsonb, boolean) from public, anon, authenticated;
revoke all on function app_private.normalize_clinic_business_hours(jsonb, boolean) from public, anon, authenticated;
revoke all on function app_private.resolve_clinic_quota(jsonb) from public, anon, authenticated;
revoke all on function app_private.clinic_branch_safe_dto(uuid) from public, anon, authenticated;

revoke all on function public.create_my_clinic_branch(jsonb) from public, anon;
revoke all on function public.update_my_clinic_branch(uuid, jsonb) from public, anon;
grant execute on function public.create_my_clinic_branch(jsonb) to authenticated;
grant execute on function public.update_my_clinic_branch(uuid, jsonb) to authenticated;

drop policy if exists clinics_manage_owner on public.clinics;
drop policy if exists clinics_manage_platform on public.clinics;
create policy clinics_insert_platform
  on public.clinics
  for insert
  to authenticated
  with check (app_private.is_platform_admin());
create policy clinics_update_platform
  on public.clinics
  for update
  to authenticated
  using (app_private.is_platform_admin())
  with check (app_private.is_platform_admin());
create policy clinics_delete_platform
  on public.clinics
  for delete
  to authenticated
  using (app_private.is_platform_admin());

drop policy if exists clinic_business_hours_manage_owner on public.clinic_business_hours;
drop policy if exists clinic_business_hours_manage_platform on public.clinic_business_hours;
create policy clinic_business_hours_insert_platform
  on public.clinic_business_hours
  for insert
  to authenticated
  with check (app_private.is_platform_admin());
create policy clinic_business_hours_update_platform
  on public.clinic_business_hours
  for update
  to authenticated
  using (app_private.is_platform_admin())
  with check (app_private.is_platform_admin());
create policy clinic_business_hours_delete_platform
  on public.clinic_business_hours
  for delete
  to authenticated
  using (app_private.is_platform_admin());

revoke truncate on table public.clinics from anon, authenticated;
revoke truncate on table public.clinic_business_hours from anon, authenticated;
