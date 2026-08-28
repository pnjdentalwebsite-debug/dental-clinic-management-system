# Supabase Phase 1 Foundation - August 26, 2026

## Status

Phase 1 is complete as a repository and architecture preparation phase. No
Supabase project, credentials, database migration, production data import, or
live authentication wiring has been created in this phase.

The source application is a Vite frontend whose current records are stored in
browser localStorage. Those records are useful as UI contracts, but they are
not authoritative production data and must not be bulk-imported into a live
healthcare database without an explicit data-cleaning decision.

## Immutable Scope Boundaries

- Platform administrator is a global role and is not a subscriber tenant.
- A subscriber is the tenant boundary for a registered clinic owner.
- A clinic is the branch boundary inside a subscriber tenant.
- A staff member or associate dentist can access only assignments created for
  their subscriber and clinic branches.
- Every patient, appointment, clinical note, recall, bill, upload, and report
  row must contain both `subscriber_id` and `clinic_id`.
- Browser checks are retained only as UX hints after migration. Database RLS is
  the production authorization boundary.

## Auth and Identity Design

`auth.users` is the identity source. Application roles, tenant membership, and
clinic assignments must live in application tables, never in editable browser
state or `raw_user_meta_data`.

Proposed tables:

| Table | Purpose | Key constraints |
| --- | --- | --- |
| `profiles` | Human profile tied 1:1 to `auth.users` | `id` is `auth.users.id`; unique normalized email is handled by Auth |
| `platform_admins` | Explicit platform-admin allow-list | `user_id` unique |
| `subscribers` | Clinic-owner organization/tenant | unique `subscriber_number`; one approved registration link |
| `subscriber_memberships` | Owner, staff, and associate membership | unique `(subscriber_id, user_id)` |
| `clinic_assignments` | Branch designation for personnel | unique `(clinic_id, user_id, assignment_role)` |
| `staff_profiles` | Staff operational data and schedule | unique `user_id`; belongs to subscriber |
| `associate_dentist_profiles` | License, PTR, S2, specialization, calendar data | unique `user_id`; belongs to subscriber |

The current temporary-password flow must become a server-side invitation or
password-recovery flow. A plaintext password or temporary password must never
be written to the browser, app database, audit log, backup, or client bundle.

## Domain Table Map

| Current local domain | Future authoritative tables | Required scope |
| --- | --- | --- |
| Registration and approval | `registrations`, `registration_status_history` | registration link; later subscriber link |
| Plans and limits | `plans`, `plan_features`, `plan_limits` | global/admin managed |
| Subscribers and subscriptions | `subscribers`, `subscriptions`, `subscription_history` | `subscriber_id` |
| Platform/owner/staff/associate users | `profiles`, `subscriber_memberships`, `staff_profiles`, `associate_dentist_profiles` | `user_id`, `subscriber_id` |
| Clinics and hours | `clinics`, `clinic_business_hours`, `clinic_assignments` | `subscriber_id`, `clinic_id` |
| Laboratories | `laboratories`, `laboratory_services`, `clinic_laboratory_connections` | `subscriber_id`; connection includes `clinic_id` |
| Payment review and allocation | `payments`, `payment_allocations`, `payment_refunds`, `payment_history` | registration/subscriber references |
| Patients | `patients`, `patient_tags`, `patient_medical_answers`, `patient_allergies`, `patient_conditions`, `patient_habits` | `subscriber_id`, `clinic_id` |
| Clinical work | `progress_notes`, `progress_note_services`, `appointments`, `dental_recalls`, `patient_bills`, `patient_bill_lines`, `patient_payments` | `subscriber_id`, `clinic_id`, `patient_id` |
| Charts and documents | `dental_chart_records`, `patient_documents`, `patient_uploads`, `patient_certificates` | `subscriber_id`, `clinic_id`, `patient_id` |
| Master files | `clinic_master_file_items`, `clinic_tags`, `clinical_services`, `recall_reasons` | owner or branch scope explicitly recorded |
| Notifications and audits | `notifications`, `notification_preferences`, `audit_events` | recipient `user_id`; optional subscriber/clinic context |

## Required Integrity Rules

1. Use UUID primary keys for new database rows. Keep legacy display IDs such as
   `SUB-`, `CLN-`, `STF-`, `DEN-`, and `P` as generated unique display codes.
2. Add foreign keys for every `subscriber_id`, `clinic_id`, `patient_id`, and
   `user_id`; use restrictive deletes for clinical data and audit records.
3. Enforce that a clinic belongs to the same subscriber as its assignments,
   patients, laboratories, and clinical records through database triggers or
   transaction functions.
4. Enforce unique payment references per payment channel where a reference is
   supplied, and prevent payment allocation/refund totals from exceeding the
   original verified payment amount.
5. Enforce one active operational subscription per subscriber.
6. Use soft deletion/status transitions for patients, users, clinics, payments,
   and clinical records where retention is required. Audit events are append-only.
7. All timestamps are `timestamptz`; dates such as birthdays remain `date`.
8. Store currency as integer centavos or a bounded numeric type, never a display
   string such as `PHP 1,800`.

## RLS Policy Matrix

| Actor | Allowed database scope |
| --- | --- |
| Platform administrator | Platform-admin functions and global management tables only |
| Clinic owner | Their subscriber, its clinics, personnel, laboratories, and branch data |
| Associate dentist | Assigned clinics and only clinical operations granted by membership privileges |
| Staff member | Assigned clinics and only operational actions granted by membership privileges |
| Unauthenticated user | Public registration submission and approved public read paths only; no tenant records |

Every exposed table needs explicit RLS policies for `SELECT`, `INSERT`,
`UPDATE`, and `DELETE`. Update policies must include both `USING` and `WITH
CHECK`. The browser must never receive a service-role key. Views used by the
client must be security-invoker views or have direct access revoked.

## Approval Transaction Boundary

The following must become one server-side, idempotent workflow:

`registration -> payment submitted -> platform review -> approved payment -> subscriber -> owner membership -> primary clinic -> active subscription -> invitation/password setup`

The workflow belongs in an Edge Function or a tightly scoped database RPC. It
must validate the platform-admin actor, lock the registration/payment rows,
avoid duplicate provisioning, and emit an audit event. Client code may request
approval but cannot directly create a subscriber or activate a subscription.

## Storage and File Plan

Buckets are private by default:

- `clinic-assets`: clinic and laboratory logos
- `payment-proofs`: payment evidence
- `patient-media`: photos, X-rays, and clinical attachments
- `generated-documents`: controlled generated forms and exports

Object keys begin with `subscriber_id/clinic_id/...`. Storage policies must
mirror database assignment policies. File metadata, MIME type, size, checksum,
and upload actor are stored in database rows. Do not trust a client-supplied
file extension.

## Migration Order for Phase 2+

1. Supabase project and CLI setup; schema defaults and UUID extensions.
2. `profiles`, platform admin allow-list, subscribers, memberships, and clinics.
3. Plans, registrations, subscriptions, payments, and the approval RPC.
4. Staff, associate dentists, clinic assignments, laboratories, and storage.
5. Patients and branch-scoped clinical tables.
6. Master files, notifications, audit logs, analytics read models, and realtime.
7. Frontend repository adapters, feature-by-feature cutover, then removal of
   localStorage fallback only after verified migration.

## Phase 2 Entry Criteria

- A Supabase development project is created by the owner.
- The user provides the project reference through a secure setup flow, not chat.
- The CLI is available and authenticated locally.
- No service-role key is placed in `VITE_*` variables.
- The first schema migration has policy tests for platform, owner, staff, and
  associate access before it is applied to production.
