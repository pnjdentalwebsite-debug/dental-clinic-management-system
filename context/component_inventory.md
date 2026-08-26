# Component Inventory

## Full-System Diagnostic - August 26, 2026

- `src/features/platformManagement/pages/UserDetailsPage.tsx` now keeps clinic selection hook state stable when the requested user is missing.
- Role console, platform, clinic owner, and branch components remain frontend/localStorage-backed until the Supabase handoff is implemented.
- Production readiness still requires server-backed auth, tenant policies, durable persistence, and deployment infrastructure.

## Cross-System Auth / Signup / Provisioning Services

- `mockAuthService.login`
  - Batch 1: Validates existing auth users only; no longer creates missing clinic-owner auth records from registration/platform fallback data.
  - Batch 3: Resolves session clinic names from linked subscriber/clinic records instead of storing raw `clinicId` as `clinicName`.
- `mockRegistrationService`
  - Creates pending registration records only during signup.
- `handleCompleteDemoPayment` (`App.tsx`)
  - August 26, 2026 cleanup repair: registration checkout now submits payment through the centralized payment service only, preventing duplicate legacy onboarding payment rows.
- `mockPaymentService.approveRegistrationPayment`
  - Batch 2: Single provisioning gate for approved clinic-owner accounts, temporary password sync, active subscription, and primary clinic creation.
  - August 26, 2026 visibility repair: skips projected `PAY-PENDING-*` display rows and creates a real payment ledger record first when approval starts from a registration without a persisted payment row.
- `mockPlatformManagementService.createSubscriberFromApprovedRegistration`
  - Central subscriber/platform-user/auth provisioning path after approval.
  - Batch 4: Re-approval preserves completed password setup and does not reintroduce stale registration temp passwords.
- `mockPlatformManagementService.completePasswordChangeByEmail`
  - Batch 3: Clears first-login flags and registration `tempPassword` after a successful clinic-owner password change.
- `mockPlatformManagementService.listSubscribers`
  - Batch 2: Read-only subscriber listing; no registration provisioning side effects.
  - August 26, 2026 visibility repair: includes derived pending subscriber projections from registration records so unpaid/pending registrations stay visible in the Clinic Owners workflow before approval.
- `mockPlatformManagementService.purgeRequestedPendingRegistration`
  - August 26, 2026 cleanup repair: reruns the retired `sad@gmail.com` purge on existing browsers, removes lingering email-linked payment/auth/subscriber artifacts, and clears that retired email/registration from the deleted blacklist so fresh registration can proceed cleanly.
- `mockPlatformManagementService.ensureSeedData`
  - August 26, 2026 cleanup repair: adds deleted-blacklist artifact purging across registrations, payments, subscribers, platform users, auth users, clinics, subscriptions, dentists, and staff to reduce ghost onboarding state.
- `mockSubscriptionService.listSubscriptions`
  - Batch 2: Includes derived pending registration rows for Active Subscriptions display without persisting tenant records.
- `mockPaymentService.listPayments`
  - August 26, 2026 visibility repair: includes derived registration payment projections for `unpaid` and `pending_verification` registrations so Payments & Receipts stays in sync with signup records even before a real payment record exists.
  - August 26, 2026 cleanup repair: normalizes legacy string payment amounts safely during cleanup passes so stale malformed rows do not poison payment summaries or display state.
- `mockClinicService.listClinics`
  - August 26, 2026 visibility repair: includes derived pending clinic projections from registration records so the Dental Clinics registry can show partial clinic creation before approval.
- `resolveEmailOnlyAccountStatus` (`App.tsx`)
  - Batch 3: Requires provisioned auth credentials before showing account-ready status; approved-but-incomplete accounts remain pending with repair instructions.
- Branch subsystem route resolver (`App.tsx`)
  - Batch 3: Verifies `/clinic/:clinicId/*` branch ownership against the logged-in subscriber before rendering the branch workspace.
- `mockPlatformManagementService.listUsers`
  - Batch 1: Ignores orphan staff/dentist records without a valid `subscriberId`; no default primary subscriber fallback.
- `mockLaboratoryService.initializeLaboratories`
  - Batch 1: Manual lab workflows only; registration-based auto-lab provisioning disabled.
