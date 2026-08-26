# Modules

## Supabase Local Validation - August 26, 2026

- The local database now runs the complete seed-free tenant and branch schema plus the restricted public-registration policy.
- The current UI remains intentionally localStorage-backed. A future module cutover must use `src/infrastructure/supabase/client.ts` and an explicit subscriber/clinic scope; no runtime module was silently switched.

## Supabase Development Project Link - August 26, 2026

- The environment is linked to the dedicated cloud development project and its remote schema matches the local migration set.
- Browser configuration uses Git-ignored Vite public values only. Production secrets and all current operational module stores remain outside the browser bundle.

## Supabase Phase 2 Core Schema - August 26, 2026

- Added the future database contract for platform onboarding, clinic owner, branch subsystem, staff, associate, laboratories, patients, appointments, recalls, progress notes, bills, payments, uploads, notifications, and audits.
- Added `src/infrastructure/supabase/client.ts` and `scope.ts` as the only allowed starting point for future Supabase repositories. New adapters must pass an explicit subscriber and clinic scope.
- No current UI module has been switched to Supabase, so existing workflows continue to use their tested prototype stores until RLS-backed adapters are completed.
- Production dependency audit is clean after updating the transitive DOMPurify dependency.

## Supabase Phase 2 Local Bootstrap - August 26, 2026

- `supabase/config.toml` defines the local CLI/API/database development contract and now runs successfully through Docker.
- CLI temporary metadata is excluded through `supabase/.gitignore`.
- Module repositories remain localStorage-backed until their corresponding migrations, RLS policies, and adapters are implemented and verified against a linked development project.

## Supabase Phase 1 Foundation - August 26, 2026

- Added environment and data-layer preparation only. All current modules remain localStorage-backed until their future repository adapters are introduced after database/RLS migration.
- The new foundation blueprint maps platform, subscriber, clinic, staff, associate, patient, clinical, payment, laboratory, notification, and audit modules to database ownership and scope.

## Full-System Diagnostic - August 26, 2026

- Login, registration, platform, clinic owner, branch subsystem, staff, and associate flows are implemented as frontend/localStorage prototype workflows.
- Cross-role and branch-scoped behavior needs backend revalidation before client deployment; localStorage guards are not security boundaries.
- A conditional-hook defect in Platform User Details was fixed during audit. Build is green; lint warnings remain.

## Authentication & Onboarding (`/login`, `/register/*`)

- Login & Account Sign-In (`/login`)
  - Status: Implemented (Modern Sign-In + Email-Only Account Status Check + Batch 3 Auth Cleanup)
  - Scope: Visual non-IT clinic practice highlights (Dental Charting, Multi-Branch Facilities, EOD Balancing, Data Safety), 1-click Quick Demo Persona auto-fill pills (Platform Admin & Clinic Owner Angelo), real-time Caps Lock warning detection, clean password visibility toggle, interactive Forgot Password recovery modal with 1-click temporary password copy, and email-only registration approval lookup. If the user enters only an email, `/login` checks registration/subscriber/owner-user/auth records and shows custom `ready`, `pending`, `rejected`, or `not_found` feedback. Batch 3 requires a real provisioned auth credential before showing `ready`; approved-but-incomplete records now instruct the platform operator to re-run payment approval. Password login reads provisioned auth users only and no longer creates clinic-owner auth rows from registration/platform fallback data.
- Clinic Registration Wizard (`/register/*`)
  - Status: Implemented (6-Step Ribbon Stepper & Checkout Suite)
  - Scope: 6-step numbered progress ribbon:
    * Step 1: Subscription Plan Selection with Monthly/Yearly toggle & 15% discount badge.
    * Step 2: Clinic Owner & Primary Contact account creation with 2-column inputs & legal agreements.
    * Step 3: Dental Clinic details with 3-card capacity counters (Dentists, Staff, Locations) & Lab toggle.
    * Step 4: Review Registration & Order Summary Invoice with VAT breakdown & accuracy declaration.
    * Step 5: Email OTP Verification with 6-digit input box array, active countdown timer & test helper.
    * Step 6: Payment Submission with multi-gateway cards (GCash, Maya, Bank Transfer, Demo Bypass), receiving account display & transaction reference input.
    * August 26, 2026 cleanup: registration payment submission now writes only through the centralized payment pipeline, preventing duplicate legacy payment rows from being created during signup checkout.
