begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(43);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'gated-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'completed-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'platform-admin@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'gated-staff@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'no-membership@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'multiple-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.platform_admins (user_id)
values ('10000000-0000-0000-0000-000000000003');

insert into public.subscribers (
  id, subscriber_number, business_name, email, account_status, activated_at
)
values
  ('20000000-0000-0000-0000-000000000001', 'SUB-RLS-GATED', 'Gated Dental', 'gated@test.invalid', 'active', now()),
  ('20000000-0000-0000-0000-000000000002', 'SUB-RLS-COMPLETE', 'Completed Dental', 'complete@test.invalid', 'active', now()),
  ('20000000-0000-0000-0000-000000000003', 'SUB-RLS-MULTI-A', 'Multiple A Dental', 'multi-a@test.invalid', 'active', now()),
  ('20000000-0000-0000-0000-000000000004', 'SUB-RLS-MULTI-B', 'Multiple B Dental', 'multi-b@test.invalid', 'active', now());

insert into public.subscriber_memberships (
  id, subscriber_id, user_id, role, account_status, activated_at,
  must_change_password, password_changed_at
)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'clinic_owner', 'active', now(), true, null),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'clinic_owner', 'active', now(), false, now()),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'staff', 'active', now(), true, null),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006', 'clinic_owner', 'active', now(), true, null),
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000006', 'clinic_owner', 'active', now(), true, null);

insert into public.clinics (
  id, subscriber_id, clinic_number, name, address_line_1, city, province,
  status, is_primary, activated_at
)
values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'CLN-RLS-GATED', 'Gated Clinic', 'Test Address', 'Test City', 'Test Province', 'active', true, now()),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'CLN-RLS-COMPLETE', 'Completed Clinic', 'Test Address', 'Test City', 'Test Province', 'active', true, now());

insert into public.clinic_assignments (
  id, subscriber_id, clinic_id, membership_id, assignment_role, status
)
values (
  '50000000-0000-0000-0000-000000000004',
  '20000000-0000-0000-0000-000000000002',
  '40000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000004',
  'staff',
  'active'
);

