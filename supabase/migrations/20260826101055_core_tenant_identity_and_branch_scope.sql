-- Core multi-tenant foundation for the P&J Dental platform.
-- This migration is intentionally seed-free. Platform administrators are
-- provisioned separately by a trusted database operator after Auth setup.

create extension if not exists pgcrypto;

create schema if not exists app_private;
revoke all on schema app_private from public;

create type public.app_role as enum ('platform_admin', 'clinic_owner', 'associate', 'staff');
create type public.account_status as enum ('pending', 'active', 'suspended', 'deactivated');
create type public.clinic_status as enum ('draft', 'pending', 'active', 'inactive', 'archived');
create type public.assignment_status as enum ('active', 'inactive', 'removed');
create type public.subscription_status as enum ('pending', 'active', 'expiring_soon', 'expired', 'suspended', 'cancelled');
create type public.payment_status as enum ('unpaid', 'pending_verification', 'approved', 'rejected', 'refunded', 'voided');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  middle_name text,
  last_name text,
  mobile_number text,
  address text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_email_lower_unique on public.profiles (lower(email));

create table public.platform_admins (
  user_id uuid primary key references public.profiles(id) on delete restrict,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles(id) on delete set null
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  plan_code text not null unique,
  name text not null,
  status public.account_status not null default 'active',
  monthly_amount_centavos bigint not null default 0 check (monthly_amount_centavos >= 0),
  annual_amount_centavos bigint check (annual_amount_centavos >= 0),
  limits jsonb not null default '{}'::jsonb,
  features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  registration_number text not null unique,
  plan_id uuid references public.plans(id) on delete restrict,
  clinic_name text not null,
  clinic_email text not null,
  clinic_mobile text,
  clinic_address text,
  owner_name text not null,
  owner_email text not null,
  owner_mobile text,
  owner_address text,
  payment_status public.payment_status not null default 'unpaid',
  registration_status text not null default 'pending_verification' check (registration_status in ('pending_verification', 'pending_payment', 'pending_review', 'approved', 'rejected', 'cancelled')),
  email_verified_at timestamptz,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  rejection_reason text,
  provisioned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index registrations_owner_email_open_unique on public.registrations (lower(owner_email))
  where registration_status not in ('rejected', 'cancelled');

create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  subscriber_number text not null unique,
  registration_id uuid unique references public.registrations(id) on delete restrict,
  business_name text not null,
  email text not null,
  mobile_number text,
  account_status public.account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz,
  deactivated_at timestamptz
);
create unique index subscribers_email_lower_unique on public.subscribers (lower(email));

create table public.subscriber_memberships (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.subscribers(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  role public.app_role not null check (role <> 'platform_admin'),
  account_status public.account_status not null default 'pending',
  permissions jsonb not null default '{}'::jsonb,
  invited_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscriber_id, user_id),
  unique (id, subscriber_id)
);
create unique index subscriber_one_owner_unique on public.subscriber_memberships (subscriber_id)
  where role = 'clinic_owner' and account_status = 'active';

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.subscribers(id) on delete restrict,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status public.subscription_status not null default 'pending',
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index subscriber_one_current_subscription on public.subscriptions (subscriber_id)
  where status in ('pending', 'active', 'expiring_soon', 'suspended');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references public.registrations(id) on delete restrict,
  subscriber_id uuid references public.subscribers(id) on delete restrict,
  payment_method text not null,
  reference_number text,
  amount_centavos bigint not null check (amount_centavos >= 0),
  status public.payment_status not null default 'pending_verification',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (registration_id is not null or subscriber_id is not null)
);
create unique index payments_reference_unique on public.payments (lower(payment_method), lower(reference_number))
  where reference_number is not null and btrim(reference_number) <> '';

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.subscribers(id) on delete restrict,
  clinic_number text not null unique,
  branch_type text not null default 'main' check (branch_type in ('main', 'satellite')),
  name text not null,
  legal_business_name text,
  email text,
  contact_number text,
  alternative_contact_number text,
  address_line_1 text not null,
  address_line_2 text,
  barangay text,
  city text not null,
  province text not null,
  postal_code text,
  country text not null default 'Philippines',
  timezone text not null default 'Asia/Manila',
  description text,
  logo_path text,
  status public.clinic_status not null default 'draft',
  visibility text not null default 'visible' check (visibility in ('visible', 'hidden')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz,
  deactivated_at timestamptz,
  archived_at timestamptz,
  unique (id, subscriber_id),
  unique nulls not distinct (subscriber_id, name)
);
create unique index clinics_one_primary_active on public.clinics (subscriber_id)
  where is_primary and status <> 'archived';

