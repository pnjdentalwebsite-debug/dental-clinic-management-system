$ErrorActionPreference = 'Stop'

$databaseContainer = docker ps --filter 'name=supabase_db_p_j_dental_clinic_management_system' --format '{{.Names}}' | Select-Object -First 1
if (-not $databaseContainer) {
  throw 'Local Supabase database container is not running.'
}

$testUserId = '71000000-0000-0000-0000-000000000001'
$testPlanId = '72000000-0000-0000-0000-000000000001'
$testSubscriberId = '73000000-0000-0000-0000-000000000001'
$testMembershipId = '74000000-0000-0000-0000-000000000001'
$testSubscriptionId = '75000000-0000-0000-0000-000000000001'

function Invoke-LocalSql {
  param([Parameter(Mandatory)][string]$Sql)

  $output = & docker exec -i $databaseContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1 -At -c $Sql 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw ($output -join "`n")
  }
  return ($output -join "`n").Trim()
}

function New-BranchPayload {
  param([Parameter(Mandatory)][string]$Name)

  $hours = 0..6 | ForEach-Object {
    [ordered]@{
      dayOfWeek = $_
      isOpen = ($_ -eq 1)
      openingTime = if ($_ -eq 1) { '09:00' } else { $null }
      closingTime = if ($_ -eq 1) { '18:00' } else { $null }
      breakStart = if ($_ -eq 1) { '12:00' } else { $null }
      breakEnd = if ($_ -eq 1) { '13:00' } else { $null }
    }
  }

  return ([ordered]@{
    saveMode = 'active'
    branchType = 'satellite'
    name = $Name
    legalBusinessName = $Name
    email = ($Name.ToLowerInvariant().Replace(' ', '-') + '@test.invalid')
    contactNumber = '+63 917 000 0099'
    addressLine1 = ($Name + ' Test Address')
    city = 'Test City'
    province = 'Test Province'
    country = 'Philippines'
    timezone = 'Asia/Manila'
    visibility = 'visible'
    businessHours = @($hours)
  } | ConvertTo-Json -Depth 6 -Compress)
}

$setupSql = @"
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '$testUserId', 'authenticated', 'authenticated',
  'concurrent-owner@test.invalid', 'test-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()
);

insert into public.plans (
  id, plan_code, name, status, monthly_amount_centavos, annual_amount_centavos, limits, features
) values (
  '$testPlanId', 'test-concurrent-clinic-3', 'Test Concurrent Clinic 3', 'active', 1, 1,
  '[{"key":"clinics","label":"Clinics","type":"number","value":3}]'::jsonb,
  '[]'::jsonb
);

insert into public.subscribers (
  id, subscriber_number, business_name, email, account_status, activated_at
) values (
  '$testSubscriberId', 'SUB-TEST-CONCURRENT', 'Concurrent Test Dental',
  'concurrent-subscriber@test.invalid', 'active', now()
);

insert into public.subscriber_memberships (
  id, subscriber_id, user_id, role, account_status, activated_at,
  must_change_password, password_changed_at
) values (
  '$testMembershipId', '$testSubscriberId', '$testUserId',
  'clinic_owner', 'active', now(), false, now()
);

insert into public.subscriptions (
  id, subscriber_id, plan_id, status, starts_at, expires_at
) values (
  '$testSubscriptionId', '$testSubscriberId', '$testPlanId',
  'active', now() - interval '1 day', now() + interval '1 month'
);

insert into public.clinics (
  subscriber_id, clinic_number, branch_type, name, email, contact_number,
  address_line_1, city, province, status, is_primary, activated_at
) values
  ('$testSubscriberId', 'CLN-CONCURBASE1', 'main', 'Concurrency Primary',
   'concurrency-primary@test.invalid', '+63 917 000 0091', 'Primary Test Address',
   'Test City', 'Test Province', 'active', true, now()),
  ('$testSubscriberId', 'CLN-CONCURBASE2', 'satellite', 'Concurrency Existing Branch',
   'concurrency-existing@test.invalid', '+63 917 000 0092', 'Existing Test Address',
   'Test City', 'Test Province', 'active', false, now());

create function public.test_hold_concurrent_branch_insert()
returns trigger
language plpgsql
set search_path = ''
as `$function`$
begin
  if new.subscriber_id = '$testSubscriberId'::uuid then
    perform pg_catalog.pg_sleep(4);
  end if;
  return new;
