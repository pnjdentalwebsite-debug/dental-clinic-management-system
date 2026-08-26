# Dental Clinic Management System

## Production Foundation

The current application is a frontend prototype. Its data and session flows are
still localStorage-backed until the planned Supabase migration is completed.
The Phase 1 production foundation, tenant model, RLS rules, and migration order
are documented in `context/supabase_phase_1_foundation.md`.

For future local configuration, copy `.env.example` to `.env.local` and keep
all secret server keys outside `VITE_*` variables and Git.

## Frontend Modules

- Clinic Owner workspace
- Clinic Subsystem workspace
- Patient management and clinical workspace
- Scheduling
- Analytics
- Settings
- Master File Directory workspace shell

## Patient Clinical Workspace

- The individual patient workspace now exposes a broader clinical shell:
  - Primary tabs: `Overview`, `Dental Chart`, `Progress Notes`, `Certificates`, `Prescriptions`, `Bills & Payments`, `Upload / Xrays`, and `Dental Recalls`
  - Overflow tabs: `Appointments`, `Scratchpad Notes`, and `Followup Lists`
- The patient `Appointments` workspace remains routed for recall-driven entries, but its tab is intentionally hidden from the regular patient sidebar/tab strip.
- `Progress Notes` provides a frontend clinical visit log with search, refresh/export controls, a row actions menu, and a custom New/Edit Clinical Progress Note & Treatment Plan modal.
- Progress note entries remain local UI state for now; no backend, Supabase, or database persistence is introduced in this phase.
- Progress Notes now also drives downstream patient billing and recall entries: service rows populate `Bills & Payments`, and recall dates create follow-up appointment-style entries that remain visible through the routed appointments workspace.

## Master File Directory Workspace

The Master File Directory no longer behaves like a normal page inside the clinic subsystem content area. It now has a dedicated workspace shell with its own sidebar and route-based navigation.
- The Master File Directory sidebar groups start collapsed by default and expand only when the user opens them.

## Patient Documents & Forms

- The individual patient `Certificates` tab now renders a Documents & Forms workspace instead of the previous mock certificate list.
- Patient Form, Dental Chart Form, Treatment Record Form, Certificate Form, Consent Form, and Contract Form reuse the A4 components configured in Master File Directory `Modify Pdf`.
- Saved Modify PDF settings provide branding and layout; the selected patient record provides persisted identity, demographic, contact, medical, and appointment values.
- Modify PDF edits remain draft-only until `Save Configuration` is used. Saving publishes the configuration to open patient Documents & Forms workspaces immediately, while `Lock Template` saves and freezes the controls until `Modify PDF` is selected again.
- Print and client-side PDF download operate on the active patient form.
- Dental Chart surface conditions and procedure tags are persisted per patient and reflected in real time in the printable Dental Chart Form; untouched teeth remain blank.
- The individual patient Dental Chart tab now supports two synchronized editing modes:
  - `Inline Surfaces` for direct single-tooth surface charting across the full chart
  - `Charting w/ Multiple Selection` for row-based multi-tooth selection with shared status application, large-tooth preview, and shared Procedures & Tags editing
- Both Dental Chart modes read and write the same patient-scoped `DentalChartRecord`, so any change made in one mode is immediately visible in the other mode and in the printable Dental Chart Form.
- Contract Form is now patient-bound as well. Auto-filled patient details, acknowledgement fields, and orthodontic package ledger rows are stored locally per patient and reflected immediately in the preview, print, and downloaded PDF.
- The active preview, print result, and downloaded PDF share the same A4 portrait, narrow-margin, Arial form component.
- Multi-page printable forms such as Contract Form use one shared page-capture pipeline so preview, browser print, and client-side PDF download stay aligned page-for-page.
- The integration is frontend/local-storage only. Patient inputs that are not yet persisted remain blank in exported forms.
- Patient Form, Dental Chart Form, Treatment Record Form, Certificate Form, Consent Form, and Contract Form all share the same printable patient-document pipeline, so preview, print, and PDF download stay aligned.

## Bills & Payments

- The patient `Bills & Payments` module now has a `Pay Bill` row action for unpaid bills.
- Payment capture now supports payment method options, reference numbers, remarks, proof uploads, payment history, and auto-calculated totals/balances.
- Billing rows retain linked service/procedure details from the originating Progress Note.
- The current focus is payment workflow polish and verification; the existing progress-note sync contract remains intact.

### Route Structure

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

### Navigation Flow

- Main clinic sidebar opens the Master File Directory workspace landing route.
- Master File Directory sidebar now groups routes into `Tooth Items`, `Clinical Templates`, `Master Files`, and `Pdf Designer`.
- Master File Directory now also includes a `Pdf Designer` dropdown with a `Modify Pdf` route.
- The patient record `Appointments` workspace remains routed for recall visibility, but the sidebar tab is intentionally hidden from the patient navigation strip.
- `Exit to Main` explicitly returns the user to `/clinic/:clinicId/dashboard`.
- `Modify Pdf` opens a settings-first configuration workspace for printable form structure, branding, image placement, dentist signature visibility, and record layout tuning.
- The Patient Form preview now uses a complete A4 portrait patient record with narrow print margins, clinical history questions, medical checklists, and signature fields. It can be printed directly or downloaded as a generated PDF.

### Current Phase Boundary

This phase implements the workspace shell only.

Intentionally untouched:

- Supabase
- backend APIs
- database migrations
- patient workflow
- dental chart behavior
- certificate and document generation workflows

## Tooth Items Admin UX

- Tooth Items pages now share one upgraded add/edit modal pattern across Tooth Status, Tooth Condition, Restoration & Prosthodontics, Dental Surgery, and X-Ray Scan Items.
- Shared pagination now shows `7` records per page for all Tooth Items tables.
- Delete actions now require an explicit confirmation before local-state removal.
- The shared add/edit modal now keeps a single live preview card directly below the header; the older duplicate lower preview block has been removed.
- Tooth Item sidebar count badges now update immediately after add, edit, duplicate, and delete actions through the local workspace event sync.
- Default reference records are seeded for first-use local initialization only; records deleted later in the workspace are no longer silently restored.
- Tooth Condition now includes richer seeded clinical metadata for reusable odontogram meanings, chart behavior defaults, and visual color previews while staying fully frontend/local-state only.
- Tooth Status now acts as the reusable presentation baseline for future Tooth Items modules through shared Master File components for page headers, modal shells, preview cards, form sections, footer actions, tables, toolbars, and pagination.

## Master File Directory Workspace UX

- The Master File Directory now uses a stronger workspace shell with a dedicated clinic administration sidebar, grouped navigation, and a reusable content wrapper for all child routes.
- The sidebar preserves clinic branding, simplified `Exit to Main` navigation, a collapsible Tooth Items section, a collapsible `Pdf Designer` section with `Modify Pdf`, and active-route highlighting.
- Dashboard and section routes now render inside one consistent Master File workspace frame so the module feels like a configuration center instead of isolated page-level CRUD screens.
