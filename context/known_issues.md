# Known Issues

## Current Snapshot - August 25, 2026

## Resolved - August 25, 2026

- **Fixed: localStorage quota exceeded on `pnj_mock_activity_logs`** - The activity log array grew unbounded and exceeded the ~5MB localStorage quota, causing the mock frontend to catch a recoverable render error ("Failed to execute 'setItem' on 'Storage': Setting the value of 'pnj_mock_activity_logs' exceeded the quota").
  - Added `MAX_ACTIVITY_LOGS = 500` cap in `src/App.tsx` so `setActivityLogs` trims to the latest 500 entries.
  - Added `MAX_AUDIT_EVENTS = 1000` cap in `src/features/audit/services/mockAuditService.ts` so `writeEvents` trims to the latest 1000 audit events.
  - Made `safeWrite` quota-safe across all mock services that write to `pnj_mock_activity_logs` / `pnj_mock_audit_logs`:
    - `src/App.tsx`
    - `src/features/audit/services/mockAuditService.ts`
    - `src/features/plans/services/mockPlanService.ts`
    - `src/features/clinics/services/mockClinicService.ts`
    - `src/features/laboratories/services/mockLaboratoryService.ts`
    - `src/features/payments/services/mockPaymentService.ts`
    - `src/features/subscriptions/services/mockSubscriptionService.ts`
    - `src/features/announcements/services/mockAnnouncementService.ts`
    - `src/features/platformManagement/services/mockPlatformManagementService.ts`
  - On quota failure, the safeWrite helper trims the collection to 200 entries and retries once; if that still fails, it removes the key entirely to recover storage space and keep the app running.

- **Fixed: Payment deletion now cascades to linked subscriber/subscription/clinic/registration** - Deleting a payment from "Payments & Receipts" now permanently removes the linked Clinic Owner, Active Subscription, Dental Clinic, and Registration.
  - `mockPaymentService.permanentlyDeletePayment` now resolves the linked subscriber via `subscriberId`, `registrationId`, or `payerEmail` and calls `mockPlatformManagementService.deleteSubscriber` to cascade-delete all linked records.
  - If no subscriber was provisioned yet, it removes the registration and auth user directly.

- **Fixed: Stale/orphaned subscriber records purged** - `mockPlatformManagementService.ensureSeedData` now purges subscriber records that have no linked registration or payment (e.g. `SUB-2026-000004` showing "Subscriber record not found.").
  - Stale subscriber IDs are blacklisted in `DELETED_SUBSCRIBERS_KEY` so they can never be re-provisioned.
  - The primary subscriber `gelomhyr@gmail.com` / `SUB-396924` is always preserved.

## High Attention Areas

- Linked local-state workflows still need repeated manual verification whenever sync logic changes:
  - `Progress Notes -> Bills & Payments`
  - `Progress Notes -> Patient Appointments`
  - `Progress Notes -> Dental Recalls`
  - `Progress Notes -> Calendar`
  - patient appointment delete/cancel reconciliation
  - calendar agenda delete/cancel reconciliation
- Calendar and patient-clinical scheduling are still frontend/local-state driven. They do not have backend truth or conflict protection.

## Current UX / Logic Risks

- Some older untouched areas may still contain legacy browser `alert` / `confirm` flows. Newer patient and calendar flows are expected to use custom modals and custom toasts instead.
- Patient remarks in the patients table should come only from live derived states such as:
  - `Recall Due`
  - `Missed Birthday`
  - `Missed Appointment`
  - `Partial Pay`
  Static mock remark sentences are no longer the desired behavior.
- Progress note save logic is now part of a larger sync chain. A partial save, delete, duplicate, or edit bug can appear as inconsistency across multiple tabs rather than one isolated module.
- Custom date-picker styling exists in multiple patient-facing and billing/upload flows. Any future date-control refactor should verify:
  - patient specific-date picker
  - quick update birthdate picker
  - add/edit patient stepper birthdate picker
  - billing entry bill-date picker
  - upload/xray date picker

## Documentation Risks

- Several context docs had older milestone-history sections mixed into current-state docs. Those stale historical sections were causing confusion about what is already implemented versus what is still active work.

## Existing Technical Debt

- `src/App.tsx` remains oversized and still carries significant route/application orchestration.
- Large parts of the prototype still rely on local mock storage and seeded records rather than durable backend persistence.
- Clinic owner modules now share similar nested-route admin patterns, but they are not yet abstracted into one universal admin-stepper framework.

## Current Manual Regression Priorities

- Add progress note -> verify bill, appointment, recall, and calendar output
- Edit progress note -> verify linked records update cleanly
- Delete/cancel linked appointment from patient and calendar surfaces
- Verify patient add/edit photo persistence in UI state
- Verify quick update and full stepper update both write to the same patient state
- Verify patient image add/edit flows render consistently in:
  - patient list/profile surfaces
  - quick update
  - full update record
- Verify master-file lookup reuse:
  - tags
  - recall reasons
  - clinical services
- Verify clinic owner nested-route parity across:
  - branches
  - laboratories
  - associate dentists

## Phase 1C Registration Remaining Items

- Supabase CLI is unavailable on the current host, so the new migration was not applied or database-linted locally.
- Registration email delivery requires server secrets: `REGISTRATION_OTP_PEPPER`, `REGISTRATION_EMAIL_ENDPOINT`, `REGISTRATION_EMAIL_API_TOKEN`, and `REGISTRATION_EMAIL_FROM`.
- The live `App.tsx` Registration Wizard still uses mock/localStorage services until the separately approved frontend cutover.