- Registration Status Tracker (`/register/status/:id`)
  - Status: Implemented (3-Phase Audit Clearance Tracker)
  - Scope: 3-milestone lifecycle stepper (`1. Submitted` ➔ `2. Audit Review` ➔ `3. Active Clinic`), reference card, and real-time status refresher with direct routing to success screen upon approval.
- Registration Success (`/register/success`)
  - Status: Implemented (Workspace Provisioned & Password Reveal)
  - Scope: Celebration badge, dynamic temporary access password display (`Temp-${code}!`) with 1-click copy helper, first-time sign-in notice, and direct navigation to login.
- Registration Approval Provisioning
  - Status: Implemented (Batch 4 Idempotent Approval-Only Provisioning)
  - Scope: Platform approval now uses a centralized and idempotent pipeline. `centralizedPaymentService.approveRegistrationPayment` calls `mockPaymentService.approveRegistrationPayment`, which repairs already verified payments and delegates subscriber/owner/auth provisioning to `mockPlatformManagementService.createSubscriberFromApprovedRegistration`. Approved registration records are synced to `account_ready` with `subscriberId`, `userId`, and a temporary password only while first-login setup is still required. Reading Subscribers or resolving Clinic Owner routes no longer creates provisioning records.
- Email-Only Account Status Check
  - Status: Implemented (Phase 3 Login Verification)
  - Scope: `/login` now supports approval-status checking with email only. The flow resolves data from registrations, subscribers, and platform users, renders a custom inline status card, copies the synced temporary password when account-ready, and writes an `auth.email_status_check` audit event.

## Platform Management (`/platform/*`)

- Platform Dashboard (`PlatformDashboardPage.tsx`)
  - Status: Implemented (Non-IT Friendly Executive Control Center)
  - Scope: Real-time system health indicator (`🟢 Operational` / `Maintenance: Off`), 4 top-tier summary KPI cards (Monthly Plan Revenue with +12.4% trend, Active Clinic Accounts with tier breakdown, Payments Waiting for Review with pulsing badge, Total Dental Clinics & Partner Labs), 3-tab structured operational ledger (Financial Summary, Clinics & Laboratories, Activity & Safety), ranked Action Center command cards, visual Subscription Tier Distribution bars, searchable Pending Onboarding Reviews table with initials avatars & inline verification triggers, and category-filtered Activity History feed.
- Clinic Accounts (`/platform/subscribers` & `/platform/subscribers/:id`)
  - Status: Implemented (Clinic Owners Directory & Account Workspace)
  - Scope: Cleaned real data persistence (Angelo Mhyr Lagsac, Angelo Dental Clinic, Max Plan, 2 branches), real-time summary KPI metrics banner, multi-view toggle (Table View with initials badges, contact details, plan pills, validity countdown vs. Card Grid), interactive action modals (Change Plan Tier, Renew Validity, Suspend/Reactivate, Reset Owner Password, Permanent Cascade Deletion), and full Clinic Owner Account Workspace (`/platform/subscribers/:id`) with 7-tab facility and financial breakdown. Newly approved registrations are upserted into this ledger and linked to platform/auth owner records instead of relying on fallback display data. Pending registrations now also appear as derived pending clinic-owner rows so the waiting state remains visible before approval. The targeted retired-email cleanup for `sad@gmail.com` now reruns with broader cascade coverage and no longer leaves that email trapped in the deleted blacklist.
- Clinic Staff & Doctors Directory (`/platform/users` & `/platform/users/:id`)
  - Status: Implemented (Personnel Directory & Staff Dossier Workspace)
  - Scope: Dedicated directory of Associate Dentists (`associate`) and Auxiliary Staff (`staff`) strictly separated from clinic owners; multi-branch station assignment indicators (`Angelo Dental Clinic - Main`, `Pantua Dental Clinic`), weekly work schedule & shift breakdown, summary KPI metrics banner, search & status filters, interactive quick actions (Change Branch Assignment, Reset Password, Suspend/Reactivate, Permanent Deletion), and complete Staff Dossier Workspace (`/platform/users/:id`).
- Subscription Plans (`/platform/plans`)
  - Status: Implemented
  - Scope: Visual Plan Builder, Monthly/Yearly PHP pricing (Basic ₱5,000/mo, Plus ₱8,500/mo, Max ₱10,000/mo), resource quota limits (clinics, dentists, labs, staff), 17 feature toggles, and public registration switches. Dynamic MRR contribution per active subscriber.
