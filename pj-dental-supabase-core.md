# PJ Dental Supabase System Integrator

## Purpose

Implement and repair the PJ Dental Clinic Management System module-by-module using real Supabase-backed data while preserving existing workflows, tenant isolation, branch isolation, role permissions, and approved UI/UX.

This skill focuses on:

- PostgreSQL schema
- Supabase migrations
- foreign keys
- indexes
- RLS
- RPCs
- Edge Functions
- Supabase Auth
- repositories/services
- fetching
- mutations
- transactional workflows
- cross-module synchronization
- testing
- production build verification

Always follow the UI preservation rules for frontend work.

## Primary Architecture Rule

For every implementation:

`Existing UI → service/repository layer → Supabase → real persisted data → existing UI`

Do not create a second parallel source of truth.

## No Mock Runtime Rule

Production/live workflows must not rely on:

- localStorage as source of truth
- seeded mock runtime data
- fallback subscriber IDs
- fallback clinic IDs
- fallback branch IDs
- hardcoded user accounts
- hardcoded temporary passwords
- fabricated analytics
- UI-only success states

Mocks may exist only in clearly isolated tests/dev fixtures if they cannot affect real runtime behavior.

## Module-by-Module Rule

Work on one module/phase at a time.

Before changing code:

1. Audit the current implementation.
2. Identify existing tables, migrations, services, Edge Functions, RPCs, hooks, routes, and RLS.
3. Reuse or repair existing architecture when valid.
4. Do not create duplicate tables/services/functions for the same concept.
5. Define the exact input, processing, persistence, output, and verification path.

Do not expand scope into unrelated modules unless required by an explicit relationship.

## Required Data Ownership

Every tenant-scoped record must use the correct ownership hierarchy where applicable:

- `subscriber_id`
- `clinic_id`
- `branch_id`
- `patient_id`
- authenticated `user_id`
- role / membership context

Clinical downstream records should preserve source relationships when supported, such as:

- `source_progress_note_id`
- `source_recall_id`
- parent bill/payment relationship IDs

Never infer tenant or branch scope from UI labels or names.

## Isolation Rules

Enforce:

- Subscriber A cannot read/write Subscriber B data.
- Branch A cannot read/write Branch B data unless the authenticated role is explicitly authorized.
- Associate dentists only access assigned clinics/branches.
- Staff only access assigned clinics/branches and allowed actions.
- Platform Admin access must remain platform-scoped.
- Clinic Owner access must remain subscriber-scoped.

Verify isolation in database/RLS, not only frontend routing.

## Authentication Rules

Use real Supabase Auth and server-side authorization.

For onboarding/provisioning:

- generate secure random temporary credentials
- never use seeded or embedded passwords
- require first-login password change when applicable
- invalidate temporary credentials after successful password change
- preserve correct role and membership records

## Transactional Workflow Rule

When one save operation creates related downstream records, prefer an atomic database transaction/RPC/Edge Function when partial success would corrupt the workflow.

Example:

`Progress Note`
- save clinical note
- optionally create certificate
- create bill only for chargeable service
- create recall only if recall data exists
- create appointment only when explicitly scheduled

Do not blindly auto-create all downstream records.

## Master File Directory Rule

Master File Directory is the authoritative source for configurable clinical reference data.

Clinical forms should fetch current active values for:

- dental screening definitions
- occlusion
- intra-oral appliance
- TMJ
- tooth status
- conditions
- restorations
- prosthodontics
- procedures/tags
- services/procedures
- recall reasons
- medicines/prescription definitions
- other configured clinical catalogs

Do not duplicate these values as hardcoded frontend arrays if the database already owns them.

## Patient Record Rule

A new patient must start with a fresh patient UUID and empty clinical datasets unless the user explicitly creates records.

No old/deleted patient data may leak into a new patient.

All patient modules must remain linked to the same patient identity:

