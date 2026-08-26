# Route Inventory

## Clinic Owner Layer

- `/clinic/dashboard`
- `/clinic/profile`
- `/clinic/branches`
- `/clinic/branches/new`
- `/clinic/branches/:branchId`
- `/clinic/branches/:branchId/edit`
- `/clinic/laboratories`
- `/clinic/laboratories/new`
- `/clinic/laboratories/:laboratoryId`
- `/clinic/laboratories/:laboratoryId/edit`
- `/clinic/dentists`
- `/clinic/dentists/new`
- `/clinic/dentists/:dentistId`
- `/clinic/dentists/:dentistId/edit`
- `/clinic/staff`
- `/clinic/analytics`
- `/clinic/sales`
- `/clinic/daily-reports`
- `/clinic/settings`
- `/clinic/directory`
- `/clinic/directory/dashboard`
- `/clinic/directory/tooth-status`
- `/clinic/directory/dental-conditions`
- `/clinic/directory/procedure-tags`
- `/clinic/directory/restorations`
- `/clinic/directory/surgery`
- `/clinic/directory/xray`
- `/clinic/directory/prescriptions`
- `/clinic/directory/intra-oral-appliance`
- `/clinic/directory/occlusion-index`
- `/clinic/directory/periodontal-psr`
- `/clinic/directory/tmj-assessment`
- `/clinic/directory/hmo-accredited`
- `/clinic/directory/recall-reasons`
- `/clinic/directory/clinical-services`
- `/clinic/directory/medicine-catalog`
- `/clinic/directory/medical-conditions`
- `/clinic/directory/dental-habits`
- `/clinic/directory/tags`
- `/clinic/directory/modify-pdf`

## Clinic Subsystem Layer

- `/clinic/:clinicId/dashboard`
- `/clinic/:clinicId/patients`
- `/clinic/:clinicId/calendar`
- `/clinic/:clinicId/waitlist`
- `/clinic/:clinicId/appointments`
- `/clinic/:clinicId/analytics/overview`
- `/clinic/:clinicId/analytics/daily`
- `/clinic/:clinicId/settings`
- `/clinic/:clinicId/master-files`
- `/clinic/:clinicId/master-files/dashboard`
- `/clinic/:clinicId/master-files/tooth-status`
- `/clinic/:clinicId/master-files/dental-conditions`
- `/clinic/:clinicId/master-files/procedure-tags`
- `/clinic/:clinicId/master-files/restorations`
- `/clinic/:clinicId/master-files/surgery`
- `/clinic/:clinicId/master-files/xray`
- `/clinic/:clinicId/master-files/prescriptions`
- `/clinic/:clinicId/master-files/intra-oral-appliance`
- `/clinic/:clinicId/master-files/occlusion-index`
- `/clinic/:clinicId/master-files/periodontal-psr`
- `/clinic/:clinicId/master-files/tmj-assessment`
- `/clinic/:clinicId/master-files/hmo-accredited`
- `/clinic/:clinicId/master-files/recall-reasons`
- `/clinic/:clinicId/master-files/clinical-services`
- `/clinic/:clinicId/master-files/medicine-catalog`
- `/clinic/:clinicId/master-files/medical-conditions`
- `/clinic/:clinicId/master-files/dental-habits`
- `/clinic/:clinicId/master-files/tags`
- `/clinic/:clinicId/master-files/modify-pdf`

## Clinic Subsystem Notes

- Current continuation path to clinic console / branch workspace:
  - login as clinic owner
  - `/clinic/dashboard`
  - `/clinic/branches`
  - enter branch
  - `/clinic/:clinicId/dashboard`
- The patient module is centered in the existing `/clinic/:clinicId/patients` workspace.
- The main patient record nested workflow is reached through:
  - login as clinic owner
  - `/clinic/dashboard`
  - enter branch
  - `/clinic/:clinicId/patients`
  - use the patient row go/action control
  - continue inside the individual patient record route
- `/clinic/:clinicId/calendar` is now part of the active linked patient-clinical scheduling chain.
- The patient record no longer shows `Appointments` as a visible tab, but the routed workspace remains available for recall-driven entries created from `Progress Notes`.
- The active clinic scheduling sync chain is:
  - `Progress Notes -> Bills & Payments -> Patient Appointments -> Dental Recalls -> Calendar`
- The `/clinic/:clinicId/master-files` route resolves to the Master File Directory workspace landing page.
- Current notable master-file routes reused by patient flows:
  - `/clinic/:clinicId/master-files/tags`
  - `/clinic/:clinicId/master-files/recall-reasons`
  - `/clinic/:clinicId/master-files/clinical-services`
  - `/clinic/:clinicId/master-files/medicine-catalog`
- The Master File Directory sidebar groups load collapsed by default and expand only when the user opens them.
- Owner-console master files use `/clinic/directory/*` and return to `/clinic/dashboard`.
- Branch/subsystem master files use `/clinic/:clinicId/master-files/*` and return to `/clinic/:clinicId/dashboard`.
- Phase 8 verification rechecked this owner/branch route split and confirmed `npm run build` passes with 0 errors.
- Current active sidebar navigation spans four groups:
  - `Tooth Items`
  - `Clinical Templates`
  - `Master Files`
  - `Pdf Designer`

## Platform Layer

- `/platform/dashboard`
- `/platform/subscribers`
- `/platform/users`
- `/platform/clinics`
- `/platform/laboratories`
- `/platform/plans`
- `/platform/subscriptions`
- `/platform/payments`
- `/platform/analytics-reports`
- `/platform/announcements`
- `/platform/notifications`
- `/platform/audit-logs`
- `/platform/data-restore`
- `/platform/settings`
