-- Approved Phase 1 development/testing plan catalog.
-- Plans are stable platform configuration keyed by plan_code, not tenant data.
with feature_catalog (display_order, feature_key, label, description) as (
  values
    (1, 'patient_management', 'Patient Management', 'Manage patient records and notes.'),
    (2, 'appointment_management', 'Appointment Management', 'Create and manage appointments.'),
    (3, 'calendar', 'Calendar', 'Clinic calendar visibility.'),
    (4, 'recalls', 'Recalls', 'Recall workflow support.'),
    (5, 'waitlist', 'Waitlist', 'Appointment waitlist management.'),
    (6, 'laboratories', 'Laboratories', 'Laboratory relationship tracking.'),
    (7, 'billing', 'Billing', 'Billing workflows.'),
    (8, 'payments', 'Payments', 'Payment tracking.'),
    (9, 'basic_reports', 'Basic Reports', 'Standard operational reports.'),
    (10, 'advanced_reports', 'Advanced Reports', 'Expanded clinic reporting.'),
    (11, 'analytics', 'Analytics', 'Platform analytics and metrics.'),
    (12, 'online_booking', 'Online Booking', 'Public booking intake.'),
    (13, 'google_calendar', 'Google Calendar', 'Google Calendar integration placeholder.'),
    (14, 'notifications', 'Notifications', 'Notification center access.'),
    (15, 'data_restore', 'Data Restore', 'Restore workflow access.'),
    (16, 'priority_support', 'Priority Support', 'Priority support marker.'),
    (17, 'realtime_updates', 'Realtime Updates', 'Realtime UI capability placeholder.')
),
plan_config (plan_code, name, monthly_amount_centavos, annual_amount_centavos, enabled_features, limits) as (
  values
    (
      'basic', 'Basic', 500000::bigint, 5100000::bigint,
      array['patient_management', 'appointment_management', 'calendar', 'basic_reports']::text[],
      $$[
        {"key":"clinics","label":"Clinics","type":"number","value":1},
        {"key":"laboratories","label":"Laboratories","type":"not_included"},
        {"key":"clinic_owners","label":"Clinic Owners","type":"number","value":1},
        {"key":"associates","label":"Associate Dentists","type":"number","value":1},
        {"key":"staff","label":"Staff","type":"number","value":3},
        {"key":"total_users","label":"Total Users","type":"number","value":5},
        {"key":"storage_mb","label":"Storage MB","type":"number","value":1024},
        {"key":"monthly_appointments","label":"Monthly Appointments","type":"number","value":300},
        {"key":"reports","label":"Reports","type":"number","value":3},
        {"key":"online_bookings","label":"Online Booking","type":"not_included"}
      ]$$::jsonb
    ),
    (
      'plus', 'Plus', 850000::bigint, 8670000::bigint,
      array['patient_management', 'appointment_management', 'calendar', 'recalls', 'waitlist', 'laboratories', 'billing', 'payments', 'basic_reports', 'advanced_reports', 'notifications']::text[],
      $$[
        {"key":"clinics","label":"Clinics","type":"number","value":3},
        {"key":"laboratories","label":"Laboratories","type":"number","value":2},
        {"key":"clinic_owners","label":"Clinic Owners","type":"number","value":2},
        {"key":"associates","label":"Associate Dentists","type":"number","value":6},
        {"key":"staff","label":"Staff","type":"number","value":20},
        {"key":"total_users","label":"Total Users","type":"number","value":28},
        {"key":"storage_mb","label":"Storage MB","type":"number","value":5120},
        {"key":"monthly_appointments","label":"Monthly Appointments","type":"number","value":1500},
        {"key":"reports","label":"Reports","type":"number","value":10},
        {"key":"online_bookings","label":"Online Booking","type":"pending"}
      ]$$::jsonb
    ),
    (
      'max', 'Max', 1000000::bigint, 10200000::bigint,
      array['patient_management', 'appointment_management', 'calendar', 'recalls', 'waitlist', 'laboratories', 'billing', 'payments', 'basic_reports', 'advanced_reports', 'analytics', 'online_booking', 'google_calendar', 'notifications', 'data_restore', 'priority_support', 'realtime_updates']::text[],
      $$[
        {"key":"clinics","label":"Clinics","type":"unlimited"},
        {"key":"laboratories","label":"Laboratories","type":"unlimited"},
        {"key":"clinic_owners","label":"Clinic Owners","type":"unlimited"},
        {"key":"associates","label":"Associate Dentists","type":"unlimited"},
        {"key":"staff","label":"Staff","type":"unlimited"},
        {"key":"total_users","label":"Total Users","type":"unlimited"},
        {"key":"storage_mb","label":"Storage MB","type":"number","value":51200},
        {"key":"monthly_appointments","label":"Monthly Appointments","type":"unlimited"},
        {"key":"reports","label":"Reports","type":"unlimited"},
        {"key":"online_bookings","label":"Online Booking","type":"unlimited"}
      ]$$::jsonb
    )
)
insert into public.plans (
  plan_code, name, status, monthly_amount_centavos, annual_amount_centavos, limits, features
)
select
  config.plan_code,
  config.name,
  'active'::public.account_status,
  config.monthly_amount_centavos,
  config.annual_amount_centavos,
  config.limits,
  (
    select jsonb_agg(
      jsonb_build_object(
        'key', catalog.feature_key,
        'label', catalog.label,
        'description', catalog.description,
        'enabled', catalog.feature_key = any(config.enabled_features),
        'availabilityNote', case when catalog.feature_key = any(config.enabled_features)
          then 'Included in plan.' else 'Not included in this tier.' end
      ) order by catalog.display_order
    )
    from feature_catalog catalog
  )
from plan_config config
on conflict (plan_code) do update
set name = excluded.name,
    status = excluded.status,
    monthly_amount_centavos = excluded.monthly_amount_centavos,
    annual_amount_centavos = excluded.annual_amount_centavos,
    limits = excluded.limits,
    features = excluded.features,
    updated_at = now();
