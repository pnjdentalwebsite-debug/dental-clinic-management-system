begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

create temporary table test_rpc_results (
  label text primary key,
  payload jsonb not null
);
grant select, insert, update, delete on table test_rpc_results to authenticated;

create function pg_temp.test_business_hours(p_has_open_day boolean default true)
returns jsonb
language sql
as $$
  select jsonb_agg(
    jsonb_build_object(
      'dayOfWeek', day_number,
      'isOpen', p_has_open_day and day_number = 1,
      -- Closed-day values are intentional: the RPC must normalize them to null.
      'openingTime', '09:00',
      'closingTime', '18:00',
      'breakStart', case when p_has_open_day and day_number = 1 then '12:00' else null end,
      'breakEnd', case when p_has_open_day and day_number = 1 then '13:00' else null end
    )
    order by day_number
  )
  from generate_series(0, 6) day_number;
$$;

create function pg_temp.test_branch_payload(
  p_name text,
  p_save_mode text,
  p_has_open_day boolean default true
)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'saveMode', p_save_mode,
    'branchType', 'satellite',
    'name', p_name,
    'legalBusinessName', p_name,
    'email', lower(replace(p_name, ' ', '-')) || '@test.invalid',
    'contactNumber', '+63 917 000 0000',
    'alternativeContactNumber', null,
    'addressLine1', p_name || ' Test Address',
    'addressLine2', null,
    'barangay', 'Test Barangay',
    'city', 'Test City',
    'province', 'Test Province',
    'postalCode', '1000',
    'country', 'Philippines',
    'timezone', 'Asia/Manila',
    'description', 'Phase 2E.3B.2A database test branch.',
    'visibility', 'visible',
    'businessHours', pg_temp.test_business_hours(p_has_open_day)
  );