- Active Subscriptions (`/platform/subscriptions`)
  - Status: Implemented
  - Scope: Clinic subscription lifecycle management, renewals, plan upgrades/downgrades, and transition history. Batch 2 added derived non-persistent pending subscription rows from registration/payment submissions so pending signups appear in Active Subscriptions without creating real subscribers, clinics, or auth users before payment approval.
- Payments & Receipts (`/platform/payments`)
  - Status: Implemented
  - Scope: Payment verification queue (GCash, Maya, Bank Transfer), approval/rejection records, official receipt records, and refund processing. Approval/rejection now runs through the centralized payment service only; verified approval retries repair missing registration/subscriber/auth links and show the temporary password modal from synced registration state. August 26 visibility repair adds derived registration payment rows for `unpaid` and `pending_verification` registrations, so newly registered clinics appear in Payments & Receipts before a persisted payment row exists. The Payments KPI header now reflects real ledger totals only and no longer displays fallback demo values when the list is empty.
- Dental Clinic Branches (`/platform/clinics` & `/platform/clinics/:id`)
  - Status: Implemented (500px Compact Registry)
  - Scope: Master registry of all clinic facilities partitioned by clinic owner. Real-data seed policy (`Angelo Dental Clinic` - Main, `Pantua Dental Clinic` - Satellite). Top-aligned 500px compact table, initials badges, clear clinic owner hierarchy (`Owner: Angelo Mhyr Lagsac`), live dentist/staff personnel aggregation, branch status controls, and primary clinic assignment. Registration-time clinics now also surface as derived `pending` rows before payment approval so signup progress remains visible in the platform clinic registry.
- Partner Dental Laboratories (`/platform/laboratories` & `/platform/laboratories/:id`)
  - Status: Implemented (500px Compact Partner Directory + Manual Creation Only)
  - Scope: Dental laboratory partner network purged of synthetic mockups. Batch 1 disabled registration-driven auto-lab provisioning during initialization, so signup no longer creates dental laboratories from `worksWithLab` values. Partner labs are now expected to be manually created and scoped by subscriber after approval.
- Reports & Analytics (`/platform/analytics-reports`)
  - Status: Implemented (Executive Intelligence Multi-Chart Suite)
  - Scope: Expandable sidebar dropdown with 5 portfolio views (*1. Executive Summary*, *2. Financial & Collections*, *3. Clinic Branches & Labs*, *4. Patients & Treatments*, *5. Doctor & Staff Activity*), interactive SVG multi-chart engine (Donut/Pie charts, Vertical Column charts, Horizontal Bar leaderboards, and Hourly Traffic Histogram), date range filters, and high-res PDF/CSV exports.
- Announcements & Notices (`/platform/announcements`)
  - Status: Implemented (Zero-Mock Real Data Synced)
  - Scope: Audience-targeted system broadcast engine with scheduling and priority alert levels. Displays real admin broadcasts with structured empty state.
- Activity History & Action Records (`/platform/audit-logs`)
  - Status: Implemented (Zero-Mock Event-Driven Stream & Action Inspector)
  - Scope: Permanent tamper-evident activity history records with security verification stamps and connected actions trail. 100% event-driven from real user actions with structured empty state.
- System Backup & Data Recovery (`/platform/data-restore`)
  - Status: Implemented (Safe Backup & Recovery Engine)
  - Scope: Full system backup creation, verified recovery summary preview, safety backup points, and emergency mock data reset with phrase confirmation. Batch 4 adds branch workspace coverage for patient directory, branch settings, add-patient drafts, progress notes, bills, appointments, recalls, chart history, certificates, uploads, scratchpad notes, follow-up lists, and treatment records. August 26 also adds a platform-navbar `Stale-Safe Purge` control for clearing processed ledgers and ghost operational records while preserving platform admin access, settings baseline, and restore checkpoints.
- Alerts & Notifications (`/platform/notifications`)
  - Status: Implemented (Zero-Mock Real Event Alerts)
  - Scope: Real-time multi-channel notification engine synchronized with payment approvals, onboarding reviews, and subscription milestones.