insert into public.patients (
  id, subscriber_id, clinic_id, patient_number, first_name, last_name,
  birth_date, sex, status
)
values
  ('60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'PAT-RLS-GATED', 'Gated', 'Patient', '1990-01-01', 'Undisclosed', 'active'),
  ('60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'PAT-RLS-COMPLETE', 'Completed', 'Patient', '1990-01-01', 'Undisclosed', 'active');

insert into public.appointments (
  id, subscriber_id, clinic_id, patient_id, title, starts_at
)
values
  ('70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'Gated appointment', now()),
  ('70000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', 'Completed appointment', now());

insert into public.patient_bills (
  id, subscriber_id, clinic_id, patient_id, invoice_number, total_centavos
)
values
  ('80000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'INV-RLS-GATED', 10000),
  ('80000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', 'INV-RLS-COMPLETE', 10000);

insert into public.payments (
  id, subscriber_id, payment_method, reference_number, amount_centavos, status
)
values
  ('90000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Development Test', 'RLS-GATED', 10000, 'approved'),
  ('90000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Development Test', 'RLS-COMPLETE', 10000, 'approved');

insert into public.subscriptions (
  id, subscriber_id, plan_id, status, starts_at
)
select
  fixture.id,
  fixture.subscriber_id,
  plan.id,
  'active',
  now()
from (
  values
    ('a0000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000001'::uuid),
    ('a0000000-0000-0000-0000-000000000002'::uuid, '20000000-0000-0000-0000-000000000002'::uuid)
) fixture(id, subscriber_id)
cross join lateral (
  select id from public.plans where plan_code = 'basic'
) plan;

insert into public.audit_events (
  id, actor_user_id, subscriber_id, clinic_id, event_type, entity_type, entity_id
)
values
  ('b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'test.rls.gated', 'subscriber', '20000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'test.rls.completed', 'subscriber', '20000000-0000-0000-0000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select extensions.is(app_private.is_subscriber_member('20000000-0000-0000-0000-000000000001'), false, 'gated owner is not a normal subscriber member');
select extensions.is(app_private.is_subscriber_owner('20000000-0000-0000-0000-000000000001'), false, 'gated owner does not qualify as subscriber owner');
select extensions.is(app_private.can_access_clinic('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001'), false, 'gated owner cannot access the clinic');
select extensions.is((select count(*) from public.subscribers where id = '20000000-0000-0000-0000-000000000001'), 0::bigint, 'gated owner cannot read subscriber');
select extensions.is((select count(*) from public.clinics where id = '40000000-0000-0000-0000-000000000001'), 0::bigint, 'gated owner cannot read clinic');
select extensions.is((select count(*) from public.patients where id = '60000000-0000-0000-0000-000000000001'), 0::bigint, 'gated owner cannot read patient');
select extensions.is((select count(*) from public.appointments where id = '70000000-0000-0000-0000-000000000001'), 0::bigint, 'gated owner cannot read appointment');
select extensions.is((select count(*) from public.subscriptions where subscriber_id = '20000000-0000-0000-0000-000000000001'), 0::bigint, 'gated owner cannot read subscription');
select extensions.is((select count(*) from public.payments where id = '90000000-0000-0000-0000-000000000001'), 0::bigint, 'gated owner cannot read platform payment');
select extensions.is((select count(*) from public.patient_bills where id = '80000000-0000-0000-0000-000000000001'), 0::bigint, 'gated owner cannot read patient billing');
select extensions.is((select count(*) from public.audit_events where id = 'b0000000-0000-0000-0000-000000000001'), 0::bigint, 'gated owner cannot read tenant audit event');
select extensions.is((select count(*) from public.subscriber_memberships), 0::bigint, 'gated owner cannot query membership table directly');
select extensions.is(jsonb_array_length(public.get_my_first_login_state() -> 'memberships'), 1, 'narrow RPC returns the caller own membership state');
select extensions.is(public.get_my_first_login_state() #>> '{memberships,0,mustChangePassword}', 'true', 'narrow RPC exposes the first-login flag');
select extensions.ok(not ((public.get_my_first_login_state() -> 'memberships' -> 0) ? 'subscriberId'), 'narrow RPC omits subscriber identity');
select extensions.ok(not ((public.get_my_first_login_state() -> 'memberships' -> 0) ? 'permissions'), 'narrow RPC omits membership permissions');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select extensions.is(app_private.is_subscriber_member('20000000-0000-0000-0000-000000000002'), true, 'completed owner is a normal subscriber member');
select extensions.is(app_private.is_subscriber_owner('20000000-0000-0000-0000-000000000002'), true, 'completed owner qualifies as subscriber owner');
select extensions.is(app_private.can_access_clinic('20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002'), true, 'completed owner can access primary clinic');
select extensions.is((select count(*) from public.subscribers where id = '20000000-0000-0000-0000-000000000002'), 1::bigint, 'completed owner can read subscriber');
select extensions.is((select count(*) from public.clinics where id = '40000000-0000-0000-0000-000000000002'), 1::bigint, 'completed owner can read clinic');
select extensions.is((select count(*) from public.patients where id = '60000000-0000-0000-0000-000000000002'), 1::bigint, 'completed owner can read patient');
select extensions.is((select count(*) from public.appointments where id = '70000000-0000-0000-0000-000000000002'), 1::bigint, 'completed owner can read appointment');
select extensions.is((select count(*) from public.subscriptions where subscriber_id = '20000000-0000-0000-0000-000000000002'), 1::bigint, 'completed owner can read subscription');
select extensions.is((select count(*) from public.payments where id = '90000000-0000-0000-0000-000000000002'), 1::bigint, 'completed owner can read platform payment');
select extensions.is((select count(*) from public.patient_bills where id = '80000000-0000-0000-0000-000000000002'), 1::bigint, 'completed owner can read patient billing');
select extensions.is((select count(*) from public.audit_events where id = 'b0000000-0000-0000-0000-000000000002'), 1::bigint, 'completed owner can read tenant audit event');
select extensions.is((select count(*) from public.subscribers where id = '20000000-0000-0000-0000-000000000001'), 0::bigint, 'completed owner remains isolated from unrelated subscriber');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select extensions.is(app_private.can_access_clinic('20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002'), false, 'gated staff assignment cannot bypass first-login gate');
select extensions.is((select count(*) from public.clinics where id = '40000000-0000-0000-0000-000000000002'), 0::bigint, 'gated staff cannot read assigned clinic');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select extensions.is(app_private.is_subscriber_member('20000000-0000-0000-0000-000000000001'), true, 'Platform Admin member bypass is preserved');
select extensions.is(app_private.is_subscriber_owner('20000000-0000-0000-0000-000000000001'), true, 'Platform Admin owner bypass is preserved');
select extensions.is(app_private.can_access_clinic('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001'), true, 'Platform Admin clinic bypass is preserved');
select extensions.is((select count(*) from public.subscribers where id = '20000000-0000-0000-0000-000000000001'), 1::bigint, 'Platform Admin tenant read remains available');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', true);
select extensions.is(app_private.is_subscriber_member('20000000-0000-0000-0000-000000000001'), false, 'user without membership is not a subscriber member');
select extensions.is((select count(*) from public.subscribers), 0::bigint, 'user without membership gains no subscriber access');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000006', true);
select extensions.is((public.get_my_first_login_state() ->> 'activeClinicOwnerMembershipCount')::integer, 2, 'login-state RPC counts multiple active owner memberships');
select extensions.is((public.get_my_first_login_state() ->> 'hasMultipleActiveClinicOwnerMemberships')::boolean, true, 'login-state RPC exposes multiple-owner conflict');
select extensions.is(jsonb_array_length(public.get_my_first_login_state() -> 'memberships'), 2, 'login-state RPC does not arbitrarily select one owner membership');

reset role;
select extensions.is(has_function_privilege('anon', 'public.get_my_first_login_state()', 'EXECUTE'), false, 'anon cannot execute login-state RPC');
select extensions.is(has_function_privilege('authenticated', 'public.get_my_first_login_state()', 'EXECUTE'), true, 'authenticated can execute login-state RPC');
select extensions.is(has_function_privilege('anon', 'app_private.is_subscriber_owner(uuid)', 'EXECUTE'), false, 'anon cannot execute owner helper');
select extensions.is(has_function_privilege('authenticated', 'app_private.is_subscriber_owner(uuid)', 'EXECUTE'), true, 'authenticated can execute owner helper for RLS');

select * from extensions.finish();
rollback;