$$;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('11000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'create-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('11000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'gated-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('11000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'no-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('11000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'multi-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('11000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'update-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('11000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'unlimited-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('11000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'not-included-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('11000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated', 'pending-limit-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('11000000-0000-0000-0000-000000000009', 'authenticated', 'authenticated', 'missing-limit-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('11000000-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'malformed-limit-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('11000000-0000-0000-0000-00000000000b', 'authenticated', 'authenticated', 'duplicate-limit-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('11000000-0000-0000-0000-00000000000c', 'authenticated', 'authenticated', 'inactive-subscriber-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('11000000-0000-0000-0000-00000000000d', 'authenticated', 'authenticated', 'suspended-subscription-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('11000000-0000-0000-0000-00000000000e', 'authenticated', 'authenticated', 'unhealthy-primary-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('11000000-0000-0000-0000-00000000000f', 'authenticated', 'authenticated', 'rollback-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('12000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'platform-admin@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.platform_admins (user_id)
values ('12000000-0000-0000-0000-000000000001');

insert into public.plans (
  id, plan_code, name, status, monthly_amount_centavos, annual_amount_centavos, limits, features
)
values
  ('22000000-0000-0000-0000-000000000001', 'test-clinic-number-3', 'Test Number 3', 'active', 1, 1, '[{"key":"clinics","label":"Clinics","type":"number","value":3}]', '[]'),
  ('22000000-0000-0000-0000-000000000002', 'test-clinic-unlimited', 'Test Unlimited', 'active', 1, 1, '[{"key":"clinics","label":"Clinics","type":"unlimited"}]', '[]'),
  ('22000000-0000-0000-0000-000000000003', 'test-clinic-not-included', 'Test Not Included', 'active', 1, 1, '[{"key":"clinics","label":"Clinics","type":"not_included"}]', '[]'),
  ('22000000-0000-0000-0000-000000000004', 'test-clinic-pending', 'Test Pending', 'active', 1, 1, '[{"key":"clinics","label":"Clinics","type":"pending"}]', '[]'),
  ('22000000-0000-0000-0000-000000000005', 'test-clinic-missing', 'Test Missing', 'active', 1, 1, '[{"key":"staff","label":"Staff","type":"number","value":1}]', '[]'),
  ('22000000-0000-0000-0000-000000000006', 'test-clinic-malformed', 'Test Malformed', 'active', 1, 1, '[{"key":"clinics","label":"Clinics","type":"number","value":"three"}]', '[]'),
  ('22000000-0000-0000-0000-000000000007', 'test-clinic-duplicate', 'Test Duplicate', 'active', 1, 1, '[{"key":"clinics","type":"number","value":3},{"key":"clinics","type":"unlimited"}]', '[]');

insert into public.subscribers (
  id, subscriber_number, business_name, email, account_status, activated_at
)
values
  ('33000000-0000-0000-0000-000000000001', 'SUB-TEST-CREATE', 'Create Test Dental', 'create@test.invalid', 'active', now()),
  ('33000000-0000-0000-0000-000000000002', 'SUB-TEST-GATED', 'Gated Test Dental', 'gated@test.invalid', 'active', now()),
  ('33000000-0000-0000-0000-000000000003', 'SUB-TEST-MULTI-A', 'Multi A Dental', 'multi-a@test.invalid', 'active', now()),
  ('33000000-0000-0000-0000-000000000004', 'SUB-TEST-MULTI-B', 'Multi B Dental', 'multi-b@test.invalid', 'active', now()),
  ('33000000-0000-0000-0000-000000000005', 'SUB-TEST-UPDATE', 'Update Test Dental', 'update@test.invalid', 'active', now()),
  ('33000000-0000-0000-0000-000000000006', 'SUB-TEST-UNLIMITED', 'Unlimited Test Dental', 'unlimited@test.invalid', 'active', now()),
  ('33000000-0000-0000-0000-000000000007', 'SUB-TEST-NOT-INCLUDED', 'Not Included Test Dental', 'not-included@test.invalid', 'active', now()),
  ('33000000-0000-0000-0000-000000000008', 'SUB-TEST-PENDING', 'Pending Test Dental', 'pending@test.invalid', 'active', now()),
  ('33000000-0000-0000-0000-000000000009', 'SUB-TEST-MISSING', 'Missing Test Dental', 'missing@test.invalid', 'active', now()),
  ('33000000-0000-0000-0000-00000000000a', 'SUB-TEST-MALFORMED', 'Malformed Test Dental', 'malformed@test.invalid', 'active', now()),
  ('33000000-0000-0000-0000-00000000000b', 'SUB-TEST-DUPLICATE', 'Duplicate Test Dental', 'duplicate@test.invalid', 'active', now()),
  ('33000000-0000-0000-0000-00000000000c', 'SUB-TEST-INACTIVE', 'Inactive Test Dental', 'inactive@test.invalid', 'suspended', null),
  ('33000000-0000-0000-0000-00000000000d', 'SUB-TEST-SUSPENDED-SUB', 'Suspended Subscription Dental', 'suspended-sub@test.invalid', 'active', now()),
  ('33000000-0000-0000-0000-00000000000e', 'SUB-TEST-PRIMARY', 'Unhealthy Primary Dental', 'unhealthy-primary@test.invalid', 'active', now()),
  ('33000000-0000-0000-0000-00000000000f', 'SUB-TEST-ROLLBACK', 'Rollback Test Dental', 'rollback@test.invalid', 'active', now());

insert into public.subscriber_memberships (
  id, subscriber_id, user_id, role, account_status, activated_at,
  must_change_password, password_changed_at
)
values
  ('44000000-0000-0000-0000-000000000001', '33000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'clinic_owner', 'active', now(), false, now()),
  ('44000000-0000-0000-0000-000000000002', '33000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002', 'clinic_owner', 'active', now(), true, null),
  ('44000000-0000-0000-0000-000000000003', '33000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000004', 'clinic_owner', 'active', now(), false, now()),
  ('44000000-0000-0000-0000-000000000004', '33000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000004', 'clinic_owner', 'active', now(), false, now()),
  ('44000000-0000-0000-0000-000000000005', '33000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000005', 'clinic_owner', 'active', now(), false, now()),
  ('44000000-0000-0000-0000-000000000006', '33000000-0000-0000-0000-000000000006', '11000000-0000-0000-0000-000000000006', 'clinic_owner', 'active', now(), false, now()),
  ('44000000-0000-0000-0000-000000000007', '33000000-0000-0000-0000-000000000007', '11000000-0000-0000-0000-000000000007', 'clinic_owner', 'active', now(), false, now()),
  ('44000000-0000-0000-0000-000000000008', '33000000-0000-0000-0000-000000000008', '11000000-0000-0000-0000-000000000008', 'clinic_owner', 'active', now(), false, now()),
  ('44000000-0000-0000-0000-000000000009', '33000000-0000-0000-0000-000000000009', '11000000-0000-0000-0000-000000000009', 'clinic_owner', 'active', now(), false, now()),
  ('44000000-0000-0000-0000-00000000000a', '33000000-0000-0000-0000-00000000000a', '11000000-0000-0000-0000-00000000000a', 'clinic_owner', 'active', now(), false, now()),
  ('44000000-0000-0000-0000-00000000000b', '33000000-0000-0000-0000-00000000000b', '11000000-0000-0000-0000-00000000000b', 'clinic_owner', 'active', now(), false, now()),
  ('44000000-0000-0000-0000-00000000000c', '33000000-0000-0000-0000-00000000000c', '11000000-0000-0000-0000-00000000000c', 'clinic_owner', 'active', now(), false, now()),
  ('44000000-0000-0000-0000-00000000000d', '33000000-0000-0000-0000-00000000000d', '11000000-0000-0000-0000-00000000000d', 'clinic_owner', 'active', now(), false, now()),
  ('44000000-0000-0000-0000-00000000000e', '33000000-0000-0000-0000-00000000000e', '11000000-0000-0000-0000-00000000000e', 'clinic_owner', 'active', now(), false, now()),
  ('44000000-0000-0000-0000-00000000000f', '33000000-0000-0000-0000-00000000000f', '11000000-0000-0000-0000-00000000000f', 'clinic_owner', 'active', now(), false, now());

insert into public.subscriptions (
  id, subscriber_id, plan_id, status, starts_at, expires_at
)
values
  ('55000000-0000-0000-0000-000000000001', '33000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', 'active', now() - interval '1 day', now() + interval '1 month'),
  ('55000000-0000-0000-0000-000000000005', '33000000-0000-0000-0000-000000000005', '22000000-0000-0000-0000-000000000001', 'active', now() - interval '1 day', now() + interval '1 month'),
  ('55000000-0000-0000-0000-000000000006', '33000000-0000-0000-0000-000000000006', '22000000-0000-0000-0000-000000000002', 'expiring_soon', now() - interval '1 month', now() + interval '1 day'),
  ('55000000-0000-0000-0000-000000000007', '33000000-0000-0000-0000-000000000007', '22000000-0000-0000-0000-000000000003', 'active', now() - interval '1 day', now() + interval '1 month'),
  ('55000000-0000-0000-0000-000000000008', '33000000-0000-0000-0000-000000000008', '22000000-0000-0000-0000-000000000004', 'active', now() - interval '1 day', now() + interval '1 month'),
  ('55000000-0000-0000-0000-000000000009', '33000000-0000-0000-0000-000000000009', '22000000-0000-0000-0000-000000000005', 'active', now() - interval '1 day', now() + interval '1 month'),
  ('55000000-0000-0000-0000-00000000000a', '33000000-0000-0000-0000-00000000000a', '22000000-0000-0000-0000-000000000006', 'active', now() - interval '1 day', now() + interval '1 month'),
  ('55000000-0000-0000-0000-00000000000b', '33000000-0000-0000-0000-00000000000b', '22000000-0000-0000-0000-000000000007', 'active', now() - interval '1 day', now() + interval '1 month'),
  ('55000000-0000-0000-0000-00000000000d', '33000000-0000-0000-0000-00000000000d', '22000000-0000-0000-0000-000000000001', 'suspended', now() - interval '1 day', now() + interval '1 month'),
  ('55000000-0000-0000-0000-00000000000e', '33000000-0000-0000-0000-00000000000e', '22000000-0000-0000-0000-000000000001', 'active', now() - interval '1 day', now() + interval '1 month'),
  ('55000000-0000-0000-0000-00000000000f', '33000000-0000-0000-0000-00000000000f', '22000000-0000-0000-0000-000000000001', 'active', now() - interval '1 day', now() + interval '1 month');

insert into public.clinics (
  id, subscriber_id, clinic_number, branch_type, name, email, contact_number,
  address_line_1, city, province, status, is_primary, activated_at
)
values
  ('66000000-0000-0000-0000-000000000001', '33000000-0000-0000-0000-000000000001', 'CLN-TESTCREATE1', 'main', 'Create Primary', 'create-primary@test.invalid', '+63 917 000 0001', 'Create Primary Address', 'Test City', 'Test Province', 'active', true, now()),
  ('66000000-0000-0000-0000-000000000005', '33000000-0000-0000-0000-000000000005', 'CLN-TESTUPDATE1', 'main', 'Update Primary', 'update-primary@test.invalid', '+63 917 000 0002', 'Update Primary Address', 'Test City', 'Test Province', 'active', true, now()),
  ('66000000-0000-0000-0000-000000000015', '33000000-0000-0000-0000-000000000005', 'CLN-TESTUPDATE2', 'satellite', 'Update Target', 'update-target@test.invalid', '+63 917 000 0003', 'Update Target Address', 'Test City', 'Test Province', 'active', false, now()),
  ('66000000-0000-0000-0000-000000000025', '33000000-0000-0000-0000-000000000005', 'CLN-TESTARCHIVE', 'satellite', 'Archived Target', 'archived-target@test.invalid', '+63 917 000 0004', 'Archived Target Address', 'Test City', 'Test Province', 'archived', false, null),
  ('66000000-0000-0000-0000-000000000006', '33000000-0000-0000-0000-000000000006', 'CLN-TESTUNLIM01', 'main', 'Unlimited Primary', 'unlimited-primary@test.invalid', '+63 917 000 0005', 'Unlimited Primary Address', 'Test City', 'Test Province', 'active', true, now()),
  ('66000000-0000-0000-0000-000000000007', '33000000-0000-0000-0000-000000000007', 'CLN-TESTNOINCL1', 'main', 'Not Included Primary', 'not-included-primary@test.invalid', '+63 917 000 0006', 'Not Included Primary Address', 'Test City', 'Test Province', 'active', true, now()),
  ('66000000-0000-0000-0000-000000000008', '33000000-0000-0000-0000-000000000008', 'CLN-TESTPENDING', 'main', 'Pending Primary', 'pending-primary@test.invalid', '+63 917 000 0007', 'Pending Primary Address', 'Test City', 'Test Province', 'active', true, now()),
  ('66000000-0000-0000-0000-000000000009', '33000000-0000-0000-0000-000000000009', 'CLN-TESTMISSING', 'main', 'Missing Primary', 'missing-primary@test.invalid', '+63 917 000 0008', 'Missing Primary Address', 'Test City', 'Test Province', 'active', true, now()),
  ('66000000-0000-0000-0000-00000000000a', '33000000-0000-0000-0000-00000000000a', 'CLN-TESTMALFORM', 'main', 'Malformed Primary', 'malformed-primary@test.invalid', '+63 917 000 0009', 'Malformed Primary Address', 'Test City', 'Test Province', 'active', true, now()),
  ('66000000-0000-0000-0000-00000000000b', '33000000-0000-0000-0000-00000000000b', 'CLN-TESTDUPLIM1', 'main', 'Duplicate Primary', 'duplicate-primary@test.invalid', '+63 917 000 0010', 'Duplicate Primary Address', 'Test City', 'Test Province', 'active', true, now()),
  ('66000000-0000-0000-0000-00000000000d', '33000000-0000-0000-0000-00000000000d', 'CLN-TESTSUSPEND', 'main', 'Suspended Primary', 'suspended-primary@test.invalid', '+63 917 000 0011', 'Suspended Primary Address', 'Test City', 'Test Province', 'active', true, now()),
  ('66000000-0000-0000-0000-00000000000e', '33000000-0000-0000-0000-00000000000e', 'CLN-TESTBADPRIM', 'main', 'Inactive Primary', 'inactive-primary@test.invalid', '+63 917 000 0012', 'Inactive Primary Address', 'Test City', 'Test Province', 'inactive', true, null),
  ('66000000-0000-0000-0000-00000000000f', '33000000-0000-0000-0000-00000000000f', 'CLN-TESTROLLBK1', 'main', 'Rollback Primary', 'rollback-primary@test.invalid', '+63 917 000 0013', 'Rollback Primary Address', 'Test City', 'Test Province', 'active', true, now()),
  ('66000000-0000-0000-0000-00000000001f', '33000000-0000-0000-0000-00000000000f', 'CLN-TESTROLLBK2', 'satellite', 'Rollback Target', 'rollback-target@test.invalid', '+63 917 000 0014', 'Rollback Target Address', 'Test City', 'Test Province', 'active', false, now());

insert into public.clinic_business_hours (
  subscriber_id, clinic_id, day_of_week, is_open, opening_time, closing_time, break_start, break_end
)
select '33000000-0000-0000-0000-000000000005'::uuid, '66000000-0000-0000-0000-000000000015'::uuid, day_number,
  day_number = 1,
  case when day_number = 1 then '09:00'::time end,
  case when day_number = 1 then '18:00'::time end,
  case when day_number = 1 then '12:00'::time end,
  case when day_number = 1 then '13:00'::time end
from generate_series(0, 6) day_number
union all
select '33000000-0000-0000-0000-00000000000f'::uuid, '66000000-0000-0000-0000-00000000001f'::uuid, day_number,
  day_number = 1,
  case when day_number = 1 then '09:00'::time end,
  case when day_number = 1 then '18:00'::time end,
  case when day_number = 1 then '12:00'::time end,
  case when day_number = 1 then '13:00'::time end
from generate_series(0, 6) day_number;

create function public.test_force_branch_hours_failure()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.clinics clinic
    where clinic.id = new.clinic_id
      and clinic.name in ('Late Failure Branch', 'Rollback Updated')
  ) then
    raise exception 'forced late business-hours failure';
  end if;
  return new;
end;
$$;

create trigger test_force_branch_hours_failure
  before insert on public.clinic_business_hours
  for each row execute function public.test_force_branch_hours_failure();

select extensions.ok(
  has_function_privilege('authenticated', 'public.create_my_clinic_branch(jsonb)', 'EXECUTE'),
  'authenticated can execute create branch RPC'
);
select extensions.ok(
  has_function_privilege('authenticated', 'public.update_my_clinic_branch(uuid,jsonb)', 'EXECUTE'),
  'authenticated can execute update branch RPC'
);
select extensions.ok(
  not has_function_privilege('anon', 'public.create_my_clinic_branch(jsonb)', 'EXECUTE'),
  'anonymous cannot execute create branch RPC'
);
select extensions.ok(
  not has_function_privilege('anon', 'public.update_my_clinic_branch(uuid,jsonb)', 'EXECUTE'),
  'anonymous cannot execute update branch RPC'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'app_private.resolve_clinic_owner_mutation_context()', 'EXECUTE'),
  'private owner context helper is not directly executable by authenticated users'
);

set local role anon;
select extensions.throws_ok(
  $$select public.create_my_clinic_branch('{}'::jsonb)$$,
  '42501',
  'permission denied for function create_my_clinic_branch',
  'anonymous create RPC call is rejected'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000002', true);
select extensions.throws_ok(
  $$select public.create_my_clinic_branch(pg_temp.test_branch_payload('Gated Branch', 'draft'))$$,
  'PT403', 'PASSWORD_CHANGE_REQUIRED',
  'password-gated owner is rejected'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000003', true);
select extensions.throws_ok(
  $$select public.create_my_clinic_branch(pg_temp.test_branch_payload('No Membership Branch', 'draft'))$$,
  'PT403', 'OWNER_MEMBERSHIP_REQUIRED',
  'user without an owner membership is rejected'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000004', true);
select extensions.throws_ok(
  $$select public.create_my_clinic_branch(pg_temp.test_branch_payload('Conflict Branch', 'draft'))$$,
  'PT409', 'OWNER_MEMBERSHIP_CONFLICT',
  'multiple active owner memberships are rejected'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-00000000000c', true);
select extensions.throws_ok(
  $$select public.create_my_clinic_branch(pg_temp.test_branch_payload('Inactive Subscriber Branch', 'draft'))$$,
  'PT409', 'SUBSCRIBER_UNAVAILABLE',
  'inactive subscriber is rejected'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-00000000000d', true);
select extensions.throws_ok(
  $$select public.create_my_clinic_branch(pg_temp.test_branch_payload('Suspended Subscription Branch', 'draft'))$$,
  'PT409', 'SUBSCRIPTION_UNAVAILABLE',
  'suspended subscription is not operational'
);

-- Direct owner table writes are denied while tenant reads remain available.
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000005', true);
select extensions.is(
  (select count(*) from public.clinics where id = '66000000-0000-0000-0000-000000000015'),
  1::bigint,
  'owner SELECT access remains functional'
);
select extensions.throws_ok(
  $$insert into public.clinics (subscriber_id, clinic_number, name, address_line_1, city, province)
    values ('33000000-0000-0000-0000-000000000005', 'CLN-DIRECTDENY', 'Direct Denied', 'Address', 'City', 'Province')$$,
  '42501', 'new row violates row-level security policy for table "clinics"',
  'owner direct clinic INSERT is denied'
);
select extensions.results_eq(
  $$update public.clinics set name = 'Direct Update Denied'
    where id = '66000000-0000-0000-0000-000000000015' returning id$$,
  $$select null::uuid where false$$,
  'owner direct clinic UPDATE changes no rows'
);
select extensions.results_eq(
  $$delete from public.clinics
    where id = '66000000-0000-0000-0000-000000000015' returning id$$,
  $$select null::uuid where false$$,
  'owner direct clinic DELETE changes no rows'
);
select extensions.results_eq(
  $$update public.clinic_business_hours set is_open = false
    where clinic_id = '66000000-0000-0000-0000-000000000015' returning id$$,
  $$select null::uuid where false$$,
  'owner direct business-hours UPDATE changes no rows'
);
select extensions.throws_ok(
  $$insert into public.clinic_business_hours (
      subscriber_id, clinic_id, day_of_week, is_open
    ) values (
      '33000000-0000-0000-0000-000000000005',
      '66000000-0000-0000-0000-000000000005', 0, false
    )$$,
  '42501', 'new row violates row-level security policy for table "clinic_business_hours"',
  'owner direct business-hours INSERT is denied'
);

-- Platform Admin direct behavior remains available through explicit policies.
select set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000001', true);
select extensions.lives_ok(
  $$insert into public.clinics (
      id, subscriber_id, clinic_number, branch_type, name, address_line_1, city, province, status, is_primary
    ) values (
      '66000000-0000-0000-0000-000000000099', '33000000-0000-0000-0000-000000000005',
      'CLN-TESTADMIN01', 'satellite', 'Admin Direct Clinic', 'Admin Address', 'Test City', 'Test Province', 'draft', false
    )$$,
  'Platform Admin direct clinic INSERT remains available'
);
select extensions.lives_ok(
  $$insert into public.clinic_business_hours (
      subscriber_id, clinic_id, day_of_week, is_open
    ) values (
      '33000000-0000-0000-0000-000000000005', '66000000-0000-0000-0000-000000000099', 0, false
    )$$,
  'Platform Admin direct hours INSERT remains available'
);
select extensions.lives_ok(
  $$update public.clinics set description = 'Admin update'
    where id = '66000000-0000-0000-0000-000000000099'$$,
  'Platform Admin direct clinic UPDATE remains available'
);
select extensions.lives_ok(
  $$delete from public.clinic_business_hours where clinic_id = '66000000-0000-0000-0000-000000000099';
    delete from public.clinics where id = '66000000-0000-0000-0000-000000000099'$$,
  'Platform Admin direct cleanup DELETE remains available'
);

-- Strict create payload and active validation.
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000001', true);
select extensions.throws_ok(
  $$select public.create_my_clinic_branch(
    pg_temp.test_branch_payload('Injected Subscriber Branch', 'draft') ||
    jsonb_build_object('subscriberId', '33000000-0000-0000-0000-000000000005')
  )$$,
  'PT422', 'INVALID_BRANCH_INPUT',
  'browser cannot submit subscriber identity'
);
select extensions.throws_ok(
  $$select public.create_my_clinic_branch(
    pg_temp.test_branch_payload('Injected Clinic Number Branch', 'draft') ||
    jsonb_build_object('clinicNumber', 'CLN-INJECTED')
  )$$,
  'PT422', 'INVALID_BRANCH_INPUT',
  'browser cannot submit clinic number'
);
select extensions.throws_ok(
  $$select public.create_my_clinic_branch(
    pg_temp.test_branch_payload('Injected Status Branch', 'draft') ||
    jsonb_build_object('status', 'active', 'isPrimary', true)
  )$$,
  'PT422', 'INVALID_BRANCH_INPUT',
  'browser cannot submit status or primary authority'
);
select extensions.throws_ok(
  $$select public.create_my_clinic_branch(pg_temp.test_branch_payload('Closed Active Branch', 'active', false))$$,
  'PT422', 'INVALID_BRANCH_INPUT',
  'active branch requires at least one open day'
);
select extensions.throws_ok(
  $$select public.create_my_clinic_branch(pg_temp.test_branch_payload('Missing Email Branch', 'active') - 'email')$$,
  'PT422', 'INVALID_BRANCH_INPUT',
  'active branch requires complete profile fields'
);

insert into test_rpc_results (label, payload)
select 'draft_create', public.create_my_clinic_branch(
  pg_temp.test_branch_payload('Draft Quota Branch', 'draft', false)
);
select extensions.is(
  (select payload ->> 'status' from test_rpc_results where label = 'draft_create'),
  'draft',
  'draft create returns safe draft DTO'
);
select extensions.is(
  (select count(*) from public.clinics
   where subscriber_id = '33000000-0000-0000-0000-000000000001'
     and status in ('draft', 'pending', 'active', 'inactive')),
  2::bigint,
  'draft consumes clinic quota'
);
select extensions.is(
  (select subscriber_id from public.clinics where name = 'Draft Quota Branch'),
  '33000000-0000-0000-0000-000000000001'::uuid,
  'created branch subscriber is derived from caller'
);
select extensions.matches(
  (select clinic_number from public.clinics where name = 'Draft Quota Branch'),
  '^CLN-[0-9A-F]{10}$',
  'clinic number is server-generated in the approved format'
);
select extensions.is(
  (select is_primary from public.clinics where name = 'Draft Quota Branch'),
  false,
  'new branch is non-primary'
);
select extensions.is(
  (select count(*) from public.clinic_business_hours hours
   join public.clinics clinic on clinic.id = hours.clinic_id
   where clinic.name = 'Draft Quota Branch'),
  7::bigint,
  'draft create persists all seven business-hours rows'
);
select extensions.is(
  (select count(*) from public.clinic_business_hours hours
   join public.clinics clinic on clinic.id = hours.clinic_id
   where clinic.name = 'Draft Quota Branch'
     and not hours.is_open
     and (hours.opening_time is not null or hours.closing_time is not null or hours.break_start is not null or hours.break_end is not null)),
  0::bigint,
  'closed days are normalized to null times'
);
select extensions.is(
  (select count(*) from public.audit_events event
   join public.clinics clinic on clinic.id = event.clinic_id
   where clinic.name = 'Draft Quota Branch'
     and event.event_type = 'clinic.branch.created'
     and event.actor_user_id = '11000000-0000-0000-0000-000000000001'),
  1::bigint,
  'create writes one server-authored audit event'
);

insert into test_rpc_results (label, payload)
select 'active_create', public.create_my_clinic_branch(
  pg_temp.test_branch_payload('Active Quota Branch', 'active', true)
);
select extensions.is(
  (select payload ->> 'status' from test_rpc_results where label = 'active_create'),
  'active',
  'active create returns safe active DTO'
);
select extensions.is(
  jsonb_array_length((select payload -> 'businessHours' from test_rpc_results where label = 'active_create')),
  7,
  'safe DTO returns seven business-hours rows'
);
select extensions.ok(
  not ((select payload from test_rpc_results where label = 'active_create') ? 'subscriberId'),
  'safe DTO omits subscriber authorization metadata'
);
select extensions.is(
  (select count(*) from public.clinics
   where subscriber_id = '33000000-0000-0000-0000-000000000001'
     and is_primary and status = 'active'),
  1::bigint,
  'create does not disturb the existing primary clinic'
);
select extensions.throws_ok(
  $$select public.create_my_clinic_branch(pg_temp.test_branch_payload('Over Quota Branch', 'draft'))$$,
  'PT409', 'CLINIC_QUOTA_REACHED',
  'numeric quota boundary is enforced exactly'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000006', true);
select extensions.lives_ok(
  $$select public.create_my_clinic_branch(pg_temp.test_branch_payload('Unlimited Branch', 'active'))$$,
  'unlimited clinic quota succeeds'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000007', true);
select extensions.throws_ok(
  $$select public.create_my_clinic_branch(pg_temp.test_branch_payload('Not Included Branch', 'draft'))$$,
  'PT409', 'CLINIC_QUOTA_REACHED',
  'not-included clinic quota is rejected'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000008', true);
select extensions.throws_ok(
  $$select public.create_my_clinic_branch(pg_temp.test_branch_payload('Pending Limit Branch', 'draft'))$$,
  'PT409', 'PLAN_UNAVAILABLE',
  'pending clinic limit fails closed'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000009', true);
select extensions.throws_ok(
  $$select public.create_my_clinic_branch(pg_temp.test_branch_payload('Missing Limit Branch', 'draft'))$$,
  'PT409', 'PLAN_UNAVAILABLE',
  'missing clinic limit fails closed'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-00000000000a', true);
select extensions.throws_ok(
  $$select public.create_my_clinic_branch(pg_temp.test_branch_payload('Malformed Limit Branch', 'draft'))$$,
  'PT409', 'PLAN_UNAVAILABLE',
  'malformed numeric clinic limit fails closed'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-00000000000b', true);
select extensions.throws_ok(
  $$select public.create_my_clinic_branch(pg_temp.test_branch_payload('Duplicate Limit Branch', 'draft'))$$,
  'PT409', 'PLAN_UNAVAILABLE',
  'duplicate clinic limit entries fail closed'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-00000000000e', true);
select extensions.throws_ok(
  $$select public.create_my_clinic_branch(pg_temp.test_branch_payload('Unhealthy Primary Branch', 'draft'))$$,
  'PT409', 'PRIMARY_CLINIC_CONFLICT',
  'unhealthy primary invariant blocks creation'
);

-- Controlled update contract.
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000005', true);
select extensions.throws_ok(
  $$select public.update_my_clinic_branch(
    '66000000-0000-0000-0000-000000000015',
    jsonb_build_object('subscriberId', '33000000-0000-0000-0000-000000000001')
  )$$,
  'PT422', 'INVALID_BRANCH_INPUT',
  'update cannot change subscriber authority'
);
select extensions.throws_ok(
  $$select public.update_my_clinic_branch(
    '66000000-0000-0000-0000-000000000015',
    jsonb_build_object('clinicNumber', 'CLN-INJECTED', 'status', 'draft', 'isPrimary', true)
  )$$,
  'PT422', 'INVALID_BRANCH_INPUT',
  'update cannot change clinic number, status, or primary authority'
);
select extensions.throws_ok(
  $$select public.update_my_clinic_branch(
    '66000000-0000-0000-0000-000000000015',
    jsonb_build_object('saveMode', 'draft')
  )$$,
  'PT422', 'INVALID_BRANCH_INPUT',
  'update does not accept saveMode'
);
select extensions.throws_ok(
  $$select public.update_my_clinic_branch(
    '66000000-0000-0000-0000-000000000001',
    jsonb_build_object('name', 'Cross Tenant Update')
  )$$,
  'PT404', 'CLINIC_NOT_FOUND',
  'cross-tenant clinic UUID returns safe not-found'
);
select extensions.throws_ok(
  $$select public.update_my_clinic_branch(
    '66000000-0000-0000-0000-000000000025',
    jsonb_build_object('name', 'Archived Update')
  )$$,
  'PT422', 'INVALID_BRANCH_INPUT',
  'archived clinic cannot be updated'
);

insert into test_rpc_results (label, payload)
select 'update', public.update_my_clinic_branch(
  '66000000-0000-0000-0000-000000000015',
  jsonb_build_object(
    'name', 'Updated Target Branch',
    'businessHours', pg_temp.test_business_hours(true)
  )
);
select extensions.is(
  (select payload ->> 'name' from test_rpc_results where label = 'update'),
  'Updated Target Branch',
  'same-tenant branch update succeeds and returns safe DTO'
);
select extensions.is(
  (select clinic_number from public.clinics where id = '66000000-0000-0000-0000-000000000015'),
  'CLN-TESTUPDATE2',
  'update preserves clinic number'
);
select extensions.is(
  (select subscriber_id from public.clinics where id = '66000000-0000-0000-0000-000000000015'),
  '33000000-0000-0000-0000-000000000005'::uuid,
  'update preserves subscriber identity'
);
select extensions.is(
  (select status from public.clinics where id = '66000000-0000-0000-0000-000000000015'),
  'active'::public.clinic_status,
  'update preserves clinic status'
);
select extensions.is(
  (select is_primary from public.clinics where id = '66000000-0000-0000-0000-000000000015'),
  false,
  'update preserves primary state'
);
select extensions.is(
  (select count(*) from public.clinic_business_hours
   where clinic_id = '66000000-0000-0000-0000-000000000015'),
  7::bigint,
  'business hours replace atomically with seven rows'
);
select extensions.is(
  (select count(*) from public.audit_events
   where clinic_id = '66000000-0000-0000-0000-000000000015'
     and event_type = 'clinic.branch.updated'
     and metadata -> 'changed_fields' ? 'businessHours'),
  1::bigint,
  'update audit records changed field names without full payload'
);
select extensions.lives_ok(
  $$select public.update_my_clinic_branch(
    '66000000-0000-0000-0000-000000000015',
    jsonb_build_object('description', 'Active target remains complete')
  )$$,
  'active target with existing complete hours can update profile only'
);

-- Forced late failures prove function-level transaction rollback.
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-00000000000f', true);
select extensions.throws_ok(
  $$select public.create_my_clinic_branch(pg_temp.test_branch_payload('Late Failure Branch', 'active'))$$,
  'PT503', 'DATA_UNAVAILABLE',
  'late create hours failure is mapped to a safe error'
);
select extensions.is(
  (select count(*) from public.clinics where name = 'Late Failure Branch'),
  0::bigint,
  'late create failure rolls back clinic insertion'
);
select extensions.is(
  (select count(*) from public.audit_events where event_type = 'clinic.branch.created'
   and subscriber_id = '33000000-0000-0000-0000-00000000000f'),
  0::bigint,
  'late create failure leaves no audit event'
);

select extensions.throws_ok(
  $$select public.update_my_clinic_branch(
    '66000000-0000-0000-0000-00000000001f',
    jsonb_build_object('name', 'Rollback Updated', 'businessHours', pg_temp.test_business_hours(true))
  )$$,
  'PT503', 'DATA_UNAVAILABLE',
  'late update hours failure is mapped to a safe error'
);
select extensions.is(
  (select name from public.clinics where id = '66000000-0000-0000-0000-00000000001f'),
  'Rollback Target',
  'late update failure rolls back clinic profile changes'
);
select extensions.is(
  (select count(*) from public.clinic_business_hours
   where clinic_id = '66000000-0000-0000-0000-00000000001f'),
  7::bigint,
  'late update failure preserves original hours'
);
select extensions.is(
  (select count(*) from public.audit_events
   where clinic_id = '66000000-0000-0000-0000-00000000001f'
     and event_type = 'clinic.branch.updated'),
  0::bigint,
  'late update failure leaves no audit event'
);

reset role;
select * from extensions.finish();
rollback;