- System Settings (`/platform/settings`)
  - Status: Implemented (Enterprise System Governance & Settings Suite)
  - Scope: 2-Button Header standard (`Import System Settings` on left + `Export System Settings` on right), 4 Top Hero KPIs (Active System Modules `18/18`, Security Safeguards, Maximum Backup File Size, System Operational Status), secondary Protocol Ribbon, 8 segmented category tabs (`Overview & Health`, `General & Regional`, `Branding & Theme`, `Registration & Subscriptions`, `Payments & Gateways`, `Security & Session Rules`, `Feature Controls (On/Off)`, `Change History`), Real-Data SVG Visual Analytics Suite (`DonutPieChart` & `HorizontalBarChart`), deep validation controls, appearance preview, interactive payment chips, 500px high-density feature controls table, allowed page addresses during maintenance, 500px change history ledger with 1-click copy & CSV export, and side-by-side Changes Comparison modal.

## Clinic Owner (`/clinic/*`)

- Dashboard
  - Status: Implemented
  - Scope: Welcome header, dynamic summary cards, branch status grid, live Financial Summary, and dynamic Recent Activity timeline. Phase 5 tenant isolation scopes all branch, patient, staff, dentist, lab, activity, and financial aggregates to the logged-in subscriber. Recent Activity also resolves branch display names from the active subscriber scope instead of hardcoded clinic labels.
- Branches
  - Status: Implemented
  - Scope: Multi-branch facility registration, address & operating hours management, **Strict Plan Quota Guard** (Basic: 1, Plus: 5, Max: Unlimited), and subsystem entry routes (`/clinic/:clinicId/dashboard`).
- Laboratories
  - Status: Implemented
  - Scope: Dental laboratory partner network registry, direct connection to `mockLaboratoryService.ts` (`WeSmile Dental Imaging Center & Lab`), contact persons, and dispatch logs.
- Dentists
  - Status: Implemented
  - Scope: Associate dentist directory, credentials (PRC/PTR/S2), weekly schedules, **Strict Plan Quota Guard** (Basic: 1, Plus: 10, Max: Unlimited), and **Authorized Branch Designation** (`clinicIds` / `authorizedClinics`). Listing, form access, quota counts, clinic choices, and laboratory choices are scoped to the active subscriber.
- Staff
  - Status: Implemented
  - Scope: Staff member directory, roles (Dental Assistant, Receptionist), access privileges, **Strict Plan Quota Guard** (Basic: 3, Plus: 20, Max: Unlimited), and **Authorized Branch Designation** (`authorizedClinics`). Listing, form access, quota counts, clinic choices, and laboratory choices are scoped to the active subscriber.
- Analytics
  - Status: Implemented
  - Scope: Executive revenue charts, treatment procedure breakdown, and multi-branch comparison filters. Resource snapshots and lab counts now use subscriber-scoped branches and laboratories.
- Sales Overview
  - Status: Implemented
  - Scope: Aging receivables, pending balances feed, and multi-branch revenue leaderboard featuring 500px compact top-aligned data containers. Financial totals are calculated from subscriber branch patients only.
- Daily Reports
  - Status: Implemented
  - Scope: End-of-Day cash drawer & petty cash reconciliation, **Clinical Production Ledger vs. Staff Roster Attendance** (`DentistStaffDailyLedger.tsx` filtered by active branch), and Dental Lab logistics tracking. Branch/personnel matching supports branch IDs, codes, and names for tenant-safe backwards compatibility.
- General Settings (`/clinic/settings`)
  - Status: Implemented
  - Scope: 6-tab enterprise settings suite (Organization & Identity, **100% Real Live Subscription & Resource Quotas Sync** with active tier, branch/dentist/staff capacity progress bars, Multi-Branch Financial & Tax Rules, Security & Role Access Matrix, Executive Alerts & Reports, and Data Backup & One-Click JSON/CSV Export) powered by reactive `clinicOwnerSettingsStore`. Export datasets are subscriber-scoped.
- Master File Directory (`/clinic/directory/*`)
  - Status: Retired From Clinic Owner Navigation
  - Scope: The shared owner-side Master File Directory entry was removed so clinic owners manage master files only inside branch workspaces. Visiting `/clinic/directory/*` now shows a return-to-dashboard notice instead of opening a shared master-file workspace.

### Clinic Owner Tenant Isolation

- Status: Implemented (Phase 5; Phase 6 branch clinical scoping added)
- Scope: `tenantScope.ts` resolves subscriber context from the clinic owner account, supports legacy Angelo subscriber aliases, and prevents staff, associate dentists, laboratories, branches, reports, settings exports, activity feed, and financial aggregates from leaking across subscribers such as Angelo Dental Clinic and Disnuta Clinic. Phase 6 extends this isolation into patient clinical records inside each branch subsystem.

