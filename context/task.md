# Current Active Contract - August 25, 2026

## Supabase Local Validation - August 26, 2026

- [x] Start and validate the Docker-backed local Supabase stack.
- [x] Apply both seed-free local migrations and verify migration history.
- [x] Run local schema lint and security advisors with no remaining findings.
- [x] Restrict public registration so anonymous users cannot set payment, approval, review, or provisioning state.
- [ ] Create/link a dedicated cloud Supabase development project.
- [ ] Add role-scoped RLS integration tests and migrate one scoped repository at a time from localStorage.

## Supabase Development Project Link - August 26, 2026

- [x] Link dedicated cloud development project `cuatwirdydarxvqqqoem` without committing credentials.
- [x] Dry-run and push the three reviewed seed-free migrations with no seed data.
- [x] Verify local/remote migration parity, remote lint, and remote security advisors.
- [x] Revoke public execution of the cloud automatic-RLS helper.
- [ ] Implement Auth/provisioning server workflows and role-scoped integration tests.
- [ ] Migrate the first live tenant-and-branch-scoped repository from localStorage.

## Supabase Phase 2 Core Schema - August 26, 2026

- [x] Create the first migration through the Supabase CLI, with no seeded business data.
- [x] Define subscriber/clinic composite foreign keys for all core branch operations.
- [x] Add a fail-closed browser client boundary and mandatory query scope helper.
- [x] Enable foundation RLS policies for all created tables.
- [x] Apply and validate this migration locally through Docker; create/link the cloud development project next.
- [ ] Add and run Auth/RLS policy tests for platform admin, owner, assigned staff, assigned associate, and unassigned users.
- [ ] Add repository adapters and cut over one module at a time after successful policy tests.
- [x] Resolve the production dependency audit finding; `npm audit --omit=dev` reports zero vulnerabilities.

## Supabase Phase 2 Local Bootstrap - August 26, 2026

- [x] Initialize local `supabase/` CLI configuration and ignore generated CLI metadata.
- [x] Preserve secure-by-default API exposure settings for future tables.
- [ ] Create and link a dedicated Supabase development project; do not use production credentials or a service-role key in the frontend.
- [x] Create and apply the first SQL migrations locally through Docker; verify cloud RLS with role-scoped test accounts next.

## Supabase Phase 1 Foundation - August 26, 2026

- [x] Push a clean GitHub baseline and tag it as `prototype-baseline`.
- [x] Create `feature/supabase-foundation` for isolated preparation work.
- [x] Add `.env.example`, Node 22 runtime contract, and Supabase schema/RLS/tenant blueprint.
- [ ] Phase 2: Create and link a Supabase development project, then implement the first tested migration.

## Full-System Diagnostic Follow-up - August 26, 2026

- [x] Run repository architecture and deployment readiness audit.
- [x] Re-run production build; `npm run build` exits 0.
- [x] Fix conditional Hooks defect in Platform User Details.
- [ ] Triage failing/stale automated tests and complete role/tenant end-to-end coverage.
- [ ] Implement Supabase schema, Auth, RLS, server workflows, storage, and deployment only as a separately approved production phase.

- **Follow-up Repair - August 26, 2026**
  - Repaired registration visibility gaps across platform onboarding states:
    - Pending registrations now project into `Payments & Receipts` when a real payment ledger row is still missing.
    - Pending registrations now project into `Clinic Owners` as derived pending subscriber rows.
    - Pending registrations now project into `Dental Clinics` as derived pending clinic rows.
    - Clinic owner `Clinic Branches` now recognizes and labels pending branch rows correctly.
    - Payment approval now converts projected pending registration rows into persisted payment records before approval.
    - Retired `sad@gmail.com` cleanup now reruns with broader payment/auth/subscriber cascade removal and clears the stale deleted-blacklist lock for that email.
    - Signup checkout now writes payment submission through one centralized path only.
    - General deleted-blacklist cleanup now purges stale onboarding artifacts across all linked ledgers.
    - Payments KPIs no longer fake old collected/verified values on an empty ledger.
  - Removed the owner-console `Master File Directory` sidebar entry and replaced `/clinic/directory/*` with a return-to-dashboard notice so editable master files stay branch-only.
  - Build verification passed with 0 errors.

- **Current Follow-up - August 26, 2026**
  - Added a platform-owner-only `Stale-Safe Purge` button beside `Prototype Mode` in the navbar.
  - Added `PURGE STALE DATA` confirmation modal and connected it to the targeted cleanup service.
  - Purpose: clear stale/ghost processed ledgers and linked branch traces without deleting the platform admin account, baseline settings, or restore checkpoints.
  - Next verification: run full build and confirm the navbar purge flow is available only on the platform side.

- **Current Batch: Login / Signup Approval Flow Rebuild - Batch 1 (Stage 1-2)**
  - Audited login, registration, payment approval, subscription provisioning, platform user merge, clinic initialization, and laboratory initialization paths.
  - Implemented first cleanup pass:
    - Login no longer auto-creates missing auth users from registration or platform-user fallback records.
    - Deleted subscriber emails remain blocked at sign-in instead of being revived by approved registration fallback.
    - Platform Users now ignore staff/dentist records that lack a valid `subscriberId`, preventing accidental assignment to Angelo Dental Clinic or any primary subscriber.
    - Registration-driven auto laboratory provisioning has been disabled.
  - Next batch should continue with approval-only provisioning: pending signup records flow into Payments & Receipts, payment approval generates the random temporary password and creates subscriber, active subscription, clinic owner, auth user, and approved dental clinic records.

- **Current Batch: Login / Signup Approval Flow Rebuild - Batch 2 (Stage 3-5)**
  - Implemented approval-only provisioning boundary:
    - Subscriber listing is read-only and does not create tenant records.
    - Clinic-owner tenant route resolution is read-only and reports missing provisioning instead of self-healing by creating records.
    - Active Subscriptions shows pending registration/payment submissions as non-persistent display rows.
    - Pending subscription rows use the registered clinic/owner/email and route to Payments & Receipts for approval.
    - Approved provisioning back-links subscriptions to the registration and marks them active/paid.
  - Next batch should verify and polish login status, temporary-password sign-in, first-login password change, and post-approval Clinic Owner visibility.

- **Current Batch: Login / Signup Approval Flow Rebuild - Batch 3 (Stage 6-8)**
  - Implemented temp-password lifecycle and route-isolation cleanup:
    - Login session sync now maps platform user clinic IDs to real clinic/subscriber names before setting `loggedClinicName`.
    - Email-only status checks no longer show `ready` unless a real auth credential exists.
    - Approved-but-unprovisioned records now show setup-incomplete guidance to re-run payment approval.
    - Re-running approval refreshes temp passwords only for first-login accounts and preserves already changed passwords.
    - First-login password completion clears registration temp-password residue.
    - Branch subsystem routes now require the branch to belong to the logged-in subscriber.
    - Tenant scope test expectations were updated to the read-only provisioning model.
  - Build verification passed with 0 errors.

- **Current Batch: Login / Signup Approval Flow Rebuild - Batch 4 (Stage 9-10)**
  - Implemented final cleanup/verification pass:
    - Re-approval no longer resets a changed-password clinic owner back to `mustChangePassword`.
    - Registration `tempPassword` stays blank after first-login password change, even if payment approval repair is run again.
    - Backup/restore accounting now includes the branch workspace and dynamic patient clinical storage keys.
    - Fresh-test reset coverage now sees branch/patient clinical localStorage keys before clearing prototype data.
  - Build verification passed with 0 errors.

- **Platform Owner Control Center & Dashboard Modernization**:
  - `PlatformDashboardPage.tsx` modularized with real-time operational metrics, hero MRR cards (+12.4% trend), structured secondary tabs (Financial, Facilities, Security), ranked Action Center command cards, visual Subscription Tier Distribution bars, searchable Pending Onboarding Reviews table with initials avatars & inline verification triggers, and category-filtered Audit & Activity feed.