- `mockBackupRestoreService`
  - Batch 4: Backup/restore registry now includes `branch_workspace` with dynamic branch and patient clinical localStorage keys for reset checkpoints and storage summaries.
  - August 26, 2026: adds `staleSafePurge()` for targeted clearing of processed platform ledgers and linked branch workspace traces while preserving platform admin auth, settings baseline, and restore checkpoints.
- `App.tsx`
  - August 26, 2026: adds platform-only top-navbar `Stale-Safe Purge` button beside `Prototype Mode` plus a typed-confirmation modal wired to `mockBackupRestoreService.staleSafePurge()`.

## Clinic Subsystem Shell

- `ClinicWorkspaceLayout`
- `SubscriptionLockedScreen`
- `ClinicSubsystemSidebar`
- `ClinicSubsystemNavbar`
- `ClinicSubsystemPlaceholderPage`
- `ClinicDashboardHeader`
- `ClinicSchedulingLayout`
- `SchedulingHeader`
- `AnalyticsLayout`
- `AnalyticsHeader`
- `ScheduleTabNavigation`
- `AnalyticsNavigation`
- `CalendarNavigation`
- `WaitlistHeader`
- `WaitlistQueue`
- `WaitlistCard`
- `WaitlistStatusBadge`
- `WaitlistActions`
- `AppointmentHeader`
- `AppointmentToolbar`
- `AppointmentTable`
- `AppointmentRow`
- `AppointmentStatusBadge`
- `AppointmentDetailsPanel`
- `AppointmentWorkflow`
- `AppointmentStatusActions`
- `AppointmentStatusHistory`
- `AppointmentConfirmationDialog`
- `SchedulingModuleErrorState`
- `CalendarSkeleton`
- `WaitlistSkeleton`
- `AppointmentTableSkeleton`
- `AnalyticsCard`
- `AnalyticsSection`
- `AnalyticsMetric`
- `AnalyticsEmptyState`
- `DailyMetricCard`
- `DailyActivityFeed`
- `DailyAppointmentSummary`
- `SettingsLayout`
- `SettingsHeader`

## Clinic Subsystem Pages

- `ClinicDashboardPage`
- `PatientsPage`
- `AddPatientStepper`
- `DraftExitConfirmation`
- `DraftIndicator`
- `PatientTableSkeleton`
- `PatientCardSkeleton`
- `PatientRecordSkeleton`
- `AddPatientStepperSkeleton`
- `PatientModuleErrorState`
- `PatientRecordView`
- `PatientProfileHeader`
- `PatientInformationSection`
- `QuickUpdate` workflow modal/surface
- `Update Record` stepper edit flow
- `CalendarHeader`
- `CalendarGrid`
- `CalendarEvent`
- `CalendarPage`
- `CalendarFilterCard`
- `CalendarLegendCheckbox`
- `AgendaModal`
- `CalendarActionMenu`
- `CalendarWeekView`
- `CalendarDayView`
- `CalendarListView`
- `AppointmentFormModal`
  - Current calendar workflow uses this modal pattern for local add/edit appointment interactions
- `WaitlistPage`
- `AppointmentsPage`
- `AnalyticsOverviewPage`
- `AnalyticsDailyPage`
- `OverviewResultsPage`
- `DailyResultsPage`
- `SettingsSection`
- `SettingsCard`
- `SettingsToggle`
- `SettingsInput`
- `SettingsWorkspacePage`
- `SettingsPage`
- `MasterFilesPage`
- `MasterFileDirectoryLayout`
- `MasterFileDirectorySidebar`
- `MasterFileNavGroup`
- `MasterFileWorkspaceLayout`
- `MasterFilePageHeader`
- `MasterFileDirectoryDashboardPage`
- `MasterFileDirectorySectionPage`
- `MasterFileToolbar`
- `MasterFileTable`
- `MasterFilePagination`
- `MasterFileModal`
- `MasterFilePreviewCard`
- `MasterFileFormSection`
- `MasterFileModalFooter`
- `MasterFileRecordModal`
- `toothItemConfigs`
  - Master File Directory opens with all groups collapsed by default until the user expands a section
  - Configuration map now covers Tooth Items, Clinical Templates, and Master Files categories through one shared table/modal/preview system
  - `MasterFileDirectoryLayout`, `MasterFileDirectorySidebar`, `MasterFileNavGroup`, and `MasterFileDirectoryDashboardPage` support route-base/back-route scope props so the owner console uses `/clinic/directory/*` while branch subsystems use `/clinic/:clinicId/master-files/*`
  - Owner-scoped Master File Directory navigation was retired on August 26, 2026; clinic owners now manage master files only inside branch workspaces, and `/clinic/directory/*` shows a return notice instead of editable content
  - Phase 8 verification confirmed the route-base/back-route component contract remains aligned with branch `/clinic/:clinicId/master-files/*`