## Auth & Onboarding

- Registration Approval Provisioning
  - Status: Implemented through Phase 4
  - Scope: Platform approval now provisions subscriber, clinic-owner platform user, auth login, temporary password, and registration back-links through the centralized approval path.
- Email-Only- Registration Status Checker (`/clinic/registration-status`)
  - Status: Implemented
  - Scope: Registered clinic owners can enter only their email to check whether the account is pending, rejected, not found, or ready. Ready accounts expose the synced temporary password with custom copy/toast feedback.
- Temporary Password Change (`/clinic/change-password`)
  - Status: Implemented
  - Scope: First-login clinic owner accounts with `mustChangePassword` are routed to a dedicated change-password screen. The flow validates the temporary password, enforces new password strength, prevents temp password reuse, clears `mustChangePassword/resetRequired`, clears the registration `tempPassword`, logs an audit event, and continues into the Clinic Owner dashboard.
- Single Source of Truth Auth & Dynamic Temporary Password
  - Status: Implemented
  - Scope: Approval dynamically creates a random temporary password stored synchronously in registrations, platform users, and `pnj_mock_users` auth credentials. Re-running approval refreshes the temp password only while `mustChangePassword` is still true; changed passwords are preserved. Removed all static fallback passwords and auto-provisioning overrides.
- Multi-Tenant Data Isolation & Fresh Empty State Policy
  - Status: Implemented
  - Scope: Zero non-platform seed clutter on initial boot. All entities (subscribers, clinics, dentists, staff, labs, patients) strictly partitioned by stable IDs with no fallback to other tenants. `/clinic/:clinicId/*` routes now require the branch `subscriberId` to match the logged-in clinic owner's subscriber. Account deletion hard-purges auth credentials and blacklists emails. August 26 adds a broader deleted-blacklist cleanup pass so leftover registration/payment/platform-user/subscription artifacts tied to deleted emails are also purged on initialization.

## Clinic Subsystem (`/clinic/:clinicId/*`)

- Multi-Branch Data Isolation & Storage Partitioning
  - Status: Implemented
  - Scope: Dedicated storage scoping per `clinicId`. Data recorded in one branch (e.g. Angelo Dental Clinic `CLN-SUB-396924`) is strictly isolated from other branches (e.g. Pantua Dental Clinic `CLN-1787478722569-296`). Patient clinical stores now use `${prefix}${clinicId}:${patientId}` with legacy `${prefix}${patientId}` fallback for migration compatibility.
- Dashboard
  - Status: Implemented
  - Scope: Branch-scoped KPIs (Total Patients, Today's Appointments, Pending Balances, Today's Birthdays), Live Summary Cards, Operational section, Status overview (**Operating Rooms Live Sync** connecting real-time active dental chairs count from `branchSettingsStore`), and dynamic live Recent Activity timeline.
- Patients
  - Status: Implemented
  - Scope: Branch-scoped patient directory table/grid (`loadPatientDirectoryRecords(currentClinic.id)`), search, date filtering, live remark badges, add/edit workflows tagging `currentClinic.id`, and patient clinical workspaces. Progress Notes, Bills & Payments, Patient Appointments, Dental Recalls, Dental Chart, Certificates, and Contract/Patient Forms are scoped by patient + clinic.
- Scheduling, Calendar & Daily Waitlist
  - Status: Implemented
  - Scope: Branch-partitioned calendar items (`scheduleStorage.ts` scoped by `clinicId`), appointment status transition workflow, dentist picker matching branch-designated associate dentists, and live daily waitlist queue. Calendar recalls generated from progress notes are synced, counted, and deleted only in the active clinic partition.
- Patient Clinical Dental Charting & Triple Notation Persistence
  - Status: Implemented (Triple Notation Support & Persistence)
  - Scope: Interactive 5-surface odontogram, procedure tagging, tooth condition styling, and **Tooth Numbering System Selector** supporting **FDI Two-Digit (11–48 / 51–85)**, **Universal (ADA) (1–32 / A–T)**, and **Palmer Notation (1–8 / A–E with Quadrants: `┘`, `└`, `┐`, `┌`)**. Persisted to `DentalChartRecord.toothNotation`.
