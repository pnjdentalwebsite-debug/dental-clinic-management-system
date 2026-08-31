begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

create temporary table associate_test_results (
  label text primary key,
  payload jsonb not null
);
grant select, insert, update, delete on table associate_test_results to service_role;
grant select on table associate_test_results to authenticated;

create function pg_temp.associate_payload(p_email text, p_clinic_ids uuid[])
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'email', p_email,
    'firstName', 'Ava',
    'middleName', 'Q',
    'lastName', 'Dentist',
    'mobileNumber', '+63 917 000 0000',
    'address', 'Associate contract test address',
    'licenseNumber', 'LIC-' || p_email,
    'ptrNumber', 'PTR-' || p_email,
    's2LicenseNumber', 'S2-' || p_email,
    'designation', 'Associate Dentist',
    'specialization', 'General Dentistry',
    'calendarColor', '#2563eb',
    'certificatesAndQualifications', 'Contract-test qualification',
    'clinicIds', to_jsonb(p_clinic_ids)
  );
$$;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'associate-owner-a@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'associate-owner-gated@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'associate-non-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'associate-owner-ambiguous@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'associate-owner-b@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-4000-8000-000000000011', 'authenticated', 'authenticated', 'associate-one@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-4000-8000-000000000012', 'authenticated', 'authenticated', 'associate-two@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-4000-8000-000000000013', 'authenticated', 'authenticated', 'associate-other-tenant@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-4000-8000-000000000014', 'authenticated', 'authenticated', 'associate-direct-write@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.profiles (id, email, first_name, last_name)
values
  ('10000000-0000-4000-8000-000000000001', 'associate-owner-a@test.invalid', 'Owner', 'A'),
  ('10000000-0000-4000-8000-000000000002', 'associate-owner-gated@test.invalid', 'Gated', 'Owner'),
  ('10000000-0000-4000-8000-000000000003', 'associate-non-owner@test.invalid', 'Non', 'Owner'),
  ('10000000-0000-4000-8000-000000000004', 'associate-owner-ambiguous@test.invalid', 'Multi', 'Owner'),
  ('10000000-0000-4000-8000-000000000005', 'associate-owner-b@test.invalid', 'Owner', 'B'),
  ('10000000-0000-4000-8000-000000000011', 'associate-one@test.invalid', 'Ava', 'Dentist'),
  ('10000000-0000-4000-8000-000000000012', 'associate-two@test.invalid', 'Bea', 'Dentist'),
  ('10000000-0000-4000-8000-000000000013', 'associate-other-tenant@test.invalid', 'Cia', 'Dentist'),
  ('10000000-0000-4000-8000-000000000014', 'associate-direct-write@test.invalid', 'Direct', 'Write')
on conflict (id) do update set email = excluded.email, first_name = excluded.first_name, last_name = excluded.last_name;

insert into public.plans (id, plan_code, name, status, limits, features)
values
  ('20000000-0000-4000-8000-000000000001', 'associate-contract-two', 'Associate Contract Two', 'active',
    '[{"key":"associates","label":"Associate Dentists","type":"number","value":2}]'::jsonb, '[]'::jsonb),
  ('20000000-0000-4000-8000-000000000002', 'associate-contract-one', 'Associate Contract One', 'active',
    '[{"key":"associates","label":"Associate Dentists","type":"number","value":1}]'::jsonb, '[]'::jsonb)
on conflict (plan_code) do update set limits = excluded.limits, status = excluded.status, updated_at = now();

insert into public.subscribers (id, subscriber_number, business_name, email, account_status, activated_at)
values
  ('30000000-0000-4000-8000-000000000001', 'SUB-ASSOCIATE-A', 'Associate Contract A', 'associate-contract-a@test.invalid', 'active', now()),
  ('30000000-0000-4000-8000-000000000002', 'SUB-ASSOCIATE-B', 'Associate Contract B', 'associate-contract-b@test.invalid', 'active', now()),
  ('30000000-0000-4000-8000-000000000003', 'SUB-ASSOCIATE-GATED', 'Associate Contract Gated', 'associate-contract-gated@test.invalid', 'active', now()),
  ('30000000-0000-4000-8000-000000000004', 'SUB-ASSOCIATE-MULTI-A', 'Associate Contract Multi A', 'associate-contract-multi-a@test.invalid', 'active', now()),
  ('30000000-0000-4000-8000-000000000005', 'SUB-ASSOCIATE-MULTI-B', 'Associate Contract Multi B', 'associate-contract-multi-b@test.invalid', 'active', now())