create table public.clinic_business_hours (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null,
  clinic_id uuid not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_open boolean not null default false,
  opening_time time,
  closing_time time,
  break_start time,
  break_end time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_id, subscriber_id) references public.clinics(id, subscriber_id) on delete restrict,
  unique (clinic_id, day_of_week),
  check ((not is_open) or (opening_time is not null and closing_time is not null and opening_time < closing_time))
);

create table public.staff_profiles (
  membership_id uuid primary key,
  subscriber_id uuid not null,
  staff_number text not null unique,
  position text not null,
  phone_number text,
  device_restriction_enabled boolean not null default false,
  work_schedule jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (membership_id, subscriber_id) references public.subscriber_memberships(id, subscriber_id) on delete restrict
);

create table public.associate_dentist_profiles (
  membership_id uuid primary key,
  subscriber_id uuid not null,
  associate_number text not null unique,
  license_number text not null,
  ptr_number text not null,
  s2_license_number text not null,
  designation text not null,
  specialization text not null,
  calendar_color text not null default '#2563eb',
  certificates_and_qualifications text,
  alternate_associate_ids text[] not null default '{}',
  device_restriction_enabled boolean not null default false,
  work_schedule jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (membership_id, subscriber_id) references public.subscriber_memberships(id, subscriber_id) on delete restrict,
  check (calendar_color ~ '^#[0-9A-Fa-f]{6}$')
);

create table public.clinic_assignments (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null,
  clinic_id uuid not null,
  membership_id uuid not null,
  assignment_role public.app_role not null check (assignment_role in ('clinic_owner', 'associate', 'staff')),
  status public.assignment_status not null default 'active',
  assigned_at timestamptz not null default now(),
  removed_at timestamptz,
  assigned_by uuid references public.profiles(id) on delete set null,
  note text,
  foreign key (clinic_id, subscriber_id) references public.clinics(id, subscriber_id) on delete restrict,
  foreign key (membership_id, subscriber_id) references public.subscriber_memberships(id, subscriber_id) on delete restrict,
  unique (clinic_id, membership_id, assignment_role)
);

create table public.laboratories (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.subscribers(id) on delete restrict,
  laboratory_number text not null unique,
  name text not null,
  legal_business_name text,
  email text,
  contact_number text,
  alternative_contact text,
  contact_person text,
  contact_person_position text,
  address_line_1 text,
  address_line_2 text,
  barangay text,
  city text,
  province text,
  postal_code text,
  country text not null default 'Philippines',
  timezone text not null default 'Asia/Manila',
  logo_path text,
  description text,
  status public.account_status not null default 'active',
  visibility text not null default 'visible' check (visibility in ('visible', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscriber_id, name)
);

create table public.clinic_laboratory_connections (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null,
  clinic_id uuid not null,
  laboratory_id uuid not null,
  status public.assignment_status not null default 'active',
  is_preferred boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_id, subscriber_id) references public.clinics(id, subscriber_id) on delete restrict,
  foreign key (laboratory_id) references public.laboratories(id) on delete restrict,
  unique (clinic_id, laboratory_id)
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null,
  clinic_id uuid not null,
  patient_number text not null,
  first_name text not null,
  middle_name text,
  last_name text not null,
  extension_name text,
  nickname text,
  birth_date date not null,
  sex text not null check (sex in ('Male', 'Female', 'Other', 'Undisclosed')),
  mobile_number text,
  email text,
  address text,
  city text,
  photo_path text,
  status public.account_status not null default 'active',
  clinical_profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  foreign key (clinic_id, subscriber_id) references public.clinics(id, subscriber_id) on delete restrict,
  unique (clinic_id, patient_number),
  unique (id, subscriber_id, clinic_id)
);

create table public.clinic_tags (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null,
  clinic_id uuid not null,
  tag_code text not null,
  name text not null,
  color text not null default '#0ea5e9',
  description text,
  priority text not null default 'standard',
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_id, subscriber_id) references public.clinics(id, subscriber_id) on delete restrict,
  unique (clinic_id, tag_code),
  unique (clinic_id, name),
  unique (id, subscriber_id, clinic_id)
);