- Certificates / Documents & Forms / Dental Chart Form
  - Status: Implemented (Full Triple Notation Synchronization)
  - Scope: Patient documents workspace (`PatientFormsWorkspace.tsx`), **Dental Chart Form** print layout (`DentalChartPrintForm.tsx`), **Chart History Rail** with notation badge indicators, and on-the-fly notation selector for custom print/PDF generation. Certificate records and Contract Form state are stored with patient + clinic scoped keys.
- Branch Settings (`/clinic/:clinicId/settings`)
  - Status: Implemented
  - Scope: 7-tab operational settings workspace (Dynamic Branch Profile & Address inheriting from clinic record, Interactive 7-Day Operating Schedule, Operatory Chair Manager with modal, Clinical Charting & FDI/Universal/Palmer notation defaults, Rx Pad & PTR/PRC license toggles, Daily Waitlist limits, Cash Drawer Opening Float baseline powering EOD reconciliation) backed by `branchSettingsStore`.
- Master File Directory & PDF Designer
  - Status: Implemented
  - Scope: Branch-scoped administration of tooth items, clinical templates, master files, and PDF Designer synchronized with branch default notation. Branch routes remain under `/clinic/:clinicId/master-files/*` and no longer conflict with the owner-console `/clinic/directory/*` workspace.
  - Phase 8 verification rechecked this branch route split and build status.
## Platform Clinic Owners Cleanup

- Platform initialization now removes the stale pending registration `REG-2026-000002` for `sad@gmail.com` from the Clinic Owners data flow.
- Cleanup is narrowly scoped to the matching registration/email and its linked pending artifacts; the platform owner and unrelated tenant records are preserved.

## Associate, Staff, and Multi-Clinic Integrity - August 26, 2026
- Authorized Laboratories now use real subscriber laboratory records only.
- Associate branch assignments persist real clinic IDs and safe reusable numbering.
- Owner financial summaries aggregate all authorized branches while branch drilldowns stay clinic-scoped.
- Patient and schedule records without a `clinicId` are no longer assigned to a default clinic; they are excluded until properly scoped.
- Sales and analytics branch selectors resolve the complete subscriber branch set.
- Added automated multi-clinic integrity coverage for balance aggregation, branch isolation, empty labs, and fresh associate numbering.
- Final contract test status: 2/2 passing.

## Staff and Associate Workspaces - August 26, 2026
- Staff login routes to `/staff/workspace`; Associate Dentist login routes to `/associate/workspace`.
- Workspaces show only active clinics from the authenticated account's `clinicIds`.
- Opening a clinic reuses the branch subsystem layout with role-aware sidebar navigation.
- Staff receives the clinical dashboard, Patients, Calendar, Daily Waitlist, Overview Results, and Daily Results modules.
- Associate receives those modules plus Master File Directory, without owner Settings.
- Direct unauthorized branch/module URLs are blocked by the app route boundary.

## Permission Enforcement Foundation - August 26, 2026
- Configured Staff/Associate privileges are persisted with the auth identity and carried into the active session.
- Associate Calendar access respects `viewCalendar`; disabled access is removed from navigation and blocked by direct route checks.
- The branch layout receives the full permission map for future action-level controls.

## Live Workspace Profile Sync - August 26, 2026
- Staff workspace reads the linked Staff record from `mockStaffService`.
- Associate workspace reads the linked Associate Dentist record from `mockAssociateDentistService`.
- Role, account status, and assigned clinic count are live values; missing/inactive records are shown as restricted.

## Staff and Associate Workspace Audit - August 26, 2026
- Owner-side creation routes are available for Associate Dentists (`/clinic/dentists/new`, `/clinic/dentists/edit/:id`) and Staff (`/clinic/staff/new`, `/clinic/staff/edit/:id`).
- Records contain email and branch/permission metadata, but account creation is not yet linked to the shared authentication store.
- Current login routing sends all non-platform roles to the clinic-owner route; Staff and Associate Dentist workspace routing is a required next phase.
- Branch subsystem layout exists and can be reused, but role-specific sidebar filtering and assigned-clinic authorization still need implementation.

## Staff and Associate Account Provisioning - August 26, 2026
- `roleAccountProvisioningService` synchronizes active owner-created records to `pnj_mock_users`.
- Provisioned identity fields include role, email, subscriber ID, assigned real clinic IDs, status, and `linkedRecordId`.
- Passwords may be supplied by the owner; otherwise a random temporary password is generated with `mustChangePassword` enabled.
- Draft records do not provision authentication. Duplicate email and missing clinic assignment are rejected.