on conflict (id) do update set account_status = excluded.account_status, activated_at = excluded.activated_at;

insert into public.subscriptions (id, subscriber_id, plan_id, status, starts_at, expires_at)
values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'active', now() - interval '1 day', now() + interval '1 month')
on conflict (id) do update set status = excluded.status, starts_at = excluded.starts_at, expires_at = excluded.expires_at;

insert into public.clinics (
  id, subscriber_id, clinic_number, branch_type, name, email, contact_number,
  address_line_1, city, province, status, is_primary, activated_at
)
values
  ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'CLN-ASSOCIATE-A1', 'main', 'Associate A Primary', 'associate-a1@test.invalid', '+63 917 000 0001', 'A1 Address', 'Test City', 'Test Province', 'active', true, now()),
  ('50000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'CLN-ASSOCIATE-A2', 'satellite', 'Associate A Satellite', 'associate-a2@test.invalid', '+63 917 000 0002', 'A2 Address', 'Test City', 'Test Province', 'active', false, now()),
  ('50000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002', 'CLN-ASSOCIATE-B1', 'main', 'Associate B Primary', 'associate-b1@test.invalid', '+63 917 000 0003', 'B1 Address', 'Test City', 'Test Province', 'active', true, now())
on conflict (id) do update set status = excluded.status, activated_at = excluded.activated_at;

insert into public.subscriber_memberships (
  id, subscriber_id, user_id, role, account_status, activated_at, must_change_password, password_changed_at
)
values
  ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'clinic_owner', 'active', now(), false, now()),
  ('60000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'clinic_owner', 'active', now(), true, null),
  ('60000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', 'clinic_owner', 'active', now(), false, now()),
  ('60000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000004', 'clinic_owner', 'active', now(), false, now()),
  ('60000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000005', 'clinic_owner', 'active', now(), false, now()),
  ('60000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000013', 'associate', 'active', now(), true, null)
on conflict (id) do update set account_status = excluded.account_status, must_change_password = excluded.must_change_password;

set local role service_role;

select extensions.ok(
  has_function_privilege('service_role', 'public.begin_associate_provisioning(uuid,jsonb)', 'execute'),
  'service role can execute Associate provisioning claim RPC'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'public.begin_associate_provisioning(uuid,jsonb)', 'execute'),
  'authenticated browser role cannot execute Associate provisioning claim RPC'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'public.update_my_associate_dentist(uuid,uuid,jsonb)', 'execute'),
  'authenticated browser role cannot execute Associate edit RPC'
);
set local role authenticated;
select extensions.throws_ok(
  $$select app_private.resolve_associate_provisioning_owner('10000000-0000-4000-8000-000000000001')$$,
  '42501', 'permission denied for function resolve_associate_provisioning_owner', 'authenticated browser role cannot execute the private owner resolver'
);
set local role service_role;