## Clinic Subsystem Patient Components

- `PatientToolbar`
- `PatientTable`
- `PatientTableHeader`
- `PatientTableRow`
- `PatientGrid`
- `PatientCard`
- `PatientEmptyState`
- `AddPatientStepper`
- `DraftExitConfirmation`
- `DraftIndicator`
- `QuickUpdate` workflow modal/surface
- `Update Record` stepper edit flow
- `PatientTableSkeleton`
- `PatientCardSkeleton`
- `PatientRecordSkeleton`
- `AddPatientStepperSkeleton`
- `PatientModuleErrorState`
- `PatientClinicalWorkspace`
- `PatientClinicalTabs`
- `patientClinicalStorage`
  - Shared patient + clinic scoped storage helper for clinical records.
  - Uses `${prefix}${clinicId}:${patientId}` as the active storage key and supports legacy `${prefix}${patientId}` fallback reads.
- `ProgressNotes`
  - Toolbar, searchable paginated clinical notes table, three-dot row options menu, and custom New/Edit Clinical Progress Note & Treatment Plan modal
  - Clinic-scoped frontend/local-state storage; no backend, Supabase, or database integration yet
- `progressNoteStore`
  - Clinic-scoped progress note persistence and sync event metadata.
  - Drives the linked `Progress Note -> Bills & Payments -> Patient Appointments -> Dental Recalls -> Calendar` chain with `clinicId`.
- `PatientModuleScaffold`
  - Shared toolbar, search, export, create/edit modal, row action menu, status badge, and 5-record pagination pattern for patient clinical modules
  - Upload / Xrays variant adds widened modal layout, drag/drop upload card, inline preview card, full-image lightbox preview with zoom, and edit-safe local preview restoration
- `Prescriptions`
- `BillsPayments`
  - Custom billing workspace with pay-bill action, payment history, proof upload, and live service/payment summary calculations
  - Uses patient + clinic scoped billing keys and balance updates constrained to matching `patientId + clinicId`
- `UploadXrays`
  - Includes frontend PNG/JPG/JPEG/MP4 local file selection, inline image/video preview, full-image preview modal, and long-filename truncation in both the modal and table surfaces
- `DentalRecalls`
  - Clinic-scoped dental recall persistence for manually added recalls and progress-note-linked recall entries
- `AppointmentsModule`
  - Routed patient follow-up workspace that remains available for recall-driven entries, even though the sidebar tab is now hidden
  - Linked recall entries are part of the current `Progress Note -> Bills & Payments -> Patient Appointments -> Dental Recalls -> Calendar` flow
  - Patient appointment storage is scoped by active `clinicId`
- `ScratchpadNotes`
- `FollowupLists`
- `PatientFormsWorkspace`
- `contractFormStore`
  - Contract Form storage resolves scoped keys with legacy fallback for older patient-only data
- `patientDocumentData`
- `patientClinicalTypes`
- `patientClinical.mock`
- `DentalChart`
  - Inline Surfaces editing mode
  - Charting w/ Multiple Selection mode
- `ToothMap`
- `ToothRow`
- `Tooth`
- `ToothConditionPanel`
- `DentalLegend`
- `DentalTooth`
- `DentalProcedureTagBox`
- `DentalOdontogramTooth`
- `dentalChartStore`
  - Dental chart single-record and chart-history list storage are scoped by patient + clinic, with default-clinic seed compatibility
- `odontogramGeometry`
- `dentalChartTypes`
- `TreatmentRecord`
- `TreatmentList`
- `TreatmentCard`
- `TreatmentForm`
- `TreatmentDetails`
- `treatmentTypes`
- `treatmentFormatters`
- `CertificateManager`
  - Uses patient + clinic scoped certificate storage so documents created in one branch do not appear in sibling branches
- `CertificateList`
- `CertificateCard`
- `CertificateForm`
- `CertificatePreview`
- `certificateTypes`
  - Legacy certificate CRUD structures remain retained for possible future certificate-history work; the active tab uses `PatientFormsWorkspace` instead.
