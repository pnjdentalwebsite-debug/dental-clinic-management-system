$ErrorActionPreference = 'Stop'

# Local-only race test. It deliberately holds the subscriber row lock after the
# first completion, then proves the second completion observes the committed
# quota-consuming membership and fails closed. Every fixture uses this exact
# ASCRACE prefix and is removed in the finally block.
$databaseContainer = docker ps --format '{{.Names}}' |
  Where-Object { $_ -like 'supabase_db_*' } |
  Select-Object -First 1
if (-not $databaseContainer) {
  throw 'A local Supabase database container is required for the concurrency test.'
}

function Invoke-LocalPsql {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Sql
  )

  $output = $Sql | docker exec -i $databaseContainer psql -v ON_ERROR_STOP=1 -At -U postgres -d postgres 2>&1
  return [pscustomobject]@{
    ExitCode = $LASTEXITCODE
    Output = ($output | Out-String).Trim()
  }
}

$subscriberId = '73000000-0000-4000-8000-000000000001'
$planId = '72000000-0000-4000-8000-000000000001'
$subscriptionId = '74000000-0000-4000-8000-000000000001'
$clinicId = '75000000-0000-4000-8000-000000000001'
$ownerId = '71000000-0000-4000-8000-000000000001'
$firstUserId = '71000000-0000-4000-8000-000000000011'
$secondUserId = '71000000-0000-4000-8000-000000000012'

$payloadOne = @"
jsonb_build_object(
  'email', 'ascrace-one@test.invalid', 'firstName', 'Race', 'lastName', 'One',
  'licenseNumber', 'RACE-LIC-ONE', 'ptrNumber', 'RACE-PTR-ONE', 's2LicenseNumber', 'RACE-S2-ONE',
  'designation', 'Associate Dentist', 'specialization', 'General Dentistry',
  'clinicIds', jsonb_build_array('$clinicId')
)
"@
$payloadTwo = @"
jsonb_build_object(
  'email', 'ascrace-two@test.invalid', 'firstName', 'Race', 'lastName', 'Two',
  'licenseNumber', 'RACE-LIC-TWO', 'ptrNumber', 'RACE-PTR-TWO', 's2LicenseNumber', 'RACE-S2-TWO',
  'designation', 'Associate Dentist', 'specialization', 'General Dentistry',
  'clinicIds', jsonb_build_array('$clinicId')
)
"@