end;
`$function`$;

create trigger test_hold_concurrent_branch_insert
  before insert on public.clinics
  for each row execute function public.test_hold_concurrent_branch_insert();
"@

$cleanupSql = @"
drop trigger if exists test_hold_concurrent_branch_insert on public.clinics;
drop function if exists public.test_hold_concurrent_branch_insert();
delete from public.audit_events where subscriber_id = '$testSubscriberId';
delete from public.clinic_business_hours where subscriber_id = '$testSubscriberId';
delete from public.clinics where subscriber_id = '$testSubscriberId';
delete from public.subscriptions where id = '$testSubscriptionId';
delete from public.subscriber_memberships where id = '$testMembershipId';
delete from public.subscribers where id = '$testSubscriberId';
delete from public.plans where id = '$testPlanId';
delete from auth.users where id = '$testUserId';
"@

try {
  Invoke-LocalSql -Sql $setupSql | Out-Null

  $payloadA = New-BranchPayload -Name 'Concurrent Branch A'
  $payloadB = New-BranchPayload -Name 'Concurrent Branch B'
  $callSqlA = "begin; set local role authenticated; select set_config('request.jwt.claim.sub', '$testUserId', true); select public.create_my_clinic_branch('$payloadA'::jsonb); commit;"
  $callSqlB = "begin; set local role authenticated; select set_config('request.jwt.claim.sub', '$testUserId', true); select public.create_my_clinic_branch('$payloadB'::jsonb); commit;"

  $jobs = @(
    Start-Job -ScriptBlock {
      param($Container, $Sql)
      $jobOutput = & docker exec -i $Container psql -U postgres -d postgres -v ON_ERROR_STOP=1 -At -c $Sql 2>&1
      [pscustomobject]@{ ExitCode = $LASTEXITCODE; Output = ($jobOutput -join "`n") }
    } -ArgumentList $databaseContainer, $callSqlA
    Start-Job -ScriptBlock {
      param($Container, $Sql)
      $jobOutput = & docker exec -i $Container psql -U postgres -d postgres -v ON_ERROR_STOP=1 -At -c $Sql 2>&1
      [pscustomobject]@{ ExitCode = $LASTEXITCODE; Output = ($jobOutput -join "`n") }
    } -ArgumentList $databaseContainer, $callSqlB
  )

  $jobs | Wait-Job | Out-Null
  $results = @($jobs | Receive-Job)
  $jobs | Remove-Job -Force

  $successes = @($results | Where-Object ExitCode -eq 0)
  $quotaFailures = @($results | Where-Object { $_.ExitCode -ne 0 -and $_.Output -match 'CLINIC_QUOTA_REACHED' })
  $finalCount = [int](Invoke-LocalSql -Sql "select count(*) from public.clinics where subscriber_id = '$testSubscriberId' and status in ('draft','pending','active','inactive');")
  $createdCount = [int](Invoke-LocalSql -Sql "select count(*) from public.clinics where subscriber_id = '$testSubscriberId' and name in ('Concurrent Branch A','Concurrent Branch B');")
  $auditCount = [int](Invoke-LocalSql -Sql "select count(*) from public.audit_events where subscriber_id = '$testSubscriberId' and event_type = 'clinic.branch.created';")

  if ($successes.Count -ne 1 -or $quotaFailures.Count -ne 1) {
    throw "Expected one success and one CLINIC_QUOTA_REACHED result. Results: $($results | ConvertTo-Json -Depth 4 -Compress)"
  }
  if ($finalCount -ne 3 -or $createdCount -ne 1 -or $auditCount -ne 1) {
    throw "Unexpected final state: quotaCount=$finalCount createdCount=$createdCount auditCount=$auditCount"
  }

  [pscustomobject]@{
    Result = 'PASS'
    ConcurrentRequests = 2
    SuccessfulCreates = $successes.Count
    QuotaRejected = $quotaFailures.Count
    FinalQuotaConsumingClinicCount = $finalCount
    CreatedRows = $createdCount
    AuditRows = $auditCount
  } | Format-List
}
finally {
  try {
    Invoke-LocalSql -Sql $cleanupSql | Out-Null
  }
  catch {
    Write-Warning "Concurrency fixture cleanup needs attention: $($_.Exception.Message)"
  }
}