- `PatientDocuments`
- `DocumentSelector`
- `DocumentPreview`
- `DocumentHistory`
- `documentTypes`
- `documents.mock`
- `PDFDesignerPage`
- `ConfigurableDocumentHeader`
- `PatientRecordPrintForm`
- `DentalChartPrintForm`
- `TreatmentRecordPrintForm`
- `CertificatePrintForm`
- `ConsentPrintForm`
- `ContractPrintForm`
- `modifyPdfSettings`
- `getPrintablePages`
- `billPaymentStore`
  - Patient + clinic scoped billing/payment storage and proof metadata adapter for the Bills & Payments workspace
  - Removes linked progress-note bills and updates patient balances only within the matching clinic partition
- `scheduleStorage`
  - Clinic-scoped local scheduling storage for calendar items
  - Includes linked-record removal helpers used by calendar agenda delete flows so cancelled/deleted recall appointments can be removed from patient and calendar views consistently
  - Progress-note calendar recall sync/count/delete is constrained to the active clinic schedule partition
- `TemplateList`
- `TemplateEditor`
- `DocumentPreview`
- `BrandingSettings`
- `SectionManager`
- `templateTypes`

## Clinic Subsystem Dashboard Components

- `ClinicDashboardHeader`
- `ClinicMetricCard`
- `ClinicAppointmentOverview`
- `ClinicAppointmentItem`
- `ClinicActivityFeed`
- `ClinicActivityItem`
- `ClinicQuickActions`
- `ClinicStatusCard`
- `ClinicDashboardSkeleton`
- `ClinicDashboardEmptyState`
- `ClinicDashboardErrorState`

## Clinic Owner Settings & Reports Components

- `GeneralSettingsPage` (Enterprise 6-Tab Settings Suite)
- `clinicOwnerSettingsStore`
- `DentistStaffDailyLedger` (Clinical Production Ledger vs. Staff Attendance)
- `CashDrawerReconciliationCard` (End-of-Day Petty Cash Reconciliation)
- `DailyLabDispatchCard` (Dental Lab Dispatch Tracker)
- `MultiBranchRevenueLeaderboard` (500px Compact Container)
- `AgingReceivablesFeed` (500px Compact Container)
- `tenantScope`
  - Subscriber/tenant isolation utility for Clinic Owner modules.
  - Normalizes primary subscriber aliases (`SUB-000001`, `SUB-396924`, `sub_001`) and exposes `subscriberIdMatches` / `scopeRecordsBySubscriber`.
- `ClinicOwnerDashboardPage`
  - Resolves the logged-in clinic owner to a subscriber context.
  - Aggregates branches, patients, staff, dentists, laboratories, financials, and activity only for that subscriber.
- `ActivityFeed`
  - Subscriber-scoped activity stream using scoped patient financials and scoped laboratories.
  - Resolves branch labels from subscriber-owned clinic records so timeline details stay tenant-safe and no longer hardcode a clinic name.
- `StaffManagementPage`, `StaffFormPage`, `StaffStepper`
  - Subscriber-scoped staff listing, quota counts, form access, clinic choices, and laboratory choices.
- `AssociateDentistsPage`, `AssociateDentistFormPage`, `AssociateDentistStepper`
  - Subscriber-scoped dentist listing, quota counts, form access, clinic choices, and laboratory choices.
- `mockSalesOverviewService`, `mockClinicAnalyticsService`, `mockDailyReportsService`
  - Clinic Owner reports/analytics services that derive branch, patient, lab, staff, dentist, and financial data from the active subscriber context.

## Platform Owner Components

- `App.tsx` Login / Authentication Shell
  - Owns email/password sign-in validation, demo persona quick-fill, forgot-password UI, toast feedback, email-only clinic-owner account status lookup, and first-login temporary password change routing.
  - Email-only lookup checks registrations, subscribers, and platform owner users, displays a custom inline status card, copies temporary passwords for approved accounts, and writes `auth.email_status_check` audit events.
  - `/clinic/change-password` renders the clinic-owner first-login password reset screen, validates temporary/current password plus new password rules, logs `auth.password_change`, and routes to `/clinic/dashboard` after success.