- **Platform Owner Subscriber Management & Clean Real Data Persistence**:
  - Cleaned seed and local storage layer (`mockPlatformManagementService.ts`, `mockSubscriptionService.ts`, `mockPaymentService.ts`).
  - Purged all legacy dummy mockups (`SUB-MOCK-*`, `USR-MOCK-*`, `SCP-MOCK-*`, `CLN-MOCK-*`, `PAY-MOCK-*`, `@example.com`).
  - Active clean primary subscriber: **Angelo Mhyr Lagsac** (`gelomhyr@gmail.com` • `Angelo Dental Clinic` • `Max Plan` • `approved` • `active` • `2 branches: Angelo Dental Clinic & Pantua Dental Clinic` • `2026-08-01 to 2027-08-01`).
  - Upgraded [`SubscribersPage.tsx`](file:///e:/Project%20Capstone/Trynew/Dental%20Webiste%20Project/src/features/platformManagement/pages/SubscribersPage.tsx) with hero metrics, search & filters, table/card views, initials avatars, and complete interactive modals (`Change Plan`, `Renew`, `Suspend/Reactivate`, `Reset Password`, `Delete Subscriber Permanently`).
  - Upgraded [`SubscriberDetailsPage.tsx`](file:///e:/Project%20Capstone/Trynew/Dental%20Webiste%20Project/src/features/platformManagement/pages/SubscriberDetailsPage.tsx) with 7-tab facility and financial ledger view, quick command actions, and Delete Subscriber modal.
- **Platform Owner Personnel & Users Management (`/platform/users` & `/platform/users/:id`)**:
  - Clean separation: Clinic owners reside in Subscribers; Users directory strictly shows subscriber-registered Associate Dentists (`associate`) and Auxiliary Staff (`staff`).
  - **Phase 1 Real Data Cleanup Completed**: Purged synthetic mock personnel (`Doc. Maria Santos` and `Ana Bautista`) from `seedUsers` in `mockPlatformManagementService.ts`, ensuring the personnel directory only reflects real accounts created by the subscriber.
  - Interactive platform modals: `Reassign Branch`, `Reset Password`, `Suspend/Reactivate`, and `Delete Permanently`.
  - Comprehensive Personnel Dossier Workspace (`/platform/users/:id`).
- **Platform Owner Subscription Management - Step 1: Plans (`/platform/plans`, `/platform/plans/:id`)**:
  - Upgraded `PlansPage.tsx` with standardized 16px Hero KPI cards (Total Tiers, Active Public, Subscribers Enrolled, Entry Base Tier), 500px compact table layout with tier initials badges (`BA`, `PL`, `MX`), and direct-anchored 3-dots action menu (`PlanActionMenu.tsx`).
  - Realistic production pricing in `mockPlanService.ts`: **Basic** (`₱5,000/mo` • `₱50,000/yr`), **Plus** (`₱8,500/mo` • `₱85,000/yr`), and **Max** (`₱10,000/mo` • `₱100,000/yr`), dynamically synchronized with active subscriber enrollments.
  - Implemented `DELETED_PLANS_KEY` persistent blacklist to guarantee permanent deletion for unused plan tiers.
  - Upgraded `PlanDetailsPage.tsx` with modern hero header, metric cards, and 5-tab dossier view (*Overview & Pricing*, *Features*, *Usage Quotas*, *Enrolled Subscribers*, *Audit History*).
  - **Phase 3 Quota Guards Completed**: Integrated strict real plan tier quota enforcement across `ClinicBranchCreatePage.tsx`, `ClinicLaboratoryFormPage.tsx`, `AssociateDentistFormPage.tsx`, and `StaffFormPage.tsx` (Basic: 1 branch/1 dentist/0 labs/3 staff, Plus: 3 branches/6 dentists/2 labs/20 staff, Max: unlimited). Renders proactive alert banners and blocks submissions when quotas are reached.
- **Platform Owner Subscription Management - Step 2: Subscriptions (`/platform/subscriptions`, `/platform/subscriptions/:id`)**:
  - Upgraded `SubscriptionsPage.tsx` with standardized 16px Hero KPI cards (Total Subscriptions, Active & Operational, Monthly Recurring Rev., Expiring/Attention), 500px compact table container with Avatar badges (`AD`), styled Plan Tier pills (`Max Plan` purple sparkle), countdown validity pills (`342 days remaining`), and direct-anchored 3-dots action menu (`SubscriptionActionMenu.tsx`).
  - Integrated **Permanent Deletion** (`mockSubscriptionService.permanentlyDeleteSubscription`) with `ConfirmationDialog` and persistent `DELETED_SUBSCRIPTIONS_KEY` blacklist to prevent resurrection.
  - **Phase 2 Gatekeeper Screen Completed (`SubscriptionLockedScreen.tsx`)**: Reactive router guard in `App.tsx` immediately blocks access to `/clinic/*` if the subscription is `suspended`, `expired`, or `cancelled`, displaying a modern SaaS lock screen with contract details and GCash renewal remittance submission modal.
  - Interactive lifecycle modals (`SubscriptionActionDialog.tsx`) for `Renew`, `Change Plan`, `Extend Expiration`, `Suspend/Reactivate`, and `Cancel`.
  - Upgraded `SubscriptionDetailsPage.tsx` with modern hero header, 4 metric cards, and 4-tab dossier (*Contract Overview*, *Billing Terms*, *Invoices & Payments*, *Audit History*).
- **Platform Owner Subscription Management - Step 3: Payments (`/platform/payments`, `/platform/payments/:id`)**:
  - Upgraded `PaymentsPage.tsx` with standardized 16px Hero KPI cards (Total Collected `₱7,990.00`, Verified & Cleared `1`, Pending Review `0`, Primary Channel `GCash`), 500px compact table layout with Avatar badges (`AD`), GCash channel pills, reference badges, and direct-anchored 3-dots action menu (`PaymentActionMenu.tsx`).
  - Integrated **Permanent Deletion / Hard Purge** (`mockPaymentService.permanentlyDeletePayment`) with `ConfirmationDialog` and persistent `DELETED_PAYMENTS_KEY` blacklist.
  - **Official Payment Receipt / Proof Modal**: Interactive printable modal featuring official electronic remittance certificate, GCash reference validation seal, and itemized allocation breakdown.
  - Interactive lifecycle modals (`PaymentActionDialog.tsx`) for `Approve`, `Reject`, `Request Information`, `Allocate`, `Refund`, and `Void`.
  - Upgraded `PaymentDetailsPage.tsx` with modern hero header, 4 metric cards, printable receipt trigger, and 3-tab dossier (*Transaction Details*, *Subscription Allocation*, *Audit History*).
- **Platform Owner Facilities Management - Clinics & Laboratories**:
  - Purged all legacy synthetic mockup records (`CLN-MOCK-*`, `LAB-MOCK-*`, `@example.com`).
  - Clinics (`/platform/clinics`): Cleanly manages live branches (`Angelo Dental Clinic` - Main & `Pantua Dental Clinic` - Satellite) with live staffing aggregation, 500px compact table, refined 3-dots dropdown menu anchored directly to trigger button, and Permanent Deletion (`mockClinicService.permanentlyDeleteClinic`) backed by `DELETED_CLINICS_KEY` persistent blacklist.
  - Laboratories (`/platform/laboratories`): Seeded with real production laboratory **`WeSmile Dental Imaging Center & Lab`** (Bacoor, Cavite), connected to all active branches of the primary subscriber with 5 clinical service procedures, turnaround tracking, refined 3-dots dropdown menu, and Permanent Deletion (`mockLaboratoryService.permanentlyDeleteLaboratory`) backed by `DELETED_LABS_KEY` persistent blacklist to prevent re-provisioning from registration records.
  - **Phase 4 Lab Directory Integration Completed**: Connected Clinic Subsystem and Clinic Owner workspaces (`ClinicLaboratoriesPage.tsx`, `ClinicLaboratoryStepper.tsx`, `AssociateDentistStepper.tsx`, `StaffStepper.tsx`) directly to `mockLaboratoryService.ts` for dynamic authorized lab assignments and procedure turnarounds.
- **Unified 3-Dots Action Dropdown Menu Positioning & Standardized KPI Cards**:
  - **Fixed 3-Dots Action Menu Positioning (`RowActionMenu.tsx`, `overlay.css`)**: Resolved positioning to anchor dynamically on the **LEFT SIDE** of the 3-dots trigger button (`idealLeft = rect.left - menuWidth - 6px`), aligned with the top of the button (`rect.top - 2px`) or bottom (`bottom: window.innerHeight - rect.bottom - 4px` when near the viewport bottom), styled as a compact white card (`width: 220px`, `max-height: 380px`, `overflow-y: auto`, `border-radius: 12px`, `padding: 6px 0`) across all 7 Platform Management directories (Subscribers, Users, Clinics, Laboratories, Plans, Subscriptions, Payments).
  - Top 4 Hero KPI metric cards standardized across all platform directories with matching `16px` border-radius, `1.25rem` padding, `36x36px` icon pills, and `1.75rem` counter typography.
- **Multi-Branch Clinic Subsystem Data Isolation & Storage Partitioning**:
  - `clinicId` is the partition key across subsystem data stores (`patientDirectoryStore.ts`, `scheduleStorage.ts`, `branchSettingsStore.ts`) and patient clinical storage (`patientClinicalStorage.ts`).
  - Entering a branch workspace (e.g. Angelo Dental Clinic `CLN-SUB-396924` vs. Pantua Dental Clinic `CLN-1787478722569-296`) isolates patients, appointments, waitlists, balances, and settings.
  - Adding or modifying data in one branch never alters or exposes another branch's records.
- **Associate Dentists & Staff Branch Designation**:
  - Dentists and staff records track authorized branches (`clinicIds`, `authorizedClinics`).
  - Appointment dentist pickers, clinical roster ledgers, and Daily Reports only list personnel authorized for that specific branch.
- **Real Subscription & Resource Quotas Synchronization**:
  - Clinic Console Settings (`/clinic/settings` -> Subscription & Quotas) dynamically reflects the active subscription plan tier (`Max Plan` / `Max Subscription`), actual counts of registered branches, active dentists, and active staff accounts with matching monthly invoice generation.
- **Clinical Dental Charting & Triple Notation Persistence**:
  - Supports FDI Two-Digit (11–48), Universal ADA (1–32), and Palmer Notation with quadrant symbols (`┘`, `└`, `┐`, `┌`).
  - Persisted in `DentalChartRecord.toothNotation` and dynamically synchronized across Certificates / Documents & Forms / Dental Chart Print Form & PDF exports.
- **Operating Rooms Live Sync**:
  - Subsystem Dashboard reads real-time active dental chairs count from `branchSettingsStore.ts` and syncs on `BRANCH_SETTINGS_UPDATED_EVENT`.
- **500px Compact Tables**:
  - Compact top-aligned rows with 500px table containers and pagination across all 5 core tables.
- **Platform Analytics & Reports Executive Intelligence Suite**:
  - Clean unified navigation button in Platform Sidebar navigating directly to `/platform/analytics-reports`.
  - In-page portfolio switcher for all 5 Executive Portfolios (*1. Executive Overview*, *2. Financial & Revenue*, *3. Multi-Branch Facilities*, *4. Clinical & Patients*, *5. Personnel & System Audits*).
  - 100% Real-Data Reactive Aggregations: Zero synthetic mock data in charts. Real monthly revenue flows from `payments` & `billPaymentStore.ts`, real branch activity from `patientDirectoryStore.ts`, live chair capacity from `branchSettingsStore.ts`, live partner lab catalogs from `mockLaboratoryService.ts`, live tooth notations from patient charts, and real security audit event timelines.
  - Universal CSV & Print PDF Export Suite with 500px compact drilldown data ledgers.
- **System Announcements Module Redesign**:
  - **Phase 1 (Completed)**: 500px Compact Table Layout & Hero KPI Visuals. Integrated 4 top Hero KPI cards (Total Broadcasts, Published & Live, Scheduled Queue, Urgent Alerts), secondary delivery metrics ribbon, 7 segmented status tabs with live count badges (`All`, `Draft`, `Scheduled`, `Published`, `Expired`, `Cancelled`, `Archived`), 500px sticky-header compact table with top-aligned rows, high-contrast priority badges (`urgent`, `high`, `normal`, `low`), read rate engagement meters, left-anchored 3-dots action menu, modern cards view grid, and 3-mode live broadcast preview modal (Desktop Banner, Notification Center Card, Mobile View).
  - **Phase 2 (Completed)**: Announcement Form Overhaul & Quick Broadcast Templates. Integrated 5 1-Click Broadcast Presets (*Scheduled System Maintenance*, *New Feature Release*, *Billing & Subscription Notice*, *Emergency Incident Alert*, *National Holiday Advisory*), segmented form cards (Content & Details, Audience Targeting, Delivery Channels & Scheduling), Live Targeted Audience Resolution Inspector, color-coded priority pills, tag manager, and live interactive broadcast preview modal.
  - **Phase 3 (Completed)**: Interactive Visual Analytics & High-Res Details Suite. Overhauled `AnnouncementDetailsPage.tsx` with Top 5 Hero KPI cards (Target Audience, Delivered, Read Rate %, Acknowledged %, Unread Backlog), 6 detailed tabs (*Overview*, *Content*, *Audience*, *Visual Analytics*, *500px Compact Recipients Ledger*, *Audit History*), interactive SVG Donut Engagement chart, Horizontal Bar reach-by-role chart, and instant CSV data ledger export.
  - **Phase 4 (Completed)**: Global In-App Broadcast Banner & Mandatory Acknowledgement Modal. Integrated `GlobalAnnouncementBanner.tsx` across all system tiers (Platform Admin, Clinic Owner Console, Clinic Subsystem Branches), high-priority pinned banners, and un-closable emergency modal dialog with persistent recipient acknowledgement (`mockAnnouncementService.acknowledgeAnnouncement`).
- **Audit Logs Module Redesign**:
  - **Phase 1 (Completed)**: KPI Visuals, 500px Compact Table Layout & Navigation Overhaul in `AuditLogsPage.tsx`. Integrated 4 Top Hero KPI cards (Total Audit Events, Critical & Security Incidents, Active Actors, Correlation Streams), secondary security metrics ribbon, 6 segmented count tabs (`All`, `Critical`, `Failed & Denied`, `Security & Auth`, `Financial & Billing`, `Clinics & Clinical`), 500px sticky-header compact table with top-aligned rows, high-contrast severity pills (`critical`, `high`, `medium`, `low`, `informational`), result badges (`success`, `denied`, `failure`, `warning`, `partial`), left-anchored 3-dots action menu (`AuditActionMenu`), cards grid view switcher, Raw JSON inspector modal with 1-click copy, and universal CSV/PDF export.
  - **Phase 2 (Completed)**: Real-Data SVG Visual Analytics Suite in `AuditLogsPage.tsx`. Integrated toggleable interactive SVG charts (24-Hour Hourly Event Traffic Histogram with peak traffic indicators, Event Category Breakdown Donut chart with live percentage arcs, and Most Active Actors/Roles Horizontal Bar chart). Pure real-data reactive aggregations with zero synthetic mock data.
  - **Phase 3 (Completed)**: Visual JSON Snapshot Diff, Correlation Stream Flow & Integrity Inspector (`AuditDetailsPage.tsx`, `AuditCorrelationPage.tsx`, `AuditIntegrityPage.tsx`). Built side-by-side Before/After diff viewer with changed-fields badges and copy payload; sequential execution stream diagram with vertical step connectors and 500px table switcher; and visual blockchain-style parent-to-child SHA-256 block hash inspector with live integrity scan and heuristic anomaly detection.
  - **Phase 4 (Completed)**: Global Real-Time Event Dispatch & Cross-Tier Synchronization. Integrated automated audit logging helpers (`logAuthEvent`, `logClinicalEvent`, `logFinancialEvent`, `logAdminEvent`) in `mockAuditService.ts`, live window event dispatch (`AUDIT_LOG_APPENDED`) and storage event reactivity in `AuditLogsPage.tsx` across all 5 system tiers.
- **Data Restore Module Redesign**:
  - **Phase 1 (Completed)**: Header 2-Button Standard, 4 Hero KPIs, Secondary Storage Ribbon, and 500px Compact Table Layout in `DataRestorePage.tsx`. Integrated clean 2-button header (`Restore Backup File` + `Create Backup`), 4 Top Hero KPI cards (Available Snapshots, Storage Footprint, Persisted Records, Last Backup Snapshot), secondary storage protocol ribbon, 5 segmented category tabs (`All`, `Manual`, `Pre-Restore`, `Pre-Reset`, `History`), 500px sticky-header compact table with top-aligned rows, monospace Snapshot IDs with 1-click copy, left-anchored 3-dots action menu (`RowActionMenu`), cards grid switcher, Create Backup modal, and Snapshot Details modal.
  - **Phase 2 (Completed)**: Real-Data SVG Visual Storage Analytics Suite in `DataRestorePage.tsx`. Integrated toggleable interactive SVG charts (Storage Footprint by System Domain Donut chart with live percentage breakdown and centered storage footprint, and Persisted Table Record Leaderboard Horizontal Bar chart with #1, #2, #3 badges and byte sublabels). Toggle button placed cleanly in the table toolbar alongside Print. Pure real-data reactive calculations with zero mockup clutter.
  - **Phase 3 (Completed)**: Interactive JSON File Validator, Pre-Restore Impact Matrix, Conflict Diff Inspector & Safety Confirmation Dialogs in `DataRestorePage.tsx`. Overhauled Restore Modal with interactive drag & drop upload dropzone, live schema/format/digest verification, 3 selectable strategy cards (*Replace Selected Modules*, *Merge & Preserve Existing*, *Merge & Update Matching*), per-module selective restore checkboxes with Select All/Clear All, and high-density Pre-Restore Impact Matrix table (Existing records, Backup records, To Add pills, To Update pills, Integrity/status badges) with auto-checkpoint rollback protection assurance.
  - **Phase 4 (Completed)**: Restore History Ledger, 1-Click Instant Rollback, Safe Reseed Engine & Cross-Platform Storage Reactivity. Built a filterable history toolbar with CSV export and 500px compact table, interactive history row inspector modal (`RestoreHistoryRecord`), 1-click rollback confirmation modal with pre-restore point targeting (`rollbackLatestRestore`), typed prototype reset (`RESET MOCK DATA`), and cross-tier event listener dispatch (`DATA_RESTORE_COMPLETED` & `storage` events).
- **Notifications Module Redesign**:
  - **Phase 1 (Completed)**: Header 2-Button Standard, 4 Hero KPIs, Secondary Notification Engine Ribbon, 500px Compact Table Layout & Left-Anchored 3-Dots Action Menus in `NotificationsPage.tsx`. Integrated clean 2-button header (`Mark All as Read` + `Delivery Preferences`), 4 Top Hero KPI cards (Unread Alerts with status badge, High & Urgent Severity, Total Alert Volume across 12 categories, Broadcast Announcements), secondary notification engine ribbon, 6 segmented category tabs (`All`, `Unread`, `High & Urgent`, `System & Security`, `Announcements`, `Archived`), 500px sticky-header compact table with top-aligned rows, monospace Alert IDs (`NTF-000012`) with 1-click copy, left-anchored 3-dots action menu (`NotificationActionMenu`), bulk multi-select action drawer, cards grid switcher, and 1-click CSV export.
  - **Phase 2 (Completed)**: Real-Data SVG Visual Alert Analytics Suite in `NotificationsPage.tsx`. Integrated toggleable interactive SVG charts (Alert Distribution by Category Donut chart with live percentage arcs, category color coding, and centered `ALERTS` total badge, and Top Alerting Modules Leaderboard Horizontal Bar chart with #1-#6 rank badges and live unread sub-metrics). Toggle button placed cleanly in the table toolbar next to Print. 100% computed from real store records with zero mockup clutter.
  - **Phase 3 (Completed)**: Notification Details Inspector Modal/Page, Source Payload Viewer & Multi-Channel Preferences Matrix (`NotificationDetailsPage.tsx`, `NotificationPreferencesDialog.tsx`). Upgraded details page with 2-button header, summary hero card, metadata context grid, delivery status verification, and formatted JSON payload viewer with 1-click copy. Enhanced preferences matrix with 12 domain categories, 4 delivery channels (In-App, Email, SMS, Push), mandatory security policy locks, quick batch toggles, and reset policy defaults.
  - **Phase 4 (Completed)**: Global Cross-Tier Event Dispatch, Real-Time In-App Bell Synchronization & Full Build Verification (`mockNotificationService.ts`, `NotificationBell.tsx`, `NotificationsPage.tsx`). Configured `NOTIFICATION_STATE_CHANGED_EVENT` window dispatch on all mutations and storage reactivity, real-time unread badge synchronization in the top navigation bell with flyout dropdown, multi-tab sync, and clean build verification with 0 errors.
- **Platform Settings Module Redesign**:
  - **Phase 1 (Completed)**: Header 2-Button Standard, 4 Top Hero KPIs, System Governance Protocol Ribbon, Segmented Category Navigation Tabs & 500px High-Density Sticky-Header Compact Tables (`PlatformSettingsPage.tsx`, `mockPlatformSettingsService.ts`). Integrated native 2-button layout (`Import Settings` outline button on left + `Export Settings` solid blue button on right), top 4 Hero KPI cards (Active System Modules `18 / 18`, Security & Redaction, Restore Snapshots Quota, System Operational Status), secondary system governance protocol ribbon (Prototype mode, Philippine locale en-PH / Asia/Manila, PHP currency, Schema v1-verified), 8 segmented category navigation tabs (`Overview & Health`, `General & Regional`, `Branding & Theme`, `Registration & Subscriptions`, `Payments & Gateways`, `Security & Audit`, `Feature Flags & Maintenance`, `Change History`), 500px sticky-header compact tables with badge indicators, Diff Inspector Modal, JSON Snapshot Modal, and real-time event dispatch (`PLATFORM_SETTINGS_CHANGED_EVENT`).
  - **Phase 2 (Completed)**: Real-Data SVG Visual Analytics Suite in `PlatformSettingsPage.tsx`. Integrated toggleable interactive SVG charts (Feature Flag Status Distribution Donut chart with live percentage arcs, operational color coding, and centered `Active Modules` counter `${enabledFeatures}/${totalFeatures}`, and Configuration Group Governance & Density Horizontal Bar chart with #1-#6 rank badges and live compliance sublabels). Toggle button placed cleanly in the Overview & Health toolbar. 100% computed from real store records with zero mockup clutter.
  - **Phase 3 (Completed)**: Deep Configuration Panels, Validation Safeguards & Real-Time Sync (`PlatformSettingsPage.tsx`). Enhanced all 6 configuration panels (`General & Regional`, `Branding & Theme`, `Registration & Subscriptions`, `Payments & Gateways`, `Security & Audit`, `Feature Flags & Maintenance`) with input format checking & boundary rules (Session timeout `5-480m`, Restore points `1-20`, Warning windows `1-90d`), preset palette pickers & live interactive brand shell visualizer, interactive payment gateway toggle chips with BSP compliance notices, and module search toolbar with `Enable All Operational` batch toggles and route exceptions editor. Verified with 0 errors in 1.11s.
  - **Phase 4 (Completed)**: Settings Change History Ledger, Side-by-Side Diff Inspector Modal, JSON Snapshot Import/Export & End-to-End Verification (`PlatformSettingsPage.tsx`). Upgraded history ledger with real-time text search and domain filter dropdown (`General`, `Regional`, `Branding`, `Registration`, `Subscriptions`, `Payments`, `Security`, `Audit Data`, `Features`, `Maintenance`), 1-click copy for History IDs with live green check feedback, 1-click CSV ledger export, side-by-side Diff Inspector modal with Before/After code blocks, and enhanced Snapshot & Import modals supporting JSON file uploads and copy. Verified clean build with 0 errors in 950ms.
- **Platform Sidebar Collapsible Dropdown Navigation (Completed)**:
  - Transformed all 5 platform sidebar category sections (`Overview`, `Subscriber Management`, `Facilities Management`, `Subscription Management`, `System`) into collapsible dropdown accordions.
  - Set default state to closed (collapsed) across all 5 sections as requested (`openSections = { overview: false, subscriber_management: false, facilities_management: false, subscription_management: false, system: false }`).
  - Added interactive section header buttons with smooth rotating chevron arrows (`ChevronDown` rotating from -90° closed to 0° open) and hover highlights.
  - Fixed text alignment on `.sidebar-section-header` and `.sidebar-section-title` with `text-align: left`, `flex: 1`, `white-space: nowrap`, and `flex-shrink: 0` on chevrons, resolving the wrapping and center-alignment issue on longer labels like `Subscription Management`.
- **Global Real-Data Synchronization & Mock/Dummy Operational Data Removal - Phase 1 (Completed)**:
  - **Purged Static Announcement Seeds**: Stripped out hardcoded dummy announcements (`ann-seed-1` to `ann-seed-10`) in `mockAnnouncementService.ts`. Filtered legacy seed records so communication centers strictly display genuine platform admin broadcasts and event notifications.
  - **Purged Static Audit Log Seeds**: Removed artificial seed events (`seed-audit-started`, `seed-integrity-review`, `seed-access-denied`, `seed-critical-data-quality`) in `mockAuditService.ts`. Audit logs are now 100% event-driven from real user, clinical, financial, and administrative actions.
  - **Purged Static Notification Seeds**: Removed hardcoded seed alerts (`seed-payment-verification`, `seed-data-quality`, `seed-security`) in `mockNotificationService.ts`. System alerts strictly reflect real pending payment verifications, subscription thresholds, and broadcast alerts.
  - **Payment Workflow Event Notifications**: Connected real event triggers in `src/App.tsx` (`handleCompleteDemoPayment`, `handleApprovePayment`, `handleRejectPayment`) emitting genuine audit logs and real-time in-app notifications.
  - **Structured Empty States**: Upgraded `AuditLogsPage.tsx` and `NotificationsPage.tsx` with dedicated empty state illustrations and helpful descriptions in both table and cards grid views.
  - **Build Verification**: Verified clean build (`tsc -b && vite build`) with **0 errors** in 3.52s.

# Current Active Workflow Notes

- Patients workspace current behavior includes:
  - branch-scoped patient directory
  - unified filtering & specific-date picker filtering
  - live patient tag display in the contact block
  - derived remarks badge intent instead of static mock remarks
- Patient profile editing surfaces include:
  - `Quick Update`
  - full `Update Record` stepper
  - editable `Clinical review` modal
- Clinic owner administration uses unified nested-route CRUD across:
  - `Clinic Branches`
  - `Dental Laboratories`
  - `Associate Dentists` (with branch assignment)
  - `Staff Management` (with branch assignment)

---

## Phase 2: End-to-End Workflow Synchronization & Quota Enforcement — August 24, 2026

- [x] **2A** — Added `payment.submitted` audit event in `handleCompleteDemoPayment` (`App.tsx` L1108–1119)
- [x] **2B** — Per-subscriber scoped `currentDentistsCount` in `AssociateDentistFormPage.tsx` and `currentStaffCount` in `StaffFormPage.tsx` — quota banners now show subscriber-specific counts
- [x] **2C** — Eager `branchSettingsStore.getSettings(newBranchId)` call + `branch.settings_initialized` audit event after successful branch creation in `ClinicBranchCreatePage.tsx`
- [x] **2D** — `associate_dentist.created/updated` audit events in `AssociateDentistFormPage.tsx` and `staff.created/updated` audit events in `StaffFormPage.tsx`
- [x] **Build** — `npm run build` → 0 errors in 6.35s
- [x] **Context sync** — `IMPLEMENTATION_STATUS.md`, `MODULES.md`, `ARCHITECTURE.md`, `walkthrough.md`, `task.md` all updated

---

## Phase 3: Cross-Module Verification & Context Synchronization — August 25, 2026

- [x] **G8** — Fixed parallel identity stores by intercepting `mockAuthService.login` to dynamically resolve `mockPlatformManagementService.listUsers()`
- [x] **Role Expansion** — Upgraded `User`, `Session`, and `useState` typings to fully support `associate` and `staff` subsystem accounts
- [x] **Auto-Provisioning** — Dentists and Staff now auto-provision auth records with `MOCK_TEMP_PASSWORD` on their first login attempt
- [x] **Cascading Suspension** — Platform admins suspending a subscriber instantly propagates to deny login for all subsystem personnel
- [x] **Router Fix** — Directed `associate` and `staff` users seamlessly into the `ClinicOwnerLayout` instead of falling through to the Admin UI
- [x] **Build** — `npm run build` → 0 errors
---

## Non-IT & Client-Friendly Terminology Conversion: Phase 1 — August 25, 2026

- [x] **1A — Sidebar & Navigation Overhaul** (`App.tsx`): Converted all developer jargon to clinic business labels (`Clinic Accounts`, `Clinic Owners`, `Clinic Staff & Doctors`, `Dental Clinics`, `Partner Laboratories`, `Subscription Plans`, `Active Subscriptions`, `Payments & Receipts`, `Reports & Analytics`, `Announcements & Notices`, `Activity History`, `Backup & Recovery`, `Alerts & Notifications`, `System Settings`).
- [x] **1B — Platform Dashboard Simplification** (`PlatformDashboardPage.tsx`): Replaced `MRR`, `Pending Verifications`, `Registered Facilities` with `Monthly Plan Revenue`, `Payments Waiting for Review`, `Clinics & Partner Labs`.
- [x] **1C — Accounts, Clinics & Labs Headers**: Converted `SubscribersPage.tsx`, `UsersPage.tsx`, `ClinicsPage.tsx`, `LaboratoriesPage.tsx` headers, breadcrumbs, and metrics to plain English.
- [x] **1D — Plans, Subscriptions & Payments Headers**: Converted `PlansPage.tsx`, `SubscriptionsPage.tsx`, `PaymentsPage.tsx` headers and metrics to non-IT terminology.
- [x] **1E — Analytics, Audit, Backup & Settings Headers**: Converted `AnalyticsReportsPage.tsx`, `AnnouncementsPage.tsx`, `AuditLogsPage.tsx`, `DataRestorePage.tsx`, `NotificationsPage.tsx`, `PlatformSettingsPage.tsx`.

---

## Non-IT & Client-Friendly Terminology Conversion: Phase 2 — August 25, 2026

- [x] **2A — Activity History & Audit Modals**: Converted `AuditDetailsPage.tsx`, `AuditActionMenu.tsx`, `AuditCorrelationPage.tsx`, `AuditIntegrityPage.tsx` (`Raw Audit Payload` $\rightarrow$ `Action Record Details`, `Visual JSON Diff` $\rightarrow$ `Changes Comparison`, `Correlation Stream` $\rightarrow$ `Connected Actions Trail`, `Cryptographic Hash Chain` $\rightarrow$ `Security Verification Stamp`, `SHA-256 Digest` $\rightarrow$ `Security Code`, `Before/After Snapshot` $\rightarrow$ `Original/Updated Values`).
- [x] **2B — Backup & Data Recovery Modals**: Converted `DataRestorePage.tsx` modals (`Restore Backup File` $\rightarrow$ `Restore from Backup File`, `Pre-Restore Impact Matrix` $\rightarrow$ `Recovery Summary Preview`, `Rollback Protection Checkpoint` $\rightarrow$ `Safety Backup Point`, `Replace Selected Modules` $\rightarrow$ `Replace Current Records`, `Merge & Preserve Existing` $\rightarrow$ `Add New Records Only`).
- [x] **2C — Alerts & Notification Inspector**: Converted `NotificationDetailsPage.tsx` & `NotificationActionMenu.tsx` (`Source Event Metadata Payload (JSON)` $\rightarrow$ `Alert Details & Properties`, `Copy Payload JSON` $\rightarrow$ `Copy Details`).
- [x] **2D — Settings Inspection & Diff Modals**: Converted `PlatformSettingsPage.tsx` (`Diff Inspector` $\rightarrow$ `Changes Comparison`, `JSON Snapshot Inspector` $\rightarrow$ `View Settings File Details`, `Import Settings JSON` $\rightarrow$ `Import System Settings`, `Settings Change History Ledger` $\rightarrow$ `Settings Change History`).
- [x] **Build** — `npm run build` → 0 errors

---

## Non-IT & Client-Friendly Terminology Conversion: Phase 3 — August 25, 2026

- [x] **3A — Platform Settings Deep Forms** (`PlatformSettingsPage.tsx`): Converted all setting inputs, helper texts, and toggle descriptions (`Feature Flags & Subsystem Modules` $\rightarrow$ `System Feature Controls & Modules`, `Enable Self-Service Registration` $\rightarrow$ `Enable Online Clinic Registration`, `Require Two-Factor Email Verification` $\rightarrow$ `Require Email Verification Code`, `Session Inactivity Timeout` $\rightarrow$ `Automatic Sign-Out Inactivity Time`, `Max Snapshot Restore Points` $\rightarrow$ `Maximum Saved Backups Kept`, `Platform Maintenance Mode Guard` $\rightarrow$ `System Maintenance Mode`, `Bypass Whitelisted Routes` $\rightarrow$ `Allowed Page Addresses During Maintenance`, `Feature Flags Governance Table` $\rightarrow$ `System Feature Controls`).
- [x] **3B — Clinic Subsystem Settings Workspace** (`SettingsWorkspacePage.tsx`): Replaced all developer "operatory" terms with intuitive "dental chair" labels (`Operating Dental Chairs`, `Add Dental Chair`, `Dental Chair Name`, `Save Dental Chair`).
- [x] **Build** — `npm run build` → 0 errors

---

## Non-IT & Client-Friendly Terminology Conversion: Phase 4 — August 25, 2026

- [x] **4A — Global Sweep & Consistency Audit**: Audited all 14 Platform pages, navigation routers, and Clinic Subsystem workspaces to ensure 100% elimination of developer/IT jargon.
- [x] **4B — Context Documentation Synchronization**: Synchronized all context markdown files (`IMPLEMENTATION_STATUS.md`, `MODULES.md`, `ARCHITECTURE.md`, `walkthrough.md`, `task.md`, `component_inventory.md`).
- [x] **4C — Build Verification**: Ran `npm run build` (`tsc -b && vite build`) and achieved **0 errors**.

---

## Login & Registration Redesign: Phase 1 — August 25, 2026

- [x] **1A — Modern Dual-Panel Healthcare Hero Showcase**: Replaced IT jargon with clinical practice value highlights (Dental Charting, Multi-Branch, EOD Balancing, Data Safety).
- [x] **1B — Quick Demo Persona Switcher**: Added 1-click pill buttons for **Platform Admin** and **Clinic Owner (Angelo)** for instant credential fill.
- [x] **1C — Caps Lock & Password Visibility**: Added Caps Lock warning alert and password toggle.
- [x] **1D — Interactive Forgot Password Modal**: Added reset popup with temporary access password copy (`Temp-PjD-8241!`).
- [x] **1E — 100% Core Logic Preserved**: Preserved all underlying auth services, validation flows, and storage keys.
- [x] **Build** — `npm run build` → 0 errors

---

## Login & Registration Redesign: Phase 2 — August 25, 2026

- [x] **2A — Ribbon Stepper Progress Tracker**: Modern 6-step numbered progress bar with step status badges and brand styling.
- [x] **2B — Step 1 Plan Selection**: Added Monthly/Yearly toggle with 15% discount badge, "⭐ Most Popular" tag, and feature checks.
- [x] **2C — Step 2 Owner Account Info**: Responsive 2-column layout with inline validation errors and styled legal compliance checkboxes.
- [x] **2D — Step 3 Clinic Details & Capacity**: Clean facility forms, 3-column personnel counters (Dentists, Staff, Locations), and Lab Partnership toggle.
- [x] **2E — 100% Core Logic Preserved**: Preserved all validation rules, storage keys, and downstream registration state.
- [x] **Build** — `npm run build` → 0 errors

---

## Login & Registration Redesign: Phase 3 — August 25, 2026

- [x] **3A — Step 4 Order Summary Invoice**: Complete Order Summary with Net Total, VAT, Owner/Clinic summary matrix, and legal accuracy confirmation checkbox.
- [x] **3B — Step 5 Email OTP Verification**: 6-digit individual input box grid, active countdown timer with expired alert, and 1-click test auto-fill helper (`123456`).
- [x] **3C — Step 6 Payment Submission**: Payment method selector cards (GCash, Maya, Bank Transfer, Demo Bypass), receiving account display, and reference input.
- [x] **3D — 100% Core Logic Preserved**: Preserved all registration submission handlers, OTP verification logic, and mock service calls.
- [x] **Build** — `npm run build` → 0 errors

---

## Login & Registration Redesign: Phase 4 — August 25, 2026

- [x] **4A — 3-Phase Status Tracker Stepper (`/register/status/:id`)**: Real-time auditing lifecycle stepper (`1. Submitted` ➔ `2. Audit Review` ➔ `3. Active Clinic`), registration reference card, and live status refresher.
- [x] **4B — Account Provisioned Success Screen (`/register/success`)**: Celebration badge, 1-click **Copy Temporary Password** (`Temp-PjD-8241!`), security notice, and direct "Proceed to Sign In" navigation.
- [x] **4C — 100% Core Logic Preserved**: Maintained 100% data model compatibility, approval event sync, and storage persistence.
- [x] **4D — Build Verification**: Ran `npm run build` (`tsc -b && vite build`) and verified **0 errors**.

---

## Registration-to-Workspace Live Data Sync & Display Fix — August 25, 2026

- [x] **Global Approval Popup Modal**: Implemented confirmation modal on payment/registration approval showing clinic name, owner details, plan tier, temporary password, copy actions, and profile link.
- [x] **Subscriber Credentials & Temp Password**: Added dedicated Access Credentials & Temporary Password cards in both Subscription tab (under Active Plan Terms) and Overview tab (Primary Owner Details) with 1-click copy buttons in `SubscriberDetailsPage.tsx`.
- [x] **Reset Password Modal Upgrade**: Enhanced reset password modal to show current temporary password with 1-click copy.
- [x] **Disnuta Clinic & All Subscribers Linked**: Seamless dynamic lookup linking registrations, subscriptions, and temporary passwords (`Temp-PjD-8241!`).
- [x] **Build Verification**: `npm run build` → 0 errors (4.63s).
## Registration Approval Provisioning Fix: Phase 2 - August 25, 2026

- [x] **Single Approval Pipeline**: `App.tsx` approval/rejection handlers now use the centralized payment service only, removing duplicate legacy local approval calls.
- [x] **Idempotent Approval Repair**: `mockPaymentService.approveRegistrationPayment` and `approvePayment` can safely retry already verified payments and repair missing subscriber/auth/registration links.
- [x] **Subscriber & Owner Upsert**: `mockPlatformManagementService.createSubscriberFromApprovedRegistration` and owner-user provisioning now update existing users by email or create missing platform/auth records.
- [x] **Registration Back-Sync**: Approved registrations are synced with `paymentStatus: approved`, `registrationStatus: account_ready`, `subscriberId`, `userId`, `tempPassword`, and `updatedDate`.
- [x] **Temporary Password Flow**: Approval success modal reads the repaired registration/subscriber state and continues to expose `Temp-PjD-8241!`.
- [x] **Build Verification**: `npm run build` -> 0 errors.
- [x] **Phase 3 Email-Only Approval Status Check**: `/login` now accepts email-only status checks, resolves registrations/subscribers/platform owner users, displays custom ready/pending/rejected/not-found feedback, supports temp-password copy for ready accounts, and logs `auth.email_status_check`.
- [x] **Phase 4 Temp Password + Change Password Flow**: `/clinic/change-password` now provides a redesigned first-login security screen, validates the temporary password and new password rules, clears `mustChangePassword/resetRequired`, logs `auth.password_change`, and routes the clinic owner to the dashboard after success.
- [x] **Phase 5 Subscriber / Tenant Data Isolation**: Clinic Owner dashboard, activity feed, staff, associate dentists, settings exports, sales overview, analytics, daily reports, and staff/dentist steppers now scope data to the active subscriber. `tenantScope.ts` supports legacy primary subscriber aliases while preventing unrelated subscribers from sharing records.
- [x] **Phase 5 Activity Feed Branch Label Cleanup**: `ActivityFeed.tsx` now derives visible branch labels from subscriber-scoped clinics so activity text no longer hardcodes Angelo Dental Clinic for unrelated owners.
- [x] **Phase 6 Branch / Sub-System Patient Clinical Isolation**: Patient clinical records inside `/clinic/:clinicId/*` now use patient + clinic scoped storage keys. Progress Notes, Bills & Payments, Patient Appointments, Dental Recalls, Dental Chart, Certificates, Contract/Patient Forms, linked calendar recalls, patient delete cleanup, and balance updates are isolated by `clinicId`.
- [x] **Phase 7 Master File Directory Routing Fix**: Owner Master File Directory now stays on `/clinic/directory/*`; branch Master File Directory stays on `/clinic/:clinicId/master-files/*`. Shared master-file components now accept route-base/back-route scope so owner back navigation returns to `/clinic/dashboard` and branch back navigation returns to the active branch dashboard.
- [x] **Phase 8 Verification + Context Sync**: Rechecked Phase 7 routing documentation, synchronized the context set, and verified `npm run build` passes with 0 errors.
- [x] **Clean Fresh State, Auth Password Flow & Strict Isolation Fixes (August 25, 2026)**:
  - [x] **Issue 1 - Complete Removal of Stale & Mock Non-Platform Data**: Purged all mock/seeded non-platform records across all services; preserved platform admin account (`DEFAULT_PLATFORM_OWNER`); guaranteed empty initial state.
  - [x] **Issue 2 - Registration Approval & Single Source of Truth Temp Password**: Dynamic temporary password generation via `generateSecureTemporaryPassword()`; written synchronously across registrations, users, and `pnj_mock_users` auth storage; removed all hardcoded passwords; account deletion cascades to auth credential purge and blacklist.
  - [x] **Issue 3 - Strict Multi-Tenant Isolation**: Removed all tenant fallbacks; strict partition by `subscriberId`, `clinicId`, and user email.
- [x] **End-to-End Registration Approval, Dynamic Temporary Password, & Login Sync (August 25, 2026)**:
  - [x] **Fallback Removal**: Removed all stale fallback references to `'Temp-PjD-8241!'` in `PaymentsPage.tsx`, `PlatformDashboardPage.tsx`, `SubscribersPage.tsx`, and `SubscriberDetailsPage.tsx`.
  - [x] **Auth Users Overwrite**: Updated `createOwnerUserForSubscriber` in `mockPlatformManagementService.ts` to guarantee `passwordHash` in `pnj_mock_users` is updated to the newly generated temporary password upon approval.
  - [x] **Registration Store Persistence**: Fixed `syncRegistrationProvisioning` and `ensureApprovedRegistrationProvisioning` to save dynamic temporary passwords to `pnj_mock_registrations`.
  - [x] **Login Credential Resiliency**: Upgraded `mockAuthService.login` to validate against both `user.passwordHash` and `reg.tempPassword`, syncing them dynamically on first login.
  - [x] **Quick Demo Auto-Fill**: Upgraded the Quick Demo "Clinic Owner" button on `/login` to pick the latest approved registration or platform user credentials dynamically.
  - [x] **Build Verification**: `npm run build` (`tsc -b && vite build`) passed with 0 errors.
- [ ] **Next Phase**: Supabase/RLS tenant enforcement planning and production persistence wiring.
- [x] Remove stale pending Clinic Owners registration `REG-2026-000002` / `sad@gmail.com` and its directly linked local artifacts.

## August 26, 2026 Follow-up
- [x] Removed embedded laboratory placeholders.
- [x] Persisted associate branch IDs and safe numbering.
- [x] Fixed all-authorized-branch financial aggregation and normalized stale lab assignments.
- [x] Build passed with 0 errors.
- [x] Removed silent default-clinic mapping for unscoped patient and schedule records.
- [x] Confirmed browser smoke path reaches login; full two-clinic UI trial remains dependent on creating/approving test tenants in the clean state.
- [x] Added and passed deterministic multi-clinic integrity tests; fixed `DEN-000001` stale-filter collision.
- [x] Final targeted test: 2/2 passed; final production build: 0 errors.

## August 26, 2026 Staff and Associate Workspace Plan
- [x] Phase 1 audit: locate Staff Management and Associate Dentist creation routes/services.
- [x] Phase 1 audit: verify record fields for email, subscriber scope, clinic assignments, permissions, status, and schedule.
- [x] Phase 1 audit: identify missing auth provisioning into `pnj_mock_users`.
- [x] Phase 1 audit: identify incorrect post-login routing to the owner console for staff/associate roles.
- [ ] Phase 2: provision Staff and Associate accounts from owner-created records.
- [ ] Phase 3: add role-aware login routing and dedicated workspaces.
- [ ] Phase 4: enforce assigned-clinic and permission guards.

## Phase 2 Progress
- [x] Added shared Staff/Associate auth provisioning adapter.
- [x] Connected active Staff create/edit saves to auth provisioning.
- [x] Connected active Associate Dentist create/edit saves to auth provisioning.
- [x] Added random temporary password fallback and first-login flag.
- [x] Added duplicate-email and missing-clinic validation with create rollback.
- [ ] Phase 3: route provisioned roles to dedicated workspaces.

## Phase 3 Progress
- [x] Added Staff Workspace route and landing page.
- [x] Added Associate Workspace route and landing page.
- [x] Routed login and refresh guards by role.
- [x] Added assigned-clinic card navigation from persisted clinic IDs.
- [x] Added role-specific subsystem sidebar visibility and direct URL guards.
- [ ] Phase 4: enforce granular privilege permissions inside modules.

## Phase 4 Progress
- [x] Persisted Staff/Associate privilege maps into provisioned auth identities.
- [x] Carried privilege maps into active sessions and branch workspace layout.
- [x] Enforced Associate Calendar visibility and direct URL access.
- [ ] Add action-level guards for patient data, billing, expenses, attachments, certificates, and record mutations.

## Phase 5 Progress
- [x] Added linked Staff/Associate record resolution in role workspaces.
- [x] Added live role/status/assigned-clinic summary values.
- [x] Added missing/inactive linked-record restricted state.
- [ ] Phase 6: synchronize schedules and clinic-specific operational data.

## Phase 6 Progress
- [x] Added date-based My Schedule panel to Staff/Associate workspace.
- [x] Loaded schedule records per assigned `clinicId`.
- [x] Added schedule/storage event refresh handling.
- [x] Preserved strict exclusion of unscoped schedule records.
- [ ] Phase 7: synchronize branch patients/appointments and granular action permissions.

## Phase 7 Progress
- [x] Kept branch Patients data on the shared clinic-scoped patient directory.
- [x] Added Associate patient edit permission guard.
- [x] Added Staff patient delete permission guard.
- [x] Hid unauthorized table/grid actions and guarded handlers.
- [ ] Phase 8: appointment action permissions and end-to-end role verification.

## Phase 8 Progress
- [x] Added Associate appointment/event creation permission guard.
- [x] Hid unauthorized Calendar creation actions.
- [x] Added handler-level warning for unauthorized creation attempts.
- [x] Preserved branch-scoped appointment storage.
- [x] Production build passed with 0 errors.
- [ ] Manual clean-state browser E2E with newly created Staff and Associate accounts.

## Phase 9 Progress
- [x] Fixed role-aware post-password-change redirects.
- [x] Preserved Clinic Owner password-change destination.
- [x] Updated role-neutral password feedback/audit wording.
- [x] Primary multi-clinic integrity contract passed 2/2 and production build verified.
- [ ] Align the legacy `tenantScope.test.ts` fixture with the current clean seed policy.
- [ ] Manual browser E2E requires clean user-created Staff/Associate accounts.

## Platform Payment Approval Fix - August 26, 2026
- [x] Restored visibility of `Approve Payment` for legacy/current pending payment statuses.
- [x] Preserved the existing approval and subscriber provisioning workflow.
- [x] `npm run build` passes with 0 errors.
- [ ] Replace the stale PaymentsPage test heading/fixture expectation and run clean payment approval E2E.

## Registration Approval Ghost-Delete Fix - August 26, 2026
- [x] Removed hardcoded email/registration purge from normal platform reads.
- [x] Preserved approved registrations during refresh and provisioning.
- [x] Verified `npm run build` with 0 errors.
- [ ] Run manual browser regression with a newly created disposable registration.

## Staff and Associate Login Wiring - August 26, 2026
- [x] Persisted Staff stepper password into the Staff record.
- [x] Persisted Associate Dentist stepper password into the Associate record.
- [x] Reused role provisioning for shared auth login and tenant/clinic scope.
- [x] Build passed; multi-clinic integrity test passed 2/2.
- [ ] Manual browser verification with newly created disposable Staff and Associate accounts.

## Role-Aware Clinic Workspace Fix - August 26, 2026
- [x] Updated subsystem navbar role label from hardcoded Clinic Staff to session role.
- [x] Fixed Associate and Staff branch exit destinations.
- [x] Restored Staff clinic sidebar modules.
- [x] Added personnel guard against Clinic Owner static routes.
- [x] Build passed and multi-clinic integrity test passed 2/2.
- [ ] Manual browser verification of both role flows remains recommended.

## Subsystem Navbar Identity - August 26, 2026
- [x] Replaced duplicated clinic-name display with session role plus active clinic name.
- [x] Applied the same role label mapping to the profile dropdown.
- [ ] Manual visual check across Owner, Associate, and Staff sessions.

## Staff and Associate UI/UX Standardization - August 26, 2026
- [x] Rebuilt role landing workspace layout and live-data states.
- [x] Added Staff operations and Associate clinical visual/content variants.
- [x] Added role-aware branch dashboard header copy.
- [x] Added responsive role workspace styling and mobile stacking.
- [x] Build passed; multi-clinic integrity test passed 2/2.
- [ ] Manual browser visual pass at desktop/tablet/mobile widths.
- [ ] Migrate legacy clinic-service tests that still require retired seeded fixtures.
## Role Console Shell - August 26, 2026
- [x] Reused the Clinic Owner visual baseline for Staff and Associate landing pages.
- [x] Added role-aware full console layout and constrained sidebar navigation.
- [x] Preserved existing auth, branch entry, route guards, and live data behavior.
- [x] `npm run build` passes.
- [ ] Manual browser visual pass remains recommended.
## Role Navbar Identity Polish - August 26, 2026
- [x] Role-first identity is visible in the shared console header.
## Role Workspace Tabs - August 26, 2026
- [x] Added active-link state based on selected workspace section.
- [x] Split dashboard, clinic access, schedule, profile, and clinical work content into focused tabs.
- [x] Preserved live role and branch data behavior.
- [x] Build passes.
## Role Workspace Polish - August 26, 2026
- [x] Added header/content spacing.
- [x] Removed personnel duplicate sign-out, Prototype Mode, and subscription decorations.
- [x] Added notification dropdown and retained refresh callback.
- [x] Added safe Staff/Associate profile edit and linked-auth reconciliation.
- [x] Build passes.
## Role Tab Header Spacing - August 26, 2026
- [x] Added consistent hero-to-content spacing for all role workspace tabs.

## Supabase Phase 1: Secure Onboarding Foundation - August 26, 2026
- [x] Added seed-free subscriber, membership, subscription, clinic, payment, and branch-assignment provisioning schema.
- [x] Added and deployed secure registration, payment, approval, password-completion, status, and personnel-provisioning Edge Functions.
- [x] Restricted provisioning RPC execution to `service_role`; no browser caller can run privileged provisioning directly.
- [x] Added the typed browser onboarding adapter without exposing privileged credentials.
- [x] Validated the complete disposable local provisioning flow and reset the local test database afterwards.
- [x] `npm run build` and the tenant/clinic scope test pass.
- [ ] Phase 2: replace each localStorage workflow with a subscriber/clinic-scoped Supabase repository, beginning with auth/onboarding UI and platform payment approval UI.
- [ ] Before production: create a controlled platform-admin bootstrap process, create real subscription plans, configure production `ALLOWED_ORIGIN`, and complete browser E2E against the cloud project.

## Phase 1C Registration Backend Foundation - August 29, 2026
- [x] Add structured Registration staging fields.
- [x] Add protected OTP challenge persistence and OTP request/verify endpoints.
- [x] Add public-safe active plan catalog.
- [x] Add atomic/idempotent payment RPC requiring verified email.
- [x] Bind public status to registration ID plus owner email.
- [x] Focused tests pass (7/7); production build passes.
- [x] Deploy/configure the Phase 1 registration functions and server-side email secrets in the linked development project.
- [x] Cut over the frozen Registration UI through the public Edge Function adapter.

## Phase 1D Development/Test Plan Catalog - August 29, 2026
- [x] Resolve annual pricing and Plus quota conflicts for development/testing.
- [x] Create idempotent Basic/Plus/Max `public.plans` migration with canonical features and limits.
- [x] Retire stale ₱2,990 / ₱4,990 / ₱7,990 development references.
- [x] Apply and verify the plan configuration in the linked development project.
- [x] Cut over the Registration frontend to the deployed plan catalog and public Phase 1 functions.

## Phase 1 Registration Frontend Cutover - August 29, 2026
- [x] Replace Registration runtime plan, submission, OTP, payment, and status mock calls with the deployed public Supabase Edge Function contracts.
- [x] Keep only public-safe session continuation identifiers and remove hardcoded OTP/demo-payment runtime paths.
- [x] Preserve the six-step UI and stop the flow at pending platform payment review.
- [x] Perform controlled browser end-to-end validation against the configured development project, including Gmail OTP and Plus payment staging at `850000` centavos.
- [ ] Platform Admin approval/provisioning and all post-approval modules remain later-phase work.
- [x] **PHASE 1 REGISTRATION = COMPLETE.** The verified boundary remains `pending_review` / `pending_verification`.

## Phase 2C.1 Platform Admin Database Foundation - August 29, 2026
- [x] Add `profiles.display_name` and subscription billing/payment snapshot fields.
- [x] Add one protected provisioning-attempt ledger per registration.
- [x] Add atomic payment review and registration rejection RPCs.
- [x] Add idempotent provisioning claim, failure recording, and revised final provisioning RPCs.
- [x] Preserve structured clinic fields and subscriber-owner clinic access without an owner assignment row.
- [x] Validate migration execution with rollback, `plpgsql_check`, focused contracts (26/26), and production build.
- [ ] Manually push the migration after review.
- [x] Implement authenticated Admin reads, Edge orchestration, and credential delivery locally in Phase 2C.2A/2C.2B.
- [ ] Complete the frozen-UI frontend cutover in a later phase.

## Phase 2C.2A Platform Admin Review API Foundation - August 29, 2026
- [x] Add shared server-side Platform Admin authorization check.
- [x] Add authenticated review queue and review-detail APIs with allowlisted DTOs.
- [x] Add authenticated payment accept/reject and registration-rejection APIs using Phase 2 RPCs.
- [x] Require JWT at function configuration and validate all four functions with Deno checks.
- [x] Run focused contracts (34/34) and production build.
- [ ] Deploy the reviewed migration and functions together only when the next approved deployment step authorizes it.
- [x] Implement Auth/provisioning orchestration locally in Phase 2C.2B.
- [ ] Wire the frozen Platform Admin UI in a later phase.

## Phase 2C.2B Platform Admin Auth and Credential Orchestration - August 29, 2026
- [x] Update the existing approval function to use shared Platform Admin authorization, registration-only input, durable begin-attempt handling, and the Phase 2C.1 four-argument provisioning RPC.
- [x] Implement no-user creation, typed unassigned/assigned identity conflicts, same-failed-attempt identity reuse, completed-state replay, and pre-commit Auth compensation.
- [x] Remove temporary credentials from the Admin response and keep password material out of Postgres, audit metadata, browser state, and logs.
- [x] Generalize the server-only Registration mail adapter while preserving Phase 1 OTP delivery.
- [x] Add post-commit initial credential delivery plus authenticated resend/rotation without tenant reprovisioning.
- [x] Preserve `subscriber_memberships.must_change_password` as the authoritative first-login flag.
- [x] Pass Deno checks for all affected functions, focused contracts (58/58), and the production build.
- [ ] Deploy the Phase 2C.1 migration and all coordinated Phase 2 Edge Functions only in a separately authorized deployment step.
- [ ] Cut over the frozen Platform Admin UI and harden/validate the first-login completion flow in later phases.
- [ ] Phase 2 remains incomplete.

## Phase 2C.2C-A First-Login RLS Access Gate - August 29, 2026
- [x] Audit every tenant RLS policy and both owner/assignment clinic authorization paths.
- [x] Add one historical-migration-safe correction requiring `must_change_password = false` for normal membership-derived access.
- [x] Preserve Platform Admin authorization independently of subscriber membership state.
- [x] Add a no-argument, own-user-only minimal login-state RPC with multiple-active-owner conflict detection.
- [x] Pass a local migration reset, 43 pgTAP RLS assertions, schema lint, security advisors, 66 focused Phase 1/2 contracts, and the production build.
- [ ] Harden `complete-initial-password` in the next explicitly approved backend step.
- [ ] Deploy the coordinated Phase 2 migrations/functions only after separate authorization.
- [ ] Wire login/change-password routing and the frozen Platform Admin UI in later phases.
- [ ] Phase 2 remains incomplete.

## Phase 2C.2C-B Harden `complete-initial-password` - August 30, 2026
- [x] Restrict the request to `{ newPassword }` and derive target identity only from verified claims.
- [x] Require exactly one active Clinic Owner membership and block already-completed replay before Auth rotation.
- [x] Enforce the 12-256 character, letter-and-digit server password policy.
- [x] Update Auth first, then conditionally finalize only the resolved membership and stamp `password_changed_at`.
- [x] Add typed Auth/finalization recovery states and credential-free success/failure audit events.
- [x] Revoke other refresh-token sessions with the supported `others` scope while preserving current-session continuation where supported.
- [x] Pass Deno check, 24 runtime tests, 80 focused contracts, 43 pgTAP RLS assertions, schema lint, security advisors, and the production build.
- [ ] Cut over the frozen Login/Change Password routing and frontend adapter in a later approved phase.
- [ ] Deploy Phase 2 migrations/functions only in a separately authorized coordinated step.
- [ ] Phase 2 remains incomplete.

## Phase 2E.1 Clinic Owner First-Login Frontend Auth Cutover - August 30, 2026
- [x] Replace Clinic Owner runtime sign-in with Supabase Auth and authenticated first-login-state resolution.
- [x] Gate Clinic Owner routes on authoritative `mustChangePassword` and refresh the state after deployed initial-password completion.
- [x] Remove Clinic Owner mock credential comparison, email-only mock account lookup, and local password-change authority from this runtime path.
- [x] Preserve the approved Login and Change Password visual structure; add only safe loading/error handling.
- [x] Add focused frontend/adapter contract coverage and run the production build.
- [ ] Perform the separately controlled real browser validation using the existing provisioned Clinic Owner account.
- [x] Phase 2E.2: cut over Platform Admin frontend data/actions.

## Phase 2E.2 Platform Admin Real-Data Frontend Cutover — Local Implementation Complete - August 30, 2026
- [x] Replace Platform Admin Login authority with authenticated Supabase session plus RLS-backed `platform_admins` verification.
- [x] Use deployed registration review, payment review, and provisioning APIs for Dashboard pending-review approval and refetch authoritative data afterward.
- [x] Add focused source contracts and run the focused suite/build.
- [x] Add a safe, shared-authorized Platform Admin directory/read DTO for all approved cross-tenant views; no migration is required.
- [x] Cut over Dashboard metrics, Subscribers, Users, Clinics, Payments, Subscriptions, Plans, and detail routes without localStorage runtime authority.
- [x] Remove automatic full-directory browser snapshot loading; use Dashboard-only aggregates/reviews plus bounded per-resource page/search/filter requests and exact UUID detail reads.
- [x] Apply Users and Subscriptions search before server pagination/counting and count only active/current subscriber resources where status authority exists.
- [x] Block unsupported mock-only writes and direct mock-backed create/edit routes.
- [x] Pass local Edge Runtime bundling/anonymous rejection, 11 focused files / 79 tests, and `npm run build`.
- [x] Deploy the original `platform-admin-read` to the linked development project and complete the first live browser pass.
- [x] Correct the live-discovered subscriptions zero-row projection, summary navigation-order metrics, owner identity DTOs, and unsupported Platform mock controls locally.
- [x] Redeploy the corrected `platform-admin-read` and complete the second live browser validation with the existing real Platform Administrator account.
- [x] Phase 2E.2 is complete and ready to merge; Phase 2 overall remains incomplete pending later phases.
- [x] Complete the second live browser validation for Platform Admin login, Dashboard, all bounded lists, direct subscriber routing, and logout.
- [x] Patch exact detail DTO coherence locally: authoritative subscriber owner/Plus rate/active clinic/approved paid total, plus cross-resource cache removal across User, Clinic, Payment, Subscription, and Plan details.
- [x] Preserve approved UI and controlled read-only behavior; do not add migrations or expose credentials.
- [x] Redeploy only `platform-admin-read` and run the final direct-refresh detail-page browser validation.
- [x] Close Phase 2E.2 after final detail coherence validation passed.
- [x] Replace Clinic Details' hardcoded unavailable Plan Usage with its exact current-subscription plan summary.
- [x] Make Payment Details' plan, allocation percentage, association count, and association content use one real `source_payment_id` subscription relation.
- [x] Re-audit Plan Details for exact catalog values and aggregate-only enrollment authority.
- [x] Run the absolute final live browser validation; Phase 2E.2 is ready to merge.

## Phase 2E.3A Authenticated Clinic Owner Read Foundation - August 30, 2026
- [x] Derive the Clinic Owner tenant from exactly one authenticated active membership with completed initial-password state.
- [x] Load RLS-scoped subscriber, owner profile, current subscription, plan, tenant clinics, and active resource counts without mock/localStorage fallback.
- [x] Normalize clinic, laboratory, associate, and staff limits from the real plan JSON; preserve unknown values as unavailable.
- [x] Cut over only the Clinic Owner shell identity and remove its Reset Mock Data control without redesigning the approved UI.
- [x] Keep `tenantScope.ts` and deferred owner pages unchanged for 2E.3B-2E.3E.
- [x] Complete live browser validation with the existing provisioned Clinic Owner account: authenticated membership-scoped owner/profile/subscriber/subscription/plan/clinic/resource reads, direct `/clinic/dashboard` refresh, logout clearing, and post-logout protected-route behavior all passed without visible runtime/RLS failure.
- [x] Confirm the real shell displays Angelo Mhyr Lagsac, Angelo Dental Clinic, and Plus, while Reset Mock Data remains absent.
- [x] Record the Phase 2E.3B boundary: legacy Dashboard welcome email text, blank Clinic field, generic Subscription label, counts, branch overview, financial summary, and recent activity remain non-authoritative and deferred.
- **PHASE 2E.3A = COMPLETE / FRONTEND-RLS READ FOUNDATION / LIVE BROWSER VALIDATED / READY FOR CHECKPOINT.** Do not start 2E.3B automatically.

## Phase 2E.3B.1 Dashboard + Branch Directory Read Cutover - August 31, 2026
- [x] Replace Dashboard owner/organization/plan and active clinic/associate/staff authority with the Phase 2E.3A provider.
- [x] Keep Patients, clinical financial totals, and setup progress explicitly unavailable rather than reading browser storage or fabricating zero/completion values.
- [x] Render real provider clinics in Dashboard overview and Branch Directory with real clinic identity, primary/branch state, status, address, contact, email, and creation time.
- [x] Read safe recent activity from subscriber-filtered owner-RLS-visible `audit_events`; render a truthful empty state and no synthetic events.
- [x] Display normalized clinic quota and keep all branch writes plus mock-backed detail/workspace destinations controlled unavailable until Phase 2E.3B.2.
- [x] Remove `tenantScope.ts`, mock platform-user resolution, mock clinic storage, and arbitrary browser tenant authority from these two pages only.
- [x] Remove Prototype Mode from the authenticated Clinic Owner header without redesign.
- [x] Add focused regressions; run the focused Phase 2E set and production build. Leave the unrelated Phase 2C.2A CRLF-sensitive config assertion unchanged.
- [x] Complete live browser validation: real Dashboard identity/usage/branch/audit data, controlled Patient/Financial states, real Branch Directory and `1 / 3` quota, hard refresh, read-only mutation safety, and logout protected-route clearing all passed.
- [x] Confirm no mock clinic rows/persistence or Prototype Mode remain in the authenticated runtime.
- [x] Record the explicit Phase 2E.3B.2 boundary: real branch create/edit/activate/deactivate/delete/set-primary operations and the server-enforced clinic-quota transaction remain unimplemented.
- **PHASE 2E.3B.1 = COMPLETE / REAL-DATA READ CUTOVER / LIVE BROWSER VALIDATED / READY FOR CHECKPOINT.** Do not start Phase 2E.3B.2 automatically.

## Phase 2E.3B.2A Clinic Branch Mutation Backend Contract - August 31, 2026
- [x] Generate one additive migration through the Supabase CLI workflow; reuse the existing clinics, clinic_business_hours, subscription/plan, audit, UUID, and clinic-number schema.
- [x] Add private exact-owner scope resolution and authenticated-only SECURITY DEFINER create/update RPCs with strict input, safe DTO, and stable safe errors.
- [x] Serialize quota-affecting creates on the subscriber row and parse the active plan's `clinics` limit without hardcoded plan quotas or fail-open behavior.
- [x] Make branch, seven-day business-hours, and audit changes atomic; protect current primary identity and defer all lifecycle/primary-switch APIs.
- [x] Remove Clinic Owner direct table-write bypasses while preserving owner reads and legitimate Platform Admin/service-role access.
- [x] Pass focused/full pgTAP database suites, genuine two-connection 2-of-3 concurrency validation, clean shadow migration/schema diff, schema lint/security error gates, production build, and diff checks.
- [x] Confirm migration `20260831011234` is the latest linked-development migration and remotely validate RPC/helper grants, RLS policy behavior, create/update, quota variants, tenant isolation, safe errors, audit authority, authenticated real-owner reads, and zero fixture residue.
- [x] Pass remote schema lint/security error gates; record intentional SECURITY DEFINER advisor warnings and retain local concurrency/rollback proofs where remote injection was skipped for safety.
- [ ] Wire the existing Add/Edit Branch UI in Phase 2E.3B.2B only after remote backend validation.
- **PHASE 2E.3B.2A = BACKEND CONTRACT REMOTELY DEPLOYED / REMOTE CONTRACT VALIDATED / FRONTEND NOT WIRED / READY FOR CHECKPOINT.** Do not mark Phase 2E.3B.2 complete.

## Phase 2E.3B.2B Clinic Owner Add/Edit Branch Frontend Cutover - August 31, 2026

- [x] Replace the targeted Add/Edit/View Branch mock/local workflow with typed adapters for the already deployed authenticated RPC contract.
- [x] Read current branch detail by exact UUID through owner RLS; map all seven UI business-hour days explicitly and submit only the server-approved create/update allowlist.
- [x] Navigate Add/View/Edit through the existing branch routes; preserve the stepper UI; make owner/primary/personnel controls truthful read-only/deferred; remove fake unsaved branch identity and targeted mock side effects.
- [x] Refresh the authoritative Clinic Owner provider after successful active or draft create and after update; leave all lifecycle operations disabled.
- [x] Add focused adapter, stepper, directory, and existing owner-read regressions; run focused tests, production build, and diff check before live validation.
- [ ] Run live browser validation against the already deployed branch RPCs. Do not mark 2E.3B.2 complete until it passes.
- [x] Repair second live-validation blockers: action-menu and side-preview routes use exact row UUIDs; persisted-branch lifecycle controls are visibly disabled; create-form Save Draft remains separate and validated.
- [ ] Perform browser re-validation for primary/testing/draft exact routes, disabled lifecycle controls, `3 / 3` quota, refresh, and logout protection. Zero-hours behavior remains automated-only because no destructive fixture is authorized.
- **PHASE 2E.3B.2B = SECOND LIVE BROWSER VALIDATION BLOCKERS FIXED LOCALLY / LIVE BROWSER RE-VALIDATION REQUIRED.**