select extensions.throws_ok(
  $$select public.begin_associate_provisioning(null, pg_temp.associate_payload('unauthenticated@test.invalid', array['50000000-0000-4000-8000-000000000001'::uuid]))$$,
  'PT401', 'AUTH_REQUIRED', 'missing authenticated actor is rejected'
);
select extensions.throws_ok(
  $$select public.begin_associate_provisioning('10000000-0000-4000-8000-000000000003', pg_temp.associate_payload('non-owner@test.invalid', array['50000000-0000-4000-8000-000000000001'::uuid]))$$,
  'PT403', 'CLINIC_OWNER_ACCESS_REQUIRED', 'non-owner provisioning is rejected'
);
select extensions.throws_ok(
  $$select public.begin_associate_provisioning('10000000-0000-4000-8000-000000000002', pg_temp.associate_payload('gated-owner@test.invalid', array['50000000-0000-4000-8000-000000000001'::uuid]))$$,
  'PT403', 'FIRST_LOGIN_REQUIRED', 'incomplete first-login owner is rejected'
);
select extensions.throws_ok(
  $$select public.begin_associate_provisioning('10000000-0000-4000-8000-000000000004', pg_temp.associate_payload('multi-owner@test.invalid', array['50000000-0000-4000-8000-000000000001'::uuid]))$$,
  'PT409', 'CLINIC_OWNER_CONTEXT_AMBIGUOUS', 'ambiguous owner context fails closed'
);
select extensions.throws_ok(
  $$select public.begin_associate_provisioning('10000000-0000-4000-8000-000000000001', jsonb_build_object('subscriberId', '30000000-0000-4000-8000-000000000002'))$$,
  'PT422', 'INVALID_ASSOCIATE_INPUT', 'browser cannot select subscriber authority'
);
select extensions.throws_ok(
  $$select public.begin_associate_provisioning('10000000-0000-4000-8000-000000000001', pg_temp.associate_payload('bad-role@test.invalid', array['50000000-0000-4000-8000-000000000001'::uuid]) || jsonb_build_object('role', 'staff', 'temporaryPassword', 'browser-chosen'))$$,
  'PT422', 'INVALID_ASSOCIATE_INPUT', 'role and temporary credential browser fields are rejected'
);
select extensions.throws_ok(
  $$select public.begin_associate_provisioning('10000000-0000-4000-8000-000000000001', pg_temp.associate_payload('cross-clinic@test.invalid', array['50000000-0000-4000-8000-000000000003'::uuid]))$$,
  'PT422', 'INVALID_CLINIC_ASSIGNMENT', 'cross-subscriber clinic assignment rejects the whole request'
);
select extensions.throws_ok(
  $$select public.begin_associate_provisioning('10000000-0000-4000-8000-000000000001', pg_temp.associate_payload('duplicate-clinic@test.invalid', array['50000000-0000-4000-8000-000000000001'::uuid, '50000000-0000-4000-8000-000000000001'::uuid]))$$,
  'PT422', 'INVALID_CLINIC_ASSIGNMENT', 'duplicate clinic IDs are rejected before assignments can be created'
);
select extensions.is(
  (select limits -> 0 ->> 'value' from public.plans where plan_code = 'associate-contract-two'),
  '2', 'the fixture plan persists an Associate limit of two'
);

insert into associate_test_results (label, payload)
select 'associate-one-claim', to_jsonb(result)
from public.begin_associate_provisioning(
  '10000000-0000-4000-8000-000000000001',
  pg_temp.associate_payload('associate-one@test.invalid', array['50000000-0000-4000-8000-000000000001'::uuid, '50000000-0000-4000-8000-000000000002'::uuid])
) result;
select extensions.is(
  (select payload ->> 'operation' from associate_test_results where label = 'associate-one-claim'),
  'create', 'valid multi-clinic Associate request creates a server claim'
);
select public.record_associate_provisioning_auth_identity(
  (select (payload ->> 'attempt_id')::uuid from associate_test_results where label = 'associate-one-claim'),
  '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000011'
);
insert into associate_test_results (label, payload)
select 'associate-one-complete', to_jsonb(result)
from public.complete_associate_provisioning(
  (select (payload ->> 'attempt_id')::uuid from associate_test_results where label = 'associate-one-claim'),
  '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000011'
) result;
select extensions.matches(
  (select payload ->> 'associate_number' from associate_test_results where label = 'associate-one-complete'),
  '^DEN-[A-F0-9]{10}$', 'Associate number is generated server-side in canonical DEN format'
);
select extensions.is(
  (select count(*) from public.subscriber_memberships where id = (select (payload ->> 'membership_id')::uuid from associate_test_results where label = 'associate-one-complete') and role = 'associate' and account_status = 'active' and must_change_password),
  1::bigint, 'completion creates one active password-gated Associate membership'
);
select extensions.is(
  (select count(*) from public.clinic_assignments where membership_id = (select (payload ->> 'membership_id')::uuid from associate_test_results where label = 'associate-one-complete') and assignment_role = 'associate' and status = 'active'),
  2::bigint, 'completion creates every validated clinic assignment transactionally'
);
select public.record_associate_credential_delivery(
  (select (payload ->> 'attempt_id')::uuid from associate_test_results where label = 'associate-one-claim'),
  '10000000-0000-4000-8000-000000000001', 'sent', null
);
select extensions.is(
  (select credential_delivery_status from public.associate_provisioning_attempts where id = (select (payload ->> 'attempt_id')::uuid from associate_test_results where label = 'associate-one-claim')),
  'sent', 'delivery ledger records only safe sent state'
);
insert into associate_test_results (label, payload)
select 'associate-one-duplicate', to_jsonb(result)
from public.begin_associate_provisioning(
  '10000000-0000-4000-8000-000000000001',
  pg_temp.associate_payload('associate-one@test.invalid', array['50000000-0000-4000-8000-000000000001'::uuid, '50000000-0000-4000-8000-000000000002'::uuid])
) result;
select extensions.is(
  (select payload ->> 'operation' from associate_test_results where label = 'associate-one-duplicate'),
  'completed', 'duplicate delivery-confirmed provisioning returns safe completion rather than a second Associate'
);
select extensions.is(
  (select count(*) from public.subscriber_memberships where subscriber_id = '30000000-0000-4000-8000-000000000001' and role = 'associate'),
  1::bigint, 'duplicate provisioning cannot create another Associate membership'
);