- `PlatformDashboardPage` (Control Center with Hero KPIs, Segmented Health Breakdown, Action Center, and Live Feed)
- `App.tsx` Platform approval handlers (`handleApprovePayment`, `handleRejectPayment`)
  - Uses centralized payment approval/rejection only for registration payment review.
  - Displays approval success modal from synced registration/subscriber state.
- `mockPaymentService`
  - Owns registration payment approval idempotency and provisioning repair.
  - `approveRegistrationPayment(registrationId)` routes pending and already verified payments through the same repair-safe flow.
- `mockPlatformManagementService`
  - Owns subscriber creation/upsert from approved registrations.
  - Upserts platform clinic-owner users and auth login records by owner email.
  - Back-syncs registration status, temp password, `subscriberId`, and `userId`.
  - `completePasswordChangeByEmail(email)` clears `mustChangePassword/resetRequired`, updates `lastLoginAt`, and synchronizes auth status after successful first-login password changes.
  - `generateSecureTemporaryPassword()` dynamically provisions single-source-of-truth temporary credentials into registrations, user profiles, and `pnj_mock_users` auth credential storage. Account deletions permanently revoke auth records.
- `SubscribersPage` & `SubscriberDetailsPage` (Standardized 16px Hero Cards, 500px Compact Table, Direct-Anchored 3-Dots Dropdown)
- `UsersPage` & `UserDetailsPage` (Standardized 16px Hero Cards, 500px Compact Table, Direct-Anchored 3-Dots Dropdown)
- `PlansPage`, `PlanDetailsPage`, & `PlanFormPage` (Standardized 16px Hero Cards, 500px Compact Table, Direct-Anchored 3-Dots Dropdown, Permanent Deletion)
- `SubscriptionsPage`, `SubscriptionDetailsPage`, & `SubscriptionFormPage` (Standardized 16px Hero Cards, 500px Compact Table, Direct-Anchored 3-Dots Dropdown, Permanent Deletion)
- `PaymentsPage`, `PaymentDetailsPage`, & `PaymentFormPage` (Standardized 16px Hero Cards, 500px Compact Table, Direct-Anchored 3-Dots Dropdown, Official Receipt Modal, Permanent Purge)
- `ClinicsPage`, `ClinicDetailsPage`, & `ClinicFormPage` (Standardized 16px Hero Cards, 500px Compact Table, Direct-Anchored 3-Dots Dropdown, Permanent Deletion)
- `LaboratoriesPage`, `LaboratoryDetailsPage`, & `LaboratoryFormPage` (Standardized 16px Hero Cards, 500px Compact Table, Direct-Anchored 3-Dots Dropdown, Permanent Deletion)
- `DonutPieChart` (Interactive SVG Donut/Pie Chart with Arc Slices, Center Metrics, and Hover Legend)
- `VerticalColumnChart` (Vertical Dual-Bar Column Chart with Guidelines and Value Tooltips)
- `HorizontalBarChart` (Ranked Leaderboard Progress Tracks with Badges and Percentages)
- `HistogramAreaChart` (Hourly Traffic Step Histogram with Peak Volume Badges)
- `RowActionMenu`, `PlanActionMenu`, `SubscriptionActionMenu`, `PaymentActionMenu`, `ClinicActionMenu`, `LaboratoryActionMenu` (Direct-Anchored Sleek White Card Popup Menus)
- `AnalyticsReportsPage` (Executive Intelligence Suite with 5 Portfolios and Reusable SVG Chart Engine)
- `AnnouncementsPage`, `AnnouncementDetailsPage`, `AnnouncementFormPage`, `AnnouncementForm`, & `GlobalAnnouncementBanner` (Full Broadcast Lifecycle, 1-Click Presets, Live Audience Inspector, Visual Engagement Analytics, 500px Compact Recipients Ledger, Top Ribbon Banners, and Mandatory Acknowledgement Modals)
- `AuditLogsPage`, `AuditDetailsPage`, `AuditCorrelationPage`, & `AuditIntegrityPage`
- `DataRestorePage`
- `NotificationsPage` & `NotificationDetailsPage`
- `PlatformSettingsPage` (2-Button Header, 4 Hero KPIs, Protocol Ribbon, 8 Category Tabs, Donut & Bar SVG Visual Analytics, 500px Feature Flags Table, 500px Change History Ledger, Diff Inspector Modal, JSON Snapshot Modal, Import Settings Modal, and Reset Dialog)
- `mockPlatformSettingsService` (LocalStorage Persistence, Sensitive Data Redaction, Schema Validation, Change History Tracking, Audit Event Logging, and `PLATFORM_SETTINGS_CHANGED` Window Dispatch)
## Platform Registration Cleanup

