-- Public sign-up may create a registration, but it must never be able to
-- self-approve, self-verify payment, or set platform-review metadata.
drop policy if exists registrations_submit_public on public.registrations;

create policy registrations_submit_public on public.registrations
  for insert
  to anon, authenticated
  with check (
    payment_status = 'unpaid'
    and registration_status = 'pending_verification'
    and email_verified_at is null
    and reviewed_at is null
    and reviewed_by is null
    and rejection_reason is null
    and provisioned_at is null
  );