insert into associate_test_results (label, payload)
select 'associate-two-claim', to_jsonb(result)
from public.begin_associate_provisioning(
  '10000000-0000-4000-8000-000000000001',
  pg_temp.associate_payload('associate-two@test.invalid', array['50000000-0000-4000-8000-000000000001'::uuid])
) result;
select public.record_associate_provisioning_auth_identity(
  (select (payload ->> 'attempt_id')::uuid from associate_test_results where label = 'associate-two-claim'),
  '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000012'
);
select public.complete_associate_provisioning(
  (select (payload ->> 'attempt_id')::uuid from associate_test_results where label = 'associate-two-claim'),
  '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000012'
);
select extensions.throws_ok(
  $$select public.begin_associate_provisioning('10000000-0000-4000-8000-000000000001', pg_temp.associate_payload('associate-three@test.invalid', array['50000000-0000-4000-8000-000000000001'::uuid]))$$,
  'PT409', 'ASSOCIATE_QUOTA_REACHED', 'final quota boundary rejects over-limit Associate provisioning'
);
select extensions.is(
  (select count(*) from public.associate_provisioning_attempts where email_normalized = 'associate-three@test.invalid'),
  0::bigint, 'quota rejection leaves no Associate provisioning attempt or partial record'
);

select extensions.throws_ok(
  $$select public.update_my_associate_dentist('10000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000007', jsonb_build_object('designation', 'Cross Tenant'))$$,
  'PT404', 'ASSOCIATE_NOT_FOUND', 'cross-subscriber Associate edit fails closed'
);
select extensions.throws_ok(
  $$select public.update_my_associate_dentist('10000000-0000-4000-8000-000000000001', (select (payload ->> 'membership_id')::uuid from associate_test_results where label = 'associate-one-complete'), jsonb_build_object('email', 'unsafe@test.invalid', 'role', 'staff', 'accountStatus', 'suspended', 'subscriberId', '30000000-0000-4000-8000-000000000002'))$$,
  'PT422', 'INVALID_ASSOCIATE_INPUT', 'edit cannot change email, role, subscriber, or lifecycle authority'
);
select extensions.throws_ok(
  $$select public.update_my_associate_dentist('10000000-0000-4000-8000-000000000001', (select (payload ->> 'membership_id')::uuid from associate_test_results where label = 'associate-one-complete'), jsonb_build_object('clinicIds', jsonb_build_array('50000000-0000-4000-8000-000000000003')) )$$,
  'PT422', 'INVALID_CLINIC_ASSIGNMENT', 'invalid assignment replacement rejects before any current assignment is deleted'
);
select extensions.is(
  (select count(*) from public.clinic_assignments where membership_id = (select (payload ->> 'membership_id')::uuid from associate_test_results where label = 'associate-one-complete') and assignment_role = 'associate'),
  2::bigint, 'invalid assignment replacement leaves prior assignment set unchanged'
);
select extensions.is(
  public.update_my_associate_dentist(
    '10000000-0000-4000-8000-000000000001',
    (select (payload ->> 'membership_id')::uuid from associate_test_results where label = 'associate-one-complete'),
    jsonb_build_object('firstName', 'Avery', 'designation', 'Orthodontic Associate', 'clinicIds', jsonb_build_array('50000000-0000-4000-8000-000000000002'))
  ) ->> 'updated',
  'true', 'same-subscriber Associate edit updates only approved fields'
);
select extensions.is(
  (select first_name from public.profiles where id = '10000000-0000-4000-8000-000000000011'),
  'Avery', 'approved profile field is updated through the service boundary'
);
select extensions.is(
  (select designation from public.associate_dentist_profiles where membership_id = (select (payload ->> 'membership_id')::uuid from associate_test_results where label = 'associate-one-complete')),
  'Orthodontic Associate', 'approved professional field is updated through the service boundary'
);
select extensions.is(
  (select array_agg(clinic_id order by clinic_id)::text from public.clinic_assignments where membership_id = (select (payload ->> 'membership_id')::uuid from associate_test_results where label = 'associate-one-complete') and assignment_role = 'associate'),
  array['50000000-0000-4000-8000-000000000002'::uuid]::text, 'valid assignment replacement is exact and atomic'
);
select extensions.is(
  (select count(*) from public.audit_events where event_type = 'associate.provisioned' and subscriber_id = '30000000-0000-4000-8000-000000000001'),
  2::bigint, 'each completed Associate provisioning writes an audit event'
);
select extensions.is(
  (select count(*) from public.audit_events where event_type = 'associate.updated' and subscriber_id = '30000000-0000-4000-8000-000000000001'),
  1::bigint, 'Associate edit writes a server-owned audit event'
);
select extensions.is(
  (select count(*) from public.audit_events where subscriber_id = '30000000-0000-4000-8000-000000000001' and metadata::text ~* '(password|token|secret)'),
  0::bigint, 'Associate audit metadata contains no password, token, or secret material'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
update public.subscriber_memberships set account_status = 'suspended'
where id = (select (payload ->> 'membership_id')::uuid from associate_test_results where label = 'associate-one-complete');
select extensions.is(
  (select account_status::text from public.subscriber_memberships where id = (select (payload ->> 'membership_id')::uuid from associate_test_results where label = 'associate-one-complete')),
  'active', 'direct browser membership lifecycle update is blocked by hardened RLS'
);
update public.associate_dentist_profiles set designation = 'Browser Edited'
where membership_id = (select (payload ->> 'membership_id')::uuid from associate_test_results where label = 'associate-one-complete');
select extensions.is(
  (select designation from public.associate_dentist_profiles where membership_id = (select (payload ->> 'membership_id')::uuid from associate_test_results where label = 'associate-one-complete')),
  'Orthodontic Associate', 'direct browser Associate profile update is blocked by hardened RLS'
);
update public.clinic_assignments set status = 'inactive'
where membership_id = (select (payload ->> 'membership_id')::uuid from associate_test_results where label = 'associate-one-complete');
select extensions.is(
  (select status::text from public.clinic_assignments where membership_id = (select (payload ->> 'membership_id')::uuid from associate_test_results where label = 'associate-one-complete')),
  'active', 'direct browser assignment update is blocked by hardened RLS'
);
select extensions.throws_ok(
  $$insert into public.subscriber_memberships (subscriber_id, user_id, role, account_status) values ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000014', 'associate', 'active')$$,
  '42501', 'new row violates row-level security policy for table "subscriber_memberships"', 'direct browser Associate membership insert is blocked by hardened RLS'
);

reset role;
select * from extensions.finish();
rollback;
