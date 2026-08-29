# Mock Data Contract - Current Clinic Continuation

All current clinic workflows in this project are still frontend and local-state driven. Data is not yet backed by Supabase or any production persistence layer.

## Core Patient Clinical Sync Chain

The active linked workflow now starts from the patient `Progress Notes` module:

`Progress Notes -> Bills & Payments -> Patient Appointments -> Dental Recalls -> Calendar`

This is the current source-of-truth chain for patient follow-up scheduling and linked billing behavior inside the clinic subsystem.

## Progress Notes Contract

- Progress notes are patient-scoped clinical records.
- A saved progress note may create or update linked records in other modules when relevant fields are present.
- Current important source fields:
  - visit date
  - recall date
  - recall reason
  - service / treatment rows
  - total / discount / net treatment cost
  - clinical notes / remarks
  - attachments
- Save and edit behavior should preserve the originating progress note as the upstream record.

## Bills & Payments Contract

- Bills are derived from billable `Service / Treatment Details` rows coming from Progress Notes.
- The billing workspace currently supports:
  - service rollups
  - discounts
  - payable amount
  - paid amount
  - balance amount
  - payment history
  - payment method
  - payment proof / reference metadata
- `Partial Pay` is one of the live derived patient attention signals used by the Patients table remarks column.

## Patient Appointments Contract

- The patient `Appointments` workspace is still route-backed even though its tab is intentionally hidden from the patient tab strip.
- Recall-driven appointments can be created from Progress Notes.
- Appointment records should carry:
  - linked patient identity
  - appointment date/time
  - recall reason or appointment reason
  - status
  - provider / dentist
  - optional notes
- Cancel and delete behavior must reconcile with the linked Calendar copy.

## Dental Recalls Contract

- Dental Recalls now receives linked entries from Progress Notes.
- Recall records are part of the live patient follow-up chain and should no longer be treated as isolated static mock rows.
- `Recall Due` is a live derived patient attention signal and should come from actual linked recall state, not placeholder remarks text.

## Calendar Contract

- Clinic calendar records are clinic-scoped schedule entries.
- Linked recall appointments created from Progress Notes should also appear in clinic `/calendar`.
- Calendar actions such as cancel/delete must reconcile with the same linked appointment chain instead of leaving orphaned copies behind.

## Patients Table Derived Contract

The Patients page remarks column should display only live derived patient attention signals when applicable:

- `Recall Due`
- `Missed Birthday`
- `Missed Appointment`
- `Partial Pay`

Rules:

- If none apply, remarks should remain blank.
- If multiple apply, compact remark blips may collapse overflow using a `+N` pattern.
- These are derived UI signals, not manually authored notes.

## Patient Profile Contract

Patient profile state is now shared across multiple editing surfaces:

- Add New Patient stepper
- Update Record stepper edit flow
- Quick Update modal
- Clinical Review / Additional Clinical Information sheet
- printable patient-bound forms

Changes in these surfaces are expected to update the same live patient record state.

Patient photo behavior:

- A patient image selected during add/edit should persist into the patient record header and related patient profile surfaces.
- The photo contract remains frontend/local-session/state based unless a storage backend is added later.

## Master File Directory Lookup Contract

Master File Directory is now the reusable reference source for multiple patient-clinical workflows.

Current important lookup reuse:

- `Tags` -> patient `Manage Tags`
- `Recall Reasons` -> Progress Note recall reason selector
- `Clinical Services` -> Progress Note `Service / Procedure` autocomplete
- `Prescriptions` under `Clinical Templates` -> patient Prescriptions workflow

## Current Master File Groups

### Clinical Templates

- Prescriptions
- Intra Oral Appliance
- Occlusion Index
- Periodontal PSR
- TMJ Assessment

### Master Files

- HMO Accredited
- Recall Reasons
- Clinical Services
- Medicine Catalog
- Medical Conditions
- Dental Habits
- Tags

## Current Limitation

- All of the above is still local-state / mock-data behavior.
- No backend persistence, Supabase storage, or production data integrity guarantees exist yet.

## Phase 1C Registration Exception

- The secure Supabase Registration backend foundation now exists for plan catalog, registration staging, OTP verification, atomic payment submission, and registration-bound status.
- The visible Registration Wizard remains on the mock/localStorage contract until frontend cutover; backend readiness must not be described as live UI completion.