## Assigned-Clinic Schedule Sync - August 26, 2026
- Role workspaces include a date-based My Schedule panel.
- Schedule data is loaded from `scheduleStorage` separately for each assigned `clinicId`.
- Schedule update and browser storage events refresh the workspace without seeded schedule entries.

## Branch Patient Sync and Guards - August 26, 2026
- Staff/Associate branch patient pages read the shared live patient directory using the active branch ID.
- Patient edit/delete actions are controlled by authenticated privileges.
- Unauthorized actions are removed from the table/grid and rejected if invoked through stale UI state.

## Appointment Permission Sync - August 26, 2026
- Associate appointment/event creation respects `viewAppointments`.
- Disabled creation actions are hidden and handler guarded.
- Appointment data remains branch-scoped through the shared schedule/appointment stores.

## Final Role Flow Verification - August 26, 2026
- First-login password completion routes by role to the correct workspace.
- Staff and Associate users cannot be redirected into the Clinic Owner dashboard by the password-change flow.
- Build and targeted multi-clinic integrity checks are the automated verification baseline.
- Primary multi-clinic contract: 2/2 passing. One legacy tenant-scope fixture still expects the pre-cleanup seed behavior.

## Platform Payment Approval - August 26, 2026
- `PaymentActionMenu` recognizes current and legacy pending payment statuses.
- `Approve Payment` is available for `pending_verification`, `submitted`, `pending`, and additional-information records when the handler is supplied.
- Approval remains wired to the existing payment provisioning and subscriber synchronization flow.

## Registration Approval State Safety - August 26, 2026
- Removed email-specific automatic purge from `ensureSeedData` and deleted the obsolete hardcoded purge routine.
- Reading Platform Admin data is now non-destructive for newly registered accounts.
- Approval preserves the registration record while provisioning the subscriber, owner account, subscription, and clinic records.

## Staff and Associate Authentication - August 26, 2026
- Staff and Associate create/edit services persist the final-stepper `password` field.
- Role provisioning uses that same email/password and keeps the account partitioned by `subscriberId` and assigned clinic IDs.
- Successful login routes to the role workspace, not the Clinic Owner dashboard.

## Role-Aware Clinic Workspace - August 26, 2026
- Subsystem navbar role label is derived from the authenticated session.
- Associate and Staff Exit Branch actions return to their own workspace dashboard.
- Staff receives the operational sidebar: Dashboard, Patients, Calendar, Daily Waitlist, Overview Results, and Daily Results.
- Associate and Staff cannot remain on clinic-owner static routes after a direct route attempt.

## Subsystem Navbar Identity - August 26, 2026
- The status-area identity displays the authenticated role above the active clinic/branch name.
- This avoids repeating the same clinic name twice and distinguishes Owner, Associate Dentist, and Clinic Staff sessions.

## Staff and Associate UI/UX Standardization - August 26, 2026
- Role landing workspaces now share a polished PJ Dental card/spacing system while remaining role-specific.
- Staff landing copy prioritizes operations, schedules, branch access, and tasks.
- Associate landing copy prioritizes clinical work, schedule, assigned patients, and branch access.
- Branch dashboard headers now use role-aware section labels and descriptions.
- Responsive layouts stack metrics, panels, and clinic actions for mobile widths.
## Role Console Shell - August 26, 2026
- Staff and Associate landing workspaces now use the full Clinic Console shell.
- Role-specific sidebar links remain constrained to workspace, schedule, profile, and assigned-clinic surfaces.
## Role Navbar Identity Polish - August 26, 2026
- Shared console header displays role first and active clinic second.
## Role Workspace Tabs - August 26, 2026
- Role landing navigation uses `#clinics`, `#schedule`, `#profile`, and Associate `#clinical-work` section state.
- Staff and Associate content is separated by selected tab instead of displaying every panel simultaneously.
## Role Workspace Polish - August 26, 2026
- Personnel navbar removes owner-only prototype/subscription presentation and duplicate sign-out controls.
- Notification bell opens an in-app status panel instead of a mock alert.
- My Profile supports safe personal/contact edits for Staff and Associate records.
## Role Tab Header Spacing - August 26, 2026
- Schedule, Profile, and Clinical Work panels now use the same top spacing as Assigned Clinics.