$setupSql = @"
insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('$ownerId', 'authenticated', 'authenticated', 'ascrace-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('$firstUserId', 'authenticated', 'authenticated', 'ascrace-one@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('$secondUserId', 'authenticated', 'authenticated', 'ascrace-two@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now());
insert into public.profiles (id, email, first_name, last_name) values
  ('$ownerId', 'ascrace-owner@test.invalid', 'Race', 'Owner'),
  ('$firstUserId', 'ascrace-one@test.invalid', 'Race', 'One'),
  ('$secondUserId', 'ascrace-two@test.invalid', 'Race', 'Two')
on conflict (id) do update set email = excluded.email, first_name = excluded.first_name, last_name = excluded.last_name;
insert into public.plans (id, plan_code, name, status, limits, features)
values ('$planId', 'ascrace-one', 'ASCRACE One', 'active', '[{"key":"associates","label":"Associate Dentists","type":"number","value":1}]'::jsonb, '[]'::jsonb);
insert into public.subscribers (id, subscriber_number, business_name, email, account_status, activated_at)
values ('$subscriberId', 'SUB-ASCRACE', 'ASCRACE Subscriber', 'ascrace-subscriber@test.invalid', 'active', now());
insert into public.subscriptions (id, subscriber_id, plan_id, status, starts_at, expires_at)
values ('$subscriptionId', '$subscriberId', '$planId', 'active', now() - interval '1 day', now() + interval '1 day');
insert into public.clinics (id, subscriber_id, clinic_number, branch_type, name, email, contact_number, address_line_1, city, province, status, is_primary, activated_at)
values ('$clinicId', '$subscriberId', 'CLN-ASCRACE', 'main', 'ASCRACE Clinic', 'ascrace-clinic@test.invalid', '+63 917 000 0000', 'ASCRACE Address', 'Test City', 'Test Province', 'active', true, now());
insert into public.subscriber_memberships (subscriber_id, user_id, role, account_status, activated_at, must_change_password, password_changed_at)
values ('$subscriberId', '$ownerId', 'clinic_owner', 'active', now(), false, now());
set role service_role;
select public.begin_associate_provisioning('$ownerId', $payloadOne);
select public.begin_associate_provisioning('$ownerId', $payloadTwo);
select public.record_associate_provisioning_auth_identity(id, '$ownerId', case email_normalized when 'ascrace-one@test.invalid' then '$firstUserId'::uuid else '$secondUserId'::uuid end)
from public.associate_provisioning_attempts
where subscriber_id = '$subscriberId';
"@

$firstSql = @"
begin;
set role service_role;
select public.complete_associate_provisioning(id, '$ownerId', '$firstUserId')
from public.associate_provisioning_attempts
where subscriber_id = '$subscriberId' and email_normalized = 'ascrace-one@test.invalid';
select pg_sleep(2);
commit;
"@

$secondSql = @"
set role service_role;
select public.complete_associate_provisioning(id, '$ownerId', '$secondUserId')
from public.associate_provisioning_attempts
where subscriber_id = '$subscriberId' and email_normalized = 'ascrace-two@test.invalid';
"@

$cleanupSql = @"
delete from public.audit_events where subscriber_id = '$subscriberId';
delete from public.associate_provisioning_attempts where subscriber_id = '$subscriberId';
delete from public.clinic_assignments where subscriber_id = '$subscriberId';
delete from public.associate_dentist_profiles where subscriber_id = '$subscriberId';
delete from public.subscriber_memberships where subscriber_id = '$subscriberId';
delete from public.clinics where subscriber_id = '$subscriberId';
delete from public.subscriptions where subscriber_id = '$subscriberId';
delete from public.subscribers where id = '$subscriberId';
delete from public.plans where id = '$planId';
delete from auth.users where id in ('$ownerId', '$firstUserId', '$secondUserId');
"@

try {
  $setup = Invoke-LocalPsql -Sql $setupSql
  if ($setup.ExitCode -ne 0) { throw "Local concurrency fixture setup failed: $($setup.Output)" }

  $first = Start-Job -ScriptBlock {
    param($Container, $Sql)
    $output = $Sql | docker exec -i $Container psql -v ON_ERROR_STOP=1 -At -U postgres -d postgres 2>&1
    [pscustomobject]@{ ExitCode = $LASTEXITCODE; Output = ($output | Out-String).Trim() }
  } -ArgumentList $databaseContainer, $firstSql
  Start-Sleep -Milliseconds 250
  $second = Start-Job -ScriptBlock {
    param($Container, $Sql)
    $output = $Sql | docker exec -i $Container psql -v ON_ERROR_STOP=1 -At -U postgres -d postgres 2>&1
    [pscustomobject]@{ ExitCode = $LASTEXITCODE; Output = ($output | Out-String).Trim() }
  } -ArgumentList $databaseContainer, $secondSql

  Wait-Job $first, $second | Out-Null
  $firstResult = Receive-Job $first
  $secondResult = Receive-Job $second
  Remove-Job $first, $second
  if ($firstResult.ExitCode -ne 0) { throw "First final-slot completion failed: $($firstResult.Output)" }
  if ($secondResult.ExitCode -eq 0 -or $secondResult.Output -notmatch 'ASSOCIATE_QUOTA_REACHED') {
    throw "Concurrent second final-slot completion did not fail closed: $($secondResult.Output)"
  }

  $count = Invoke-LocalPsql -Sql "select count(*) from public.subscriber_memberships where subscriber_id = '$subscriberId' and role = 'associate' and account_status = 'active';"
  if ($count.ExitCode -ne 0 -or $count.Output -ne '1') {
    throw "Race test expected exactly one active Associate, received: $($count.Output)"
  }
  Write-Output 'PASS: concurrent final-slot Associate provisioning produced exactly one active Associate; the second completion returned ASSOCIATE_QUOTA_REACHED.'
} finally {
  $cleanup = Invoke-LocalPsql -Sql $cleanupSql
  if ($cleanup.ExitCode -ne 0) { throw "Local concurrency fixture cleanup failed: $($cleanup.Output)" }
}