- `mockPlatformManagementService.ts`: versioned targeted cleanup for `REG-2026-000002` during platform store initialization.

## August 26, 2026 Data Integrity Updates
- `AssociateDentistStepper` and `StaffStepper`: real-only laboratory options.
- Associate/staff services: stale laboratory assignment normalization and tenant-safe branch linkage.
- `ClinicOwnerDashboardPage` and `mockSalesOverviewService`: all-branch aggregation with clinic-specific financial breakdowns.
- `patientDirectoryStore` and `scheduleStorage`: reject unscoped records instead of assigning a default clinic.
- Sales/analytics services: resolve all subscriber branches for owner and subsystem contexts.
- `multiClinicDataIntegrity.test.ts`: automated branch balance, tenant isolation, laboratory-default, and associate-numbering contract tests.
- Verification status: 2/2 targeted contract tests passing.

## August 26, 2026 Staff/Associate Workspace Audit
- `StaffManagementPage`, `StaffFormPage`, and `StaffStepper`: owner-side staff record workflow located; auth account provisioning remains pending.
- `AssociateDentistsPage`, `AssociateDentistFormPage`, and `AssociateDentistStepper`: owner-side associate workflow located; auth account provisioning remains pending.
- `mockStaffService` and `mockAssociateDentistService`: persist domain records with email, subscriber, clinic, permission, and schedule fields.
- `ClinicOwnerSidebar`: owner-only navigation; requires role-aware replacement/selection for Staff and Associate sessions.
- `ClinicWorkspaceLayout` and `ClinicSubsystemSidebar`: reusable branch workspace shell; assigned-clinic authorization integration remains pending.
- Phase 1 status: audit complete; no implementation changes made to production code in this phase.

## August 26, 2026 Staff/Associate Provisioning
- `roleAccountProvisioningService`: shared role-aware auth record provisioning and clinic-ID resolution.
- `StaffFormPage`: provisions/synchronizes Staff auth accounts after active saves and rolls back failed creates.
- `AssociateDentistFormPage`: provisions/synchronizes Associate auth accounts after active saves and rolls back failed creates.
- Phase 2 status: provisioning complete; dedicated workspaces and routing remain pending.

## August 26, 2026 Role Workspaces
- `RoleWorkspacePage`: Staff/Associate landing workspace with assigned clinic cards and account status summary.
- `ClinicWorkspaceLayout`: accepts role context for branch workspace navigation.
- `ClinicSubsystemSidebar`: role-aware menu removes Staff Settings/Master Files and Associate Settings.
- `App.tsx`: role-based login/refresh routing and assigned clinic/module URL guards.
- Phase 3 status: implemented; granular permission guards remain pending.

## August 26, 2026 Permission Enforcement Foundation
- `roleAccountProvisioningService`: persists configured privileges into auth records.
- `ClinicWorkspaceLayout` and `ClinicSubsystemSidebar`: receive permission context.
- `App.tsx`: carries privileges into sessions and blocks Associate Calendar when disabled.
- Phase 4 status: foundation implemented; action-level module guards remain pending.

## August 26, 2026 Live Workspace Profile Sync
- `RoleWorkspacePage`: resolves linked Staff/Associate records from live domain services and renders status/role/assignment summaries.
- Phase 5 status: live workspace identity sync implemented.

## August 26, 2026 Assigned-Clinic Schedule Sync
- `RoleWorkspacePage`: date-based My Schedule panel sourced from branch-scoped schedule storage.
- Phase 6 status: assigned-clinic schedule synchronization implemented.

## August 26, 2026 Branch Patient Sync and Guards
- `PatientsPage`: accepts role mutation permissions while retaining clinic-scoped live records.
- `PatientTable`, `PatientTableRow`, `PatientGrid`, and `PatientCard`: support optional edit/delete actions.
- `App.tsx`: maps authenticated role privileges to patient actions.
- Phase 7 status: branch patient synchronization and basic mutation guards implemented.