create table public.patient_tag_assignments (
  patient_id uuid not null,
  subscriber_id uuid not null,
  clinic_id uuid not null,
  tag_id uuid not null,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles(id) on delete set null,
  primary key (patient_id, tag_id),
  foreign key (patient_id, subscriber_id, clinic_id) references public.patients(id, subscriber_id, clinic_id) on delete restrict,
  foreign key (tag_id, subscriber_id, clinic_id) references public.clinic_tags(id, subscriber_id, clinic_id) on delete restrict
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null,
  clinic_id uuid not null,
  patient_id uuid,
  assigned_membership_id uuid references public.subscriber_memberships(id) on delete set null,
  appointment_type text not null default 'appointment',
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_id, subscriber_id) references public.clinics(id, subscriber_id) on delete restrict,
  foreign key (patient_id, subscriber_id, clinic_id) references public.patients(id, subscriber_id, clinic_id) on delete restrict
);

create table public.dental_recalls (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null,
  clinic_id uuid not null,
  patient_id uuid not null,
  recall_date date not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'overdue')),
  reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_id, subscriber_id) references public.clinics(id, subscriber_id) on delete restrict,
  foreign key (patient_id, subscriber_id, clinic_id) references public.patients(id, subscriber_id, clinic_id) on delete restrict
);

create table public.progress_notes (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null,
  clinic_id uuid not null,
  patient_id uuid not null,
  author_membership_id uuid references public.subscriber_memberships(id) on delete set null,
  visit_at timestamptz not null,
  treatment_summary text,
  clinical_remarks text,
  net_treatment_cost_centavos bigint not null default 0 check (net_treatment_cost_centavos >= 0),
  status text not null default 'draft' check (status in ('draft', 'finalized', 'voided')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_id, subscriber_id) references public.clinics(id, subscriber_id) on delete restrict,
  foreign key (patient_id, subscriber_id, clinic_id) references public.patients(id, subscriber_id, clinic_id) on delete restrict,
  unique (id, subscriber_id, clinic_id)
);

create table public.patient_bills (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null,
  clinic_id uuid not null,
  patient_id uuid not null,
  progress_note_id uuid,
  invoice_number text not null,
  billed_at timestamptz not null default now(),
  total_centavos bigint not null default 0 check (total_centavos >= 0),
  discount_centavos bigint not null default 0 check (discount_centavos >= 0),
  paid_centavos bigint not null default 0 check (paid_centavos >= 0),
  status text not null default 'open' check (status in ('draft', 'open', 'partial', 'paid', 'voided')),
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_id, subscriber_id) references public.clinics(id, subscriber_id) on delete restrict,
  foreign key (patient_id, subscriber_id, clinic_id) references public.patients(id, subscriber_id, clinic_id) on delete restrict,
  foreign key (progress_note_id, subscriber_id, clinic_id) references public.progress_notes(id, subscriber_id, clinic_id) on delete set null,
  unique (clinic_id, invoice_number),
  unique (id, subscriber_id, clinic_id),
  check (discount_centavos <= total_centavos),
  check (paid_centavos <= total_centavos - discount_centavos)
);

create table public.patient_bill_lines (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null,
  subscriber_id uuid not null,
  clinic_id uuid not null,
  description text not null,
  quantity numeric(10, 2) not null default 1 check (quantity > 0),
  unit_amount_centavos bigint not null check (unit_amount_centavos >= 0),
  discount_centavos bigint not null default 0 check (discount_centavos >= 0),
  created_at timestamptz not null default now(),
  foreign key (bill_id, subscriber_id, clinic_id) references public.patient_bills(id, subscriber_id, clinic_id) on delete restrict
);

create table public.patient_payments (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null,
  subscriber_id uuid not null,
  clinic_id uuid not null,
  patient_id uuid not null,
  payment_method text not null,
  reference_number text,
  amount_centavos bigint not null check (amount_centavos > 0),
  paid_at timestamptz not null default now(),
  received_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (clinic_id, subscriber_id) references public.clinics(id, subscriber_id) on delete restrict,
  foreign key (patient_id, subscriber_id, clinic_id) references public.patients(id, subscriber_id, clinic_id) on delete restrict,
  foreign key (bill_id, subscriber_id, clinic_id) references public.patient_bills(id, subscriber_id, clinic_id) on delete restrict
);