- Dental Chart
- Progress Notes
- Certificates
- Prescriptions
- Bills & Payments
- Uploads / X-rays
- Dental Recalls
- Appointments
- Scratchpad Notes
- Follow-up Lists

## Calendar Quick Register Rule

Quick Register is independent from the Progress Note workflow.

Expected behavior:

`Calendar → type patient → search existing patients`

If match:
- use existing patient UUID

If no match:
- ask whether to quick-register
- create a real Draft/Temporary patient in Supabase
- generate one real patient UUID
- create the appointment using the same UUID
- show the patient in Patients with Draft/Temporary status
- completing the profile later must `UPDATE` the same patient row, not create another patient

## Progress Note Data-Sharing Rule

Progress Notes are a clinical source workflow.

Expected conditional downstream behavior:

`Progress Note`
- selected Service / Procedure → Bills & Payments when chargeable
- certificate → only when selected/applicable
- Recall Date/Reason/Time → Dental Recalls
- explicit linked scheduling → Appointments
- appointment → Calendar / Patient Appointments / Daily Waitlist where applicable

The bill must use the exact selected Master File service/procedure and cost.

The recall must use the exact saved recall date/reason/time.

The appointment must preserve the correct patient, branch, source recall, and scheduling data.

## Financial Synchronization Rule

Chargeable clinical records must synchronize to the patient's financial state.

Expected:

`Chargeable Procedure → Bill/Ledger → Outstanding Balance`

The same balance should feed, where applicable:

- Bills & Payments
- patient balance
- Patients table balance
- Pending Balances
- Patients w/ Balance
- financial analytics/reports

Confirmed payments must update remaining balance consistently.

## Analytics Rule

Analytics, alerts, notifications, and activity history must be derived from real persisted system events.

Do not fabricate analytics or seeded activity.

Aggregation hierarchy:

`Branch → Subscriber/Clinic Owner → Platform`

A Clinic Owner aggregate must include all authorized branches, not only whichever branch is currently active.

## Implementation Workflow

For every module:

### 1. Audit
- current frontend flow
- current services/repositories
- Supabase tables
- migrations
- RLS
- Edge Functions
- RPCs
- auth/session assumptions
- existing tests

### 2. Define Target Contract
Document:
- input
- validation
- persisted records
- ownership IDs
- downstream consumers
- error behavior
- expected UI output

### 3. Implement Backend
Apply the smallest correct schema/service/function changes.

### 4. Connect Existing UI
Wire the existing approved interface to the real backend.

### 5. Verify Persistence
Confirm:
- save succeeds
- refresh retains data
- logout/login retains data

### 6. Verify Cross-Module Sync
Check every required downstream consumer.

### 7. Verify Security
Test:
- correct subscriber
- wrong subscriber
- correct branch
- wrong branch
- correct role
- unauthorized role

### 8. Build and Test
Run focused tests and production build.

## Completion Standard

Do not report a workflow as complete only because backend tests pass.

A phase is complete only when all applicable layers work:

1. Existing UI accepts correct input.
2. Supabase receives the correct write.
3. Foreign-key/source relationships are correct.
4. RLS and authorization are correct.
5. Downstream processing succeeds.
6. Frontend fetches the new data.
7. Data is visibly correct in the expected existing UI.
8. Browser refresh preserves it.
9. Logout/login preserves it.
10. Wrong tenant/branch/role cannot access it.
11. No mock/localStorage fallback was used.
12. Production build passes.
13. UI preservation checks pass.

## Final Report Format

At completion, report:

### Implemented
- exact backend/system changes

### Supabase
- migrations
- tables
- RLS
- RPCs
- Edge Functions
- Auth changes

### Data Flow Verified
- source → persistence → downstream modules

### Security Verified
- subscriber isolation
- branch isolation
- role permissions

### UI Preservation
- visual changes: `NONE` unless explicitly approved

### Tests
- focused tests
- signed-in UI verification
- production build

### Remaining Issues
List real unresolved issues. Do not hide them behind a successful build.