## August 26, 2026 Appointment Permissions
- `CalendarPage`: accepts `canManageAppointments` and guards New Appointment/Events actions.
- `App.tsx`: maps Associate `viewAppointments` privilege into the branch Calendar.
- Phase 8 status: appointment permission guard implemented; clean-state browser E2E remains manual.

## August 26, 2026 Final Role Flow Verification
- `App.tsx`: role-aware first-login password completion redirects.
- Phase 9 status: implementation complete; multi-clinic contract 2/2 passing, legacy tenant fixture and manual clean-state browser E2E remain pending.

## August 26, 2026 Platform Payments
- `PaymentActionMenu.tsx`: pending-state compatibility includes canonical `status` values `pending_verification` and `submitted`.
- `PaymentsPage.tsx`: existing approval callback remains the source of truth for payment approval/provisioning.
- Verification: production build passes; one legacy PaymentsPage test assertion remains stale.

## August 26, 2026 Registration Approval Safety
- `mockPlatformManagementService.ts`: removed the email-specific destructive purge that ran during `ensureSeedData`.
- Approval reads are now non-destructive and preserve registration-linked records through provisioning.
- Verification: production build passes; manual disposable-account E2E remains recommended.

## August 26, 2026 Personnel Login
- `mockStaffService.ts`: persists Staff create/update password values.
- `mockAssociateDentistService.ts`: persists Associate Dentist create/update password values.
- `roleAccountProvisioningService.ts`: provisions the shared role auth record using the entered credentials and assigned clinics.
- Verification: build passes; multi-clinic integrity test 2/2; manual role-login E2E remains to be run in the browser.

## August 26, 2026 Role-Aware Clinic Workspace
- `ClinicSubsystemNavbar.tsx`: displays the active session role and authenticated identity.
- `ClinicSubsystemSidebar.tsx`: restores Staff-specific clinic navigation modules.
- `ClinicWorkspaceLayout.tsx`: passes role to navbar and announcement context.
- `App.tsx`: redirects personnel exits and blocks owner-console static routes for Associate/Staff.
- Verification: build passes; multi-clinic integrity test 2/2.

## August 26, 2026 Subsystem Navbar Identity
- `ClinicSubsystemNavbar.tsx`: derives role label from `clinic_owner`, `associate`, or `staff`; displays it beside Active above the active clinic name.
- Profile dropdown reuses the same role label to keep navbar identity consistent.

## August 26, 2026 Staff and Associate UI/UX
- `RoleWorkspacePage.tsx`: shared role landing workspace with Staff/Associate variants, live schedules, profile state, and assigned clinic access cards.
- `DashboardPage.tsx`: accepts role-aware dashboard header labels and descriptions.
- `index.css`: role workspace hero, metrics, schedule, profile, clinic cards, status, empty states, and responsive rules.
- Validation: build passes; multi-clinic integrity 2/2; legacy seeded-fixture tests remain separate cleanup work.
## August 26, 2026 Role Console Shell
- `src/features/clinic-subsystem/components/RoleConsoleLayout.tsx`: full Staff/Associate landing shell.
- `src/features/clinic-subsystem/components/RoleConsoleSidebar.tsx`: role-specific landing navigation with mobile/collapsed behavior.
- `src/features/clinic-owner/components/ClinicOwnerHeader.tsx`: optional role label in profile identity.
- `src/App.tsx`: mounts role workspaces inside the shell while retaining guards and branch navigation.
## August 26, 2026 Role Navbar Identity Polish
- `ClinicOwnerHeader.tsx`: renders role-first and clinic-second console context.
## August 26, 2026 Role Workspace Tabs
- `RoleConsoleSidebar.tsx`: hash-backed role workspace tab navigation and active state.
- `RoleWorkspacePage.tsx`: focused section rendering for Dashboard, Clinics, Schedule, Profile, and Associate Clinical Work.
- `App.tsx`: preserves hash route state while retaining role guards.
## August 26, 2026 Role Workspace Polish
- `ClinicOwnerHeader.tsx`: role-aware navbar decorations, refresh, and notification dropdown.
- `RoleWorkspacePage.tsx`: safe editable profile form for linked Staff/Associate records.
- `roleAccountProvisioningService.ts`: linked-record auth synchronization for email updates.
- `index.css`: role workspace spacing and profile form layout.
## August 26, 2026 Role Tab Header Spacing
- `index.css`: applies consistent top spacing to the role workspace content grid.