create table public.patient_uploads (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null,
  clinic_id uuid not null,
  patient_id uuid not null,
  storage_bucket text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes >= 0),
  checksum text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'archived')),
  foreign key (clinic_id, subscriber_id) references public.clinics(id, subscriber_id) on delete restrict,
  foreign key (patient_id, subscriber_id, clinic_id) references public.patients(id, subscriber_id, clinic_id) on delete restrict,
  unique (storage_bucket, storage_path)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles(id) on delete restrict,
  subscriber_id uuid references public.subscribers(id) on delete restrict,
  clinic_id uuid references public.clinics(id) on delete restrict,
  title text not null,
  body text not null,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  route text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  subscriber_id uuid references public.subscribers(id) on delete restrict,
  clinic_id uuid references public.clinics(id) on delete restrict,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index subscriber_memberships_user_scope_idx on public.subscriber_memberships (user_id, subscriber_id) where account_status = 'active';
create index clinic_assignments_user_scope_idx on public.clinic_assignments (membership_id, subscriber_id, clinic_id) where status = 'active';
create index patients_scope_idx on public.patients (subscriber_id, clinic_id, status);
create index appointments_scope_starts_idx on public.appointments (subscriber_id, clinic_id, starts_at);
create index dental_recalls_scope_date_idx on public.dental_recalls (subscriber_id, clinic_id, recall_date);
create index progress_notes_scope_visit_idx on public.progress_notes (subscriber_id, clinic_id, visit_at);
create index patient_bills_scope_status_idx on public.patient_bills (subscriber_id, clinic_id, status);
create index notifications_recipient_unread_idx on public.notifications (recipient_user_id, read_at, created_at desc);
create index audit_events_scope_created_idx on public.audit_events (subscriber_id, clinic_id, created_at desc);

create function app_private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', '')
  )
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure app_private.handle_new_auth_user();

create function app_private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_admins admin
    where admin.user_id = (select auth.uid())
  );
$$;

