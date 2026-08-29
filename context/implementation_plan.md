# Current Implementation Plan - Active Continuation

This file now tracks the current live continuation priorities instead of older milestone-by-milestone archive planning.

## Active Working Baseline

- The clinic owner branch workspace is the main continuation surface.
- The patient module is the most actively integrated clinic subsystem area.
- Patient editing is split across:
  - Add New Patient stepper
  - Update Record full stepper edit flow
  - Quick Update modal
  - Clinical Review sheet
- Progress Notes now act as a clinical source trigger for linked downstream records.
- Calendar is no longer isolated; it is part of the patient follow-up workflow.
- Master File Directory is the reusable lookup source for multiple patient-clinical workflows.

## Current Shared Rules

### Patient Record Rule

All patient editing surfaces should update the same live patient profile state.

### Clinical Sync Rule

The current linked chain is:

`Progress Notes -> Bills & Payments -> Patient Appointments -> Dental Recalls -> Calendar`

### Patient Remarks Rule

Patients table remarks should be derived from live record conditions only:

- Recall Due
- Missed Birthday
- Missed Appointment
- Partial Pay

### Lookup Reuse Rule

Master File Directory should remain the reusable source for:

- Tags
- Recall Reasons
- Clinical Services
- Prescription Templates

## Near-Term Priorities

1. Keep patient profile edits consistent across Quick Update, Update Record, Clinical Review, and header/profile display.
2. Keep progress-note-linked sync stable across billing, appointments, recalls, and calendar.
3. Keep patients table filters, date selection, and derived remarks aligned with real linked record state.
4. Keep Master File Directory lookups as the single clinic reference source for tags, recall reasons, services, and templates.
5. Keep clinic calendar actions using custom modal/toast patterns and proper linked-record cleanup.

## Documentation Rule

Context documentation should reflect the current operational workflow, not just historical milestones.

Older implementation archive notes may remain in some files for history, but they are no longer the primary source of truth for the live clinic continuation flow.

## Phase 1C Registration Plan

- [x] Add Registration staging schema, secure OTP persistence, protected plan catalog, OTP endpoints, atomic payment RPC, and registration-bound status.
- [x] Verify focused backend contracts and production build.
- [ ] Apply migration and deploy functions to the linked Supabase project.
- [ ] Configure Registration email secrets and validate real delivery.
- [ ] Cut over the frozen `App.tsx` Registration handlers in a separately approved phase.

## Phase 1D Development Plan Catalog

- [x] Create tracked Basic, Plus, and Max development/test plan configuration with annual totals matching the existing 15% UI calculation.
- [ ] Apply the plan catalog migration to the confirmed Supabase project.
- [ ] Keep commercial/public pricing subject to a later approved configuration change.
- [ ] Registration frontend cutover remains a separate task.