create function app_private.is_subscriber_member(target_subscriber_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.is_platform_admin() or exists (
    select 1 from public.subscriber_memberships membership
    where membership.subscriber_id = target_subscriber_id
      and membership.user_id = (select auth.uid())
      and membership.account_status = 'active'
  );
$$;

create function app_private.is_subscriber_owner(target_subscriber_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.is_platform_admin() or exists (
    select 1 from public.subscriber_memberships membership
    where membership.subscriber_id = target_subscriber_id
      and membership.user_id = (select auth.uid())
      and membership.role = 'clinic_owner'
      and membership.account_status = 'active'
  );
$$;

create function app_private.can_access_clinic(target_subscriber_id uuid, target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.is_subscriber_owner(target_subscriber_id) or exists (
    select 1
    from public.clinic_assignments assignment
    join public.subscriber_memberships membership on membership.id = assignment.membership_id
    where assignment.subscriber_id = target_subscriber_id
      and assignment.clinic_id = target_clinic_id
      and assignment.status = 'active'
      and membership.user_id = (select auth.uid())
      and membership.account_status = 'active'
  );
$$;

revoke all on function app_private.is_platform_admin() from public;
revoke all on function app_private.is_subscriber_member(uuid) from public;
revoke all on function app_private.is_subscriber_owner(uuid) from public;
revoke all on function app_private.can_access_clinic(uuid, uuid) from public;
grant usage on schema app_private to authenticated;
grant execute on function app_private.is_platform_admin() to authenticated;
grant execute on function app_private.is_subscriber_member(uuid) to authenticated;
grant execute on function app_private.is_subscriber_owner(uuid) to authenticated;
grant execute on function app_private.can_access_clinic(uuid, uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.plans enable row level security;
alter table public.registrations enable row level security;
alter table public.subscribers enable row level security;
alter table public.subscriber_memberships enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.clinics enable row level security;
alter table public.clinic_business_hours enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.associate_dentist_profiles enable row level security;
alter table public.clinic_assignments enable row level security;
alter table public.laboratories enable row level security;
alter table public.clinic_laboratory_connections enable row level security;
alter table public.patients enable row level security;
alter table public.clinic_tags enable row level security;
alter table public.patient_tag_assignments enable row level security;
alter table public.appointments enable row level security;
alter table public.dental_recalls enable row level security;
alter table public.progress_notes enable row level security;
alter table public.patient_bills enable row level security;
alter table public.patient_bill_lines enable row level security;
alter table public.patient_payments enable row level security;
alter table public.patient_uploads enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_read_self_or_tenant on public.profiles for select to authenticated
  using (id = (select auth.uid()) or exists (
    select 1 from public.subscriber_memberships membership
    where membership.user_id = profiles.id and app_private.is_subscriber_member(membership.subscriber_id)
  ));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy platform_admins_read_admin on public.platform_admins for select to authenticated using (app_private.is_platform_admin());
create policy plans_read_authenticated on public.plans for select to authenticated using (true);
create policy plans_manage_platform on public.plans for all to authenticated using (app_private.is_platform_admin()) with check (app_private.is_platform_admin());
create policy registrations_submit_public on public.registrations for insert to anon, authenticated with check (true);
create policy registrations_manage_platform on public.registrations for all to authenticated using (app_private.is_platform_admin()) with check (app_private.is_platform_admin());
create policy subscribers_read_member on public.subscribers for select to authenticated using (app_private.is_subscriber_member(id));
create policy subscribers_manage_owner on public.subscribers for update to authenticated using (app_private.is_subscriber_owner(id)) with check (app_private.is_subscriber_owner(id));
create policy subscribers_manage_platform on public.subscribers for all to authenticated using (app_private.is_platform_admin()) with check (app_private.is_platform_admin());
create policy memberships_read_member on public.subscriber_memberships for select to authenticated using (app_private.is_subscriber_member(subscriber_id));
create policy memberships_manage_owner on public.subscriber_memberships for all to authenticated using (app_private.is_subscriber_owner(subscriber_id)) with check (app_private.is_subscriber_owner(subscriber_id));
create policy subscriptions_read_member on public.subscriptions for select to authenticated using (app_private.is_subscriber_member(subscriber_id));
create policy subscriptions_manage_platform on public.subscriptions for all to authenticated using (app_private.is_platform_admin()) with check (app_private.is_platform_admin());
create policy payments_read_owner_or_platform on public.payments for select to authenticated using (app_private.is_platform_admin() or (subscriber_id is not null and app_private.is_subscriber_owner(subscriber_id)));
create policy payments_manage_platform on public.payments for all to authenticated using (app_private.is_platform_admin()) with check (app_private.is_platform_admin());

create policy clinics_read_assigned on public.clinics for select to authenticated using (app_private.can_access_clinic(subscriber_id, id));
create policy clinics_manage_owner on public.clinics for all to authenticated using (app_private.is_subscriber_owner(subscriber_id)) with check (app_private.is_subscriber_owner(subscriber_id));

create policy clinic_business_hours_read_assigned on public.clinic_business_hours for select to authenticated using (app_private.can_access_clinic(subscriber_id, clinic_id));
create policy clinic_business_hours_manage_owner on public.clinic_business_hours for all to authenticated using (app_private.is_subscriber_owner(subscriber_id)) with check (app_private.is_subscriber_owner(subscriber_id));
create policy staff_profiles_read_member on public.staff_profiles for select to authenticated using (app_private.is_subscriber_member(subscriber_id));
create policy staff_profiles_manage_owner on public.staff_profiles for all to authenticated using (app_private.is_subscriber_owner(subscriber_id)) with check (app_private.is_subscriber_owner(subscriber_id));
create policy associates_read_member on public.associate_dentist_profiles for select to authenticated using (app_private.is_subscriber_member(subscriber_id));
create policy associates_manage_owner on public.associate_dentist_profiles for all to authenticated using (app_private.is_subscriber_owner(subscriber_id)) with check (app_private.is_subscriber_owner(subscriber_id));
create policy assignments_read_assigned on public.clinic_assignments for select to authenticated using (app_private.can_access_clinic(subscriber_id, clinic_id));
create policy assignments_manage_owner on public.clinic_assignments for all to authenticated using (app_private.is_subscriber_owner(subscriber_id)) with check (app_private.is_subscriber_owner(subscriber_id));
create policy laboratories_read_member on public.laboratories for select to authenticated using (app_private.is_subscriber_member(subscriber_id));
create policy laboratories_manage_owner on public.laboratories for all to authenticated using (app_private.is_subscriber_owner(subscriber_id)) with check (app_private.is_subscriber_owner(subscriber_id));
create policy clinic_labs_read_assigned on public.clinic_laboratory_connections for select to authenticated using (app_private.can_access_clinic(subscriber_id, clinic_id));
create policy clinic_labs_manage_owner on public.clinic_laboratory_connections for all to authenticated using (app_private.is_subscriber_owner(subscriber_id)) with check (app_private.is_subscriber_owner(subscriber_id));

create policy patients_read_assigned on public.patients for select to authenticated using (app_private.can_access_clinic(subscriber_id, clinic_id));
create policy patients_manage_owner on public.patients for all to authenticated using (app_private.is_subscriber_owner(subscriber_id)) with check (app_private.is_subscriber_owner(subscriber_id));
create policy clinic_tags_read_assigned on public.clinic_tags for select to authenticated using (app_private.can_access_clinic(subscriber_id, clinic_id));
create policy clinic_tags_manage_owner on public.clinic_tags for all to authenticated using (app_private.is_subscriber_owner(subscriber_id)) with check (app_private.is_subscriber_owner(subscriber_id));
create policy patient_tags_read_assigned on public.patient_tag_assignments for select to authenticated using (app_private.can_access_clinic(subscriber_id, clinic_id));
create policy patient_tags_manage_owner on public.patient_tag_assignments for all to authenticated using (app_private.is_subscriber_owner(subscriber_id)) with check (app_private.is_subscriber_owner(subscriber_id));
create policy appointments_read_assigned on public.appointments for select to authenticated using (app_private.can_access_clinic(subscriber_id, clinic_id));
create policy appointments_manage_owner on public.appointments for all to authenticated using (app_private.is_subscriber_owner(subscriber_id)) with check (app_private.is_subscriber_owner(subscriber_id));
create policy recalls_read_assigned on public.dental_recalls for select to authenticated using (app_private.can_access_clinic(subscriber_id, clinic_id));
create policy recalls_manage_owner on public.dental_recalls for all to authenticated using (app_private.is_subscriber_owner(subscriber_id)) with check (app_private.is_subscriber_owner(subscriber_id));
create policy progress_notes_read_assigned on public.progress_notes for select to authenticated using (app_private.can_access_clinic(subscriber_id, clinic_id));
create policy progress_notes_manage_owner on public.progress_notes for all to authenticated using (app_private.is_subscriber_owner(subscriber_id)) with check (app_private.is_subscriber_owner(subscriber_id));
create policy bills_read_assigned on public.patient_bills for select to authenticated using (app_private.can_access_clinic(subscriber_id, clinic_id));
create policy bills_manage_owner on public.patient_bills for all to authenticated using (app_private.is_subscriber_owner(subscriber_id)) with check (app_private.is_subscriber_owner(subscriber_id));
create policy bill_lines_read_owner on public.patient_bill_lines for select to authenticated using (exists (select 1 from public.patient_bills bill where bill.id = patient_bill_lines.bill_id and app_private.can_access_clinic(bill.subscriber_id, bill.clinic_id)));
create policy bill_lines_manage_owner on public.patient_bill_lines for all to authenticated using (exists (select 1 from public.patient_bills bill where bill.id = patient_bill_lines.bill_id and app_private.is_subscriber_owner(bill.subscriber_id))) with check (exists (select 1 from public.patient_bills bill where bill.id = patient_bill_lines.bill_id and app_private.is_subscriber_owner(bill.subscriber_id)));
create policy patient_payments_read_assigned on public.patient_payments for select to authenticated using (app_private.can_access_clinic(subscriber_id, clinic_id));
create policy patient_payments_manage_owner on public.patient_payments for all to authenticated using (app_private.is_subscriber_owner(subscriber_id)) with check (app_private.is_subscriber_owner(subscriber_id));
create policy uploads_read_assigned on public.patient_uploads for select to authenticated using (app_private.can_access_clinic(subscriber_id, clinic_id));
create policy uploads_manage_owner on public.patient_uploads for all to authenticated using (app_private.is_subscriber_owner(subscriber_id)) with check (app_private.is_subscriber_owner(subscriber_id));
create policy notifications_read_self on public.notifications for select to authenticated using (recipient_user_id = (select auth.uid()));
create policy notifications_update_self on public.notifications for update to authenticated using (recipient_user_id = (select auth.uid())) with check (recipient_user_id = (select auth.uid()));
create policy audit_events_read_platform_or_owner on public.audit_events for select to authenticated using (app_private.is_platform_admin() or (subscriber_id is not null and app_private.is_subscriber_owner(subscriber_id)));

create function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure app_private.set_updated_at();
create trigger registrations_set_updated_at before update on public.registrations for each row execute procedure app_private.set_updated_at();
create trigger subscribers_set_updated_at before update on public.subscribers for each row execute procedure app_private.set_updated_at();
create trigger memberships_set_updated_at before update on public.subscriber_memberships for each row execute procedure app_private.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions for each row execute procedure app_private.set_updated_at();
create trigger payments_set_updated_at before update on public.payments for each row execute procedure app_private.set_updated_at();
create trigger clinics_set_updated_at before update on public.clinics for each row execute procedure app_private.set_updated_at();
create trigger patients_set_updated_at before update on public.patients for each row execute procedure app_private.set_updated_at();
