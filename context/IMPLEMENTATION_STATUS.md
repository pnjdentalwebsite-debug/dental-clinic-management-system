# Implementation Status

## Supabase Local Validation - August 26, 2026

- Docker-backed local Supabase is running with Auth, REST API, Realtime, Storage, Edge Runtime, database, and Mailpit. Resource-heavy Studio, analytics logging, vector, and image proxy are intentionally excluded on this workstation's current Docker memory limit.
- Applied and verified both seed-free migrations locally: the core tenant/branch contract and `20260826123036_restrict_public_registration_submission.sql`.
- Public registration can submit only an unpaid, pending-verification record. It cannot self-approve payment, review itself, or mark provisioning complete.
- `supabase db lint --local` and local security advisors both report no issues. Existing UI modules remain localStorage-backed until scoped repositories are migrated one module at a time.

## Supabase Development Project Link - August 26, 2026

- Linked the dedicated development project `cuatwirdydarxvqqqoem`; it received the three reviewed seed-free migrations with no seed data, roles, or vault secrets pushed.
- Remote migration history matches local. Remote schema lint and security advisors report no issues.
- Added a portable safeguard for cloud projects that enable automatic RLS: `public.rls_auto_enable()` remains trigger infrastructure but is no longer callable by anon or authenticated clients.
- `.env.local` contains only the Vite public development URL/publishable key and remains Git-ignored. No database password, service-role key, or secret is stored in the repository.

## Supabase Phase 2 Core Schema - August 26, 2026

- Created the first CLI-generated, seed-free migration for platform identities, registrations, subscribers, subscriptions, payments, clinics, personnel, laboratories, patients, clinical scheduling, billing, uploads, notifications, and audit events.
- Every branch-operational table is tenant and clinic scoped. Composite foreign keys prevent cross-subscriber or cross-branch patient, tag, bill, recall, payment, and upload relationships.
- Added a fail-closed browser Supabase client boundary and tenant/clinic scope helper. Existing modules remain localStorage-backed until tested adapters are introduced.
- RLS is enabled for every table. The current conservative policy grants assigned staff/associates branch reads and reserves tenant management for owners until write permissions have module-specific policy tests.
- The migration has been applied and validated against local Docker and the dedicated cloud development project; no existing prototype records were migrated or changed.
- Updated the transitive DOMPurify dependency to a patched compatible release; `npm audit --omit=dev` now reports zero production vulnerabilities.

## Supabase Phase 2 Local Bootstrap - August 26, 2026

- Initialized the repository-owned Supabase CLI configuration in `supabase/config.toml` using the current CLI defaults.
- Added `supabase/.gitignore` so CLI-only `.temp/` metadata remains local while the safe, versioned configuration is tracked.
- The local configuration keeps new public tables non-exposed by default; future migrations must grant API access deliberately and enable RLS before client access.
- The dedicated development project is linked, and only Git-ignored public development configuration is present locally. No prototype or real operational data was migrated, deleted, or changed.
- Next required handoff: implement tested server/Auth workflows and migrate localStorage repositories incrementally. Never commit or paste a service-role key.

## Supabase Phase 1 Foundation - August 26, 2026

- Created the `feature/supabase-foundation` branch from the pushed `prototype-baseline` tag.
- Added `.env.example` with public Vite Supabase placeholders only; secrets remain excluded from Git and browser variables.
- Added `context/supabase_phase_1_foundation.md` as the authoritative mapping from mock localStorage domains to future relational tables, RLS policies, storage buckets, and migration sequence.
- Declared Node 22 as the supported runtime in `package.json` and the lockfile. No Supabase package, credentials, linked project, live database, or migration is included in Phase 1.

## Full-System Diagnostic - August 26, 2026

- Build passes with `npm run build` (0 errors); Vite reports a large main bundle warning.
- Audit confirmed the application is still a localStorage/mock frontend prototype, not a production Supabase backend.
- Fixed a real Rules of Hooks defect in `UserDetailsPage`: clinic selection state is now initialized unconditionally, including the missing-user state.
- Lint still has non-blocking exhaustive-deps warnings and should be cleaned before production hardening.
- Production gaps remain in server auth, RLS/tenant enforcement, database migrations, durable payments/provisioning transactions, storage, deployment, observability, and security controls.

## Current Snapshot - August 25, 2026

## Latest Fix - August 25, 2026

- **Stale-Safe Purge Control - August 26, 2026**
  - Added a new platform-only `Stale-Safe Purge` button beside `Prototype Mode` in the top navbar (`App.tsx`).
  - Added a guarded typed-confirmation modal using `PURGE STALE DATA` before execution.
  - Wired the action to `mockBackupRestoreService.staleSafePurge()` so platform operators can clear processed records across `Clinic Owners`, `Clinic Staff & Doctors`, `Dental Clinics`, `Partner Laboratories`, `Subscription Plans`, `Active Subscriptions`, `Payments & Receipts`, plus linked branch workspace traces.
  - Preserves platform admin access, platform settings baseline, and restore checkpoints/history while clearing stale operational ledgers that commonly cause ghost or embedded onboarding state.
  - Intended use: fresh end-to-end retesting when registration, approval, payment, subscription, clinic, or branch data has become confusing or stale.
  - Build verification: pending current pass.

- **Registration Visibility Repair - August 26, 2026**
  - `mockPlatformManagementService.listSubscribers()` now projects pending registration records into the Clinic Owners ledger as read-only pending subscriber rows. Pending registrations no longer disappear from the Clinic Owners workflow while still awaiting approval.
  - `mockClinicService.listClinics()` now projects registration-driven pending clinic rows into the Dental Clinics registry. During signup/payment review, the registered clinic can now appear as a pending clinic record before approval instead of vanishing from the platform flow.
  - `mockPaymentService.listPayments()` now projects unpaid and pending-verification registration rows into `Payments & Receipts` even when no persisted payment ledger row exists yet. This fixes the case where a newly registered clinic was visible in Active Subscriptions, Dental Clinics, and Clinic Owners but missing from Payments, making approval impossible.
  - `mockPaymentService.approveRegistrationPayment()` now ignores projected `PAY-PENDING-*` rows and creates a real payment record before approval when needed, preventing ghost display rows from blocking actual payment approval.
  - `mockPlatformManagementService.purgeRequestedPendingRegistration()` was strengthened and version-bumped so the retired `sad@gmail.com` / `REG-2026-000002` cleanup runs again on existing browsers. It now also removes email-linked payment rows and clears that retired email/registration from the deleted-subscriber blacklist so a future fresh registration is not blocked by stale cleanup residue.
  - `App.tsx` now submits registration payments through the centralized payment service only. The old legacy signup payment writer was removed to prevent malformed duplicate payment rows and split-source ghost records in `pnj_mock_payments`.
  - `mockPlatformManagementService.ensureSeedData()` now runs a general deleted-subscriber artifact purge across registrations, payments, subscribers, platform users, auth users, clinics, subscriptions, dentists, and staff for anything still linked to the deleted blacklist.
  - `mockPaymentService.normalizePayment()` now safely parses legacy string amounts instead of producing invalid amount values during cleanup/normalization passes.
  - `PaymentsPage.tsx` no longer shows fake fallback KPI values (`₱7,990` / `1 verified`) when the payments ledger is actually empty.
  - `ClinicBranchesPage.tsx` now recognizes pending clinic rows and labels them as `Pending` instead of collapsing them into an archived-looking state.
  - Owner-side `Master File Directory` entry was removed from the Clinic Owner sidebar, and `/clinic/directory/*` now shows a branch-isolation notice that sends the user back to `/clinic/dashboard`. Master files remain branch-only under `/clinic/:clinicId/master-files/*`.
  - Build verification: `npm run build` completed with 0 TypeScript/Vite errors.

- **Batch 4 / Stage 9-10: Fresh-Test Reset Coverage + Provisioning Idempotency Verification**
  - `mockPlatformManagementService.createOwnerUserForSubscriber()` now preserves `mustChangePassword: false` for clinic owners who already completed first-login password setup. Re-running payment approval no longer flips the platform user back into a forced password-change state.
  - `syncRegistrationProvisioning()` now keeps registration `tempPassword` blank when the auth user has already changed their password. This prevents stale/generated temp passwords from reappearing in email-only status checks after repair passes.
  - `mockBackupRestoreService` now includes a `branch_workspace` module in backup/restore accounting. It captures the patient directory, branch settings, add-patient drafts, master-file PDF settings, and dynamic patient clinical storage keys such as progress notes, bills, appointments, dental recalls, charts, certificates, uploads, scratchpad notes, and follow-up lists.
  - Emergency reset still clears non-session local prototype data for fresh testing, then initializes only platform-support baseline services; branch/patient clinical records are no longer invisible to backup/storage footprint summaries before reset.
  - Build verification: `npm run build` completed with 0 TypeScript/Vite errors.

- **Batch 3 / Stage 6-8: Temp Password Lifecycle, Branch Access Guard, and Context Verification**
  - `mockAuthService.login` now resolves the real subscriber and clinic name from platform records instead of writing a branch `clinicId` into the auth session `clinicName`. This prevents clinic-owner routing from drifting into the wrong branch/subsystem context.
  - Email-only account status checks now require a provisioned auth credential before showing `ready`. Approved records with missing auth/temp-password provisioning now show `Account approved, setup incomplete` and instruct the platform operator to re-run payment approval.
  - Payment approval/re-approval now issues a fresh temporary password only when the owner still needs first-login password setup. Existing changed passwords are preserved and are not overwritten by approval repair passes.
  - Completing the first-login password change now clears the registration `tempPassword` while keeping the registration `account_ready`.
  - `/clinic/:clinicId/*` branch routes now verify that the requested branch belongs to the logged-in subscriber. A clinic owner can no longer open another subscriber's branch just by route ID.
  - `tenantScope.test.ts` and `tenantScope.ts` comments now match the read-only tenant-resolution rule: missing provisioning is reported, not silently created.
  - Build verification: `npm run build` completed with 0 TypeScript/Vite errors.

- **Batch 2 / Stage 3-5: Signup Pending State + Payment Approval as Single Provisioning Gate**
  - `mockPlatformManagementService.listSubscribers()` no longer provisions approved registrations as a side effect of reading the Subscribers table.
  - `tenantScope.ts` no longer self-provisions missing subscriber records from approved registrations during clinic owner route resolution; missing provisioning now reports a platform-admin repair message.
  - `mockSubscriptionService.listSubscriptions()` now shows pending registration/payment submissions as derived, non-persistent pending subscription rows. This lets Active Subscriptions display the waiting state without creating real subscriber/clinic/auth records before approval.
  - `SubscriptionsPage.tsx` now displays pending registration rows using the correct registered clinic/owner/email instead of falling back to the first subscriber. Pending rows route the operator to Payments & Receipts for review.
  - `mockSubscriptionService.provisionSubscriptionForApprovedRegistration()` now back-links existing subscription rows to the approved `registrationId`, marks them `active`/`paid`, and records a provisioning history entry.
  - Current approved provisioning trigger remains `mockPaymentService.approveRegistrationPayment()`: payment approval generates/syncs the random temporary password, creates subscriber/platform owner/auth records, creates the approved primary clinic, and activates the subscription.

- **Batch 1 / Stage 1-2: Login, Signup, Seed, and Tenant-Fallback Audit Cleanup**
  - Audited the current auth/onboarding path across `App.tsx`, `mockPlatformManagementService.ts`, `mockPaymentService.ts`, `mockSubscriptionService.ts`, `mockClinicService.ts`, and `mockLaboratoryService.ts`.
  - Hardened `mockAuthService.login` so login no longer creates an auth user as a side effect from registration/platform-user records. Sign-in now requires the auth account generated by the approval/provisioning pipeline.
  - Preserved permanent deletion safety: deleted subscriber emails stay blocked at login until a new registration flow explicitly creates fresh state.
  - Fixed `mockPlatformManagementService.listUsers` so orphan Associate Dentist / Staff rows without a valid `subscriberId` are ignored instead of being attached to the primary Angelo subscriber or `CLN-SUB-396924`.
  - Disabled automatic dental laboratory creation from registration `worksWithLab` data during laboratory initialization. Laboratories must now be created manually after approval, not seeded from signup.
  - Batch 2 target remains approval-only provisioning: `Signup -> Payments & Receipts -> Active Subscriptions -> Dental Clinics -> Clinic Owners -> Login / Change Password`.

- **Fixed: "Registration is marked as deleted" false positive blocker on Add New Branch / Add New Laboratory** - Fixed false-positive deletion blacklist blocking clinic owners from adding branches or partner laboratories:
  - Removed aggressive `staleSubscriberIds` automatic blacklisting in `mockPlatformManagementService.ts` (`ensureSeedData`).
  - Updated `createSubscriberFromApprovedRegistration` and `mockRegistrationService.createRegistration` to un-blacklist explicit fresh registration/provisioning records from `DELETED_SUBSCRIBERS_KEY` (`pnj_mock_deleted_subscribers`). Login itself remains read-only and does not revive deleted accounts.
  - Tenant resolution in `tenantScope.ts` now stays read-only for approved clinic owners; missing provisioning is repaired only by re-running platform payment approval.

- **Synchronized Plan Pricing, Features, and Resource Quotas (Basic, Plus, Max)**:
  - **Basic (Starter)**: `₱5,000 / mo` • `₱50,000 / yr` (1 Clinic, 1 Dentist, 0 Labs, 3 Staff, 4 of 17 Features).
  - **Plus (Most Popular)**: `₱8,500 / mo` • `₱85,000 / yr` (3 Clinics, 6 Dentists, 2 Labs, 20 Staff, 11 of 17 Features).
  - **Max (Enterprise)**: `₱10,000 / mo` • `₱100,000 / yr` (Unlimited Clinics, Unlimited Dentists, Unlimited Labs, Unlimited Staff, 17 of 17 Features).
  - Enforced real-time quota validation & upgrade prompts across `ClinicBranchCreatePage.tsx`, `ClinicLaboratoriesPage.tsx`, `ClinicLaboratoryFormPage.tsx`, `AssociateDentistFormPage.tsx`, `StaffFormPage.tsx`, and `GeneralSettingsPage.tsx`.

- **Cross-Platform Multi-Tab Registration & Approval Synchronization**:
  - Registrations start as Pending Verification in Payments & Receipts (`/platform/payments`), Waiting for Approval in Clinic Owners (`/platform/subscribers`), and Pending in Active Subscriptions (`/platform/subscriptions`).
  - Approving a payment transitions the subscription to Active, unlocks the exact plan features and quotas, creates the clinic owner user with dynamic temporary password, and links the primary clinic branch.

- **Platform Owner Suite (`/platform/*`)**:
  - **Platform Control Center & Dashboard (`PlatformDashboardPage.tsx`)**:
    - **Executive Hero Header**: Real-time system health pill (`🟢 All Systems Operational` / `Maintenance: Off`), subtitle, and quick command buttons (`Broadcast Alert`, `Review Payments`, `Platform Settings`).
    - **Redesigned Top 4 Hero KPIs**:
      - Monthly Recurring Revenue (MRR): `₱185,000` with `+12.4% MoM` trend badge.
      - Active Subscribers: Live count with `Max`, `Plus`, and `Basic` breakdown pills.
      - Pending Verifications: Dynamic item counter with pulsing amber badge for payment reviews.
      - Registered Facilities: Consolidated breakdown (`X Clinics` • `Y Partner Labs`).
    - **Structured Secondary Metrics Breakdown**: Interactive segmented tabs (*Financial Ledger*, *Facility Roster*, *Security & Audits*).
    - **Action Center Command Grid**: Urgency-ranked cards (Danger, Warning, Info, Success) with direct `Resolve →` navigation.
    - **Interactive Platform Snapshot**: Visual Subscription Tier Distribution with gradient percentage bars and facility infrastructure metrics.
    - **Enhanced Pending Onboarding Reviews Table**: Initials avatar badge, plan badge, payment method badge with copyable reference number, and inline `Review & Verify` button opening the payment verification modal.
    - **Platform Audit & Activity Feed**: Interactive timeline with category filter pills (*All*, *Auth*, *Payment*, *System*), role tags (`👑 Platform Admin` vs `🏥 Subscriber`), and formatted timestamps.
  - **Subscriber Management & Directory (`SubscribersPage.tsx`, `SubscriberDetailsPage.tsx`)**:
    - **Clean Data & Storage Persistence**: Purged all legacy dummy mockups (`SUB-MOCK-*`, `USR-MOCK-*`, `SCP-MOCK-*`, `CLN-MOCK-*`, `PAY-MOCK-*`, `@example.com`). Sole primary active subscriber is **Angelo Mhyr Lagsac** (`gelomhyr@gmail.com` • `Angelo Dental Clinic` • `Max Plan` • `approved` • `active` • `2 branches: Angelo Dental Clinic & Pantua Dental Clinic` • `2026-08-01 to 2027-08-01`).
    - **Hero Metric KPI Banner**: Real-time display for Total Subscribers, Active Subscriptions, Enterprise Max Plan share, and Monthly Recurring Revenue (`₱7,990.00`).
    - **Advanced Search & Multi-View Switcher**: Search across business name, owner name, email, and ID with Plan and Status dropdowns, and Table View vs Card Grid toggle.
    - **Enterprise Table & Card Layout**: Features initials avatar badges (`AD`), primary owner info, styled tier badges (`Max Plan` with sparkle icon), facility counters (`2 Clinics • 2 Dentists • 3 Staff`), and subscription validity with real-time countdown pill (`342 days remaining`).
    - **Interactive Modals**:
      - `Change Plan Tier`: Interactive tier modal to upgrade/downgrade between Basic, Plus, and Max.
      - `Renew / Extend Validity`: Custom duration modal (+30d, +90d, +1 Year, +2 Years).
      - `Suspend / Reactivate`: Reason-tracked modal toggling tenant status.
      - `Reset Password`: One-time temporary password generation with toast confirmation.
      - `Delete Subscriber Permanently`: Full cascading deletion with permanent blacklist registry (`DELETED_SUBSCRIBERS_KEY`) preventing re-seeding or re-provisioning of deleted accounts, coupled with reactive state query invalidation (`refreshKey`) for instant live table updates.
    - **Enhanced Subscriber Details Workspace (`/platform/subscribers/:id`)**:
      - Executive hero header with quick command buttons (`Change Plan`, `Renew`, `Reset Password`, `Suspend / Reactivate`, `Delete`).
      - Tabbed views: *Overview*, *Clinics & Branches* (showing both Angelo Dental Clinic & Pantua Dental Clinic), *Laboratories*, *Authorized Personnel* (Dentists & Staff), *Subscription*, *Payment Ledger* (with official GCash receipt details), and *Activity Logs*.
  - **Personnel & Users Management (`/platform/users` & `/platform/users/:id`)**:
    - **Clean Separation from Subscribers**: Subscriber clinic owners (`clinic_owner`) are isolated to the Subscribers ledger; the Users ledger strictly displays subscriber-registered **Associate Dentists (`associate`)** and **Auxiliary Staff (`staff`)**.
    - **Multi-Branch Station & Schedule Visibility**: Table shows Personnel Name, Role badge (`🩺 Associate Dentist` / `💼 Clinic Staff`), Parent Subscriber Organization (showing clearly: `Angelo Dental Clinic` • `Clinic Owner: Angelo Mhyr Lagsac` • `gelomhyr@gmail.com`), Designated Clinic Branch (`Angelo Dental Clinic (Main)`, `Pantua Dental Clinic`), and Weekly Work Schedule / Shift (`Mon - Fri: 8:00 AM - 6:00 PM`). No confusing "Direct Account" fallbacks.
    - **Hero KPI Metrics**: Real-time counter cards for Total Personnel, Active Clinicians/Staff, Licensed Associate Dentists, and Auxiliary Staff.
    - **Interactive Platform Modals**:
      - `Change Branch Assignment`: Modal to assign/reassign designated clinic branches for the employee.
      - `Reset User Password`: Dispatches temporary password with `mustChangePassword: true` flag.
      - `Suspend / Reactivate`: Reason-tracked modal toggling operational access to terminals.
      - `Delete Personnel Permanently`: Hard removal modal with cascading platform store purge.
    - **Personnel Dossier Workspace (`/platform/users/:id`)**:
      - Hero header with role badge, contact pills, and quick command buttons (`Reassign Branch`, `Reset Password`, `Suspend/Reactivate`, `Delete`).
      - Tabs: *Overview*, *Designated Branches*, *Work Schedule & Shift* (visual weekly breakdown), and *Audit Activity*.
  - **Subscription Plans & Tiers (`/platform/plans`, `/platform/plans/new`, `/platform/plans/:id`, `/platform/plans/:id/edit`)**:
    - **Modern UI/UX & Layout**: Upgraded to standardized 16px Hero KPI cards, 500px compact table layout with tier initials badges (`BA` Slate, `PL` Blue, `MX` Purple Sparkle), interactive Card Grid switcher, and direct-anchored 3-dots action menu (`PlanActionMenu.tsx`).
    - **Real Production Pricing & Dynamic Quotas**: Configured Basic (`₱0.00` Free Starter), Plus (`₱3,490.00/mo` • `₱37,692/yr`), and Max (`₱7,990.00/mo` • `₱86,292/yr`), dynamically calculating live subscriber enrollment and MRR contribution.
    - **Persistent Permanent Delete**: Integrated `DELETED_PLANS_KEY` blacklist to guarantee hard deletion for unused plan tiers while safely protecting tiers with active subscribers.
    - **Comprehensive Plan Dossier Workspace (`/platform/plans/:id`)**: Hero header with 4 metric cards and 5 tabs: *Overview & Pricing*, *Features*, *Usage Quotas*, *Enrolled Subscribers*, and *Audit History*.
  - **Subscriptions & Contracts Ledger (`/platform/subscriptions`, `/platform/subscriptions/new`, `/platform/subscriptions/:id`)**:
    - **Modern UI/UX & Layout**: Upgraded to standardized 16px Hero KPI cards (Total Subscriptions, Active Accounts, MRR `₱7,990.00`, Expiring/Attention), 500px compact table layout with Organization Initials badges (`AD`), styled Plan Tier pills (`Max Plan` purple sparkle), countdown validity pills (`342 days remaining`), and direct-anchored 3-dots action menu (`SubscriptionActionMenu.tsx`).
    - **Interactive Modals & Permanent Deletion**: Wired to `SubscriptionActionDialog` for in-place Renewals, Plan Changes, Expiration Extensions, Suspensions, and Cancellations, plus **Permanent Deletion** (`mockSubscriptionService.permanentlyDeleteSubscription`) with `ConfirmationDialog` and `DELETED_SUBSCRIPTIONS_KEY` persistent blacklist.
    - **Contract Dossier Workspace (`/platform/subscriptions/:id`)**: Hero header card with 4 metric cards and 4-tab dossier (*Contract Overview*, *Billing Terms*, *Invoices & Payments*, *Audit History*).
  - **Payments & Financial Ledger (`/platform/payments`, `/platform/payments/:id`)**:
    - **Modern UI/UX & Layout**: Upgraded to standardized 16px Hero KPI cards (Total Collected `₱7,990.00`, Verified `1`, Pending Review `0`, Primary Channel `GCash`), 500px compact table layout with Avatar badges (`AD`), GCash channel pills, reference badges, and direct-anchored 3-dots action menu (`PaymentActionMenu.tsx`).
    - **Official Receipt / Proof of Payment Modal**: Interactive printable modal featuring official electronic remittance certificate, GCash reference validation seal, and itemized allocation breakdown.
    - **Interactive Modals & Permanent Purge**: Wired to `PaymentActionDialog` for in-place Approvals, Rejections, Additional Information Requests, Allocations, Refunds, and Voids, plus **Permanent Deletion / Hard Purge** (`mockPaymentService.permanentlyDeletePayment`) with `ConfirmationDialog` and `DELETED_PAYMENTS_KEY` blacklist.
    - **Transaction Dossier Workspace (`/platform/payments/:id`)**: Hero header card with 4 metric cards, printable receipt trigger, and 3-tab dossier (*Transaction Details*, *Subscription Allocation*, *Audit History*).
  - **Facilities Management - Clinics (`/platform/clinics` & `/platform/clinics/:id`)**:
    - **Clean Action Menu & Permanent Deletion**: Direct-anchored 3-dots popup menu (`RowActionMenu.tsx`) styled as a sleek white card. Provides View Dossier, Edit Facility, View Subscriber, Manage Staff & Dentists, and Deactivate/Archive controls, plus **Permanent Deletion** (`permanentlyDeleteClinic`) for archived facilities with confirmation modal and persistent `DELETED_CLINICS_KEY` blacklist.
    - **Clean Real-Data Seed Standard**: Purged all synthetic mockup records (`CLN-MOCK-*`, `@example.com`). Live clinic branches owned by subscriber Angelo Mhyr Lagsac are cleanly maintained (`Angelo Dental Clinic` - Main & `Pantua Dental Clinic` - Satellite).
    - **Live Personnel Aggregation**: Dynamically aggregates live Associate Dentists (`mockAssociateDentistService`) and Staff (`mockStaffService`) assigned to each facility.
  - **Facilities Management - Laboratories (`/platform/laboratories` & `/platform/laboratories/:id`)**:
    - **Modern UI/UX & Layout**: Upgraded to 500px compact table layout with initials/flask avatars, bold lab names, clear parent subscriber organization, coordinator contact info, connected branches counter badge (`2 Connected Clinics`), active prosthetics procedures count, turnaround time with rush indicator, and status badge.
    - **Clean Action Menu & Permanent Deletion**: Direct-anchored 3-dots popup menu. Provides View Dossier, Edit Lab, Manage Connected Clinics, Manage Services, and Deactivate/Archive controls, plus **Permanent Deletion** (`permanentlyDeleteLaboratory`) with persistent `DELETED_LABS_KEY` blacklist, registration cleanup, and confirmation modal.
    - **Clean Real-Data Seed Standard**: Purged all synthetic mockups (`LAB-MOCK-*`, `@example.com`).
    - **Primary Partner Laboratory**: Seeded with real production laboratory **`WeSmile Dental Imaging Center & Lab`** (`LAB-000001` / `LAB-WESMILE-001`, Bacoor/Imus, Cavite, Chief Ops: `Engr. Ronald Tan`), seamlessly linked to both `Angelo Dental Clinic` and `Pantua Dental Clinic`.
    - **Catalog Services & Turnaround**: Configured with 5 core clinical services (Zirconia Crowns, E-Max Veneers, Complete Dentures, 3D CBCT Scans, Emergency Repairs) with 3-5 days turnaround.
  - `/platform/analytics-reports`
  - `/platform/announcements`
  - `/platform/audit-logs`
  - `/platform/data-restore`
  - `/platform/settings` (Enterprise Platform Settings & System Governance: 2-Button Header standard, 4 Hero KPIs, Protocol ribbon, 8 Segmented Category tabs, 500px compact tables, Real-Data SVG Visual Analytics Suite with Feature Flag Status Donut Chart & Governance Density Leaderboard, Deep configuration panels with input validation boundaries, live brand shell visualizer, interactive payment gateway toggle chips, search-filtered feature flags table, maintenance route exception manager, filterable change history ledger with 1-click copy & CSV export, and side-by-side Diff Inspector modal)
- **Clinic Owner Suite (`/clinic/*`)**:
  - `/clinic/dashboard`
  - `/clinic/branches`
  - `/clinic/laboratories`
  - `/clinic/dentists`
  - `/clinic/staff`
  - `/clinic/analytics`
  - `/clinic/sales`
  - `/clinic/daily-reports`
  - `/clinic/settings` (Enterprise Clinic Console Settings Suite with dynamic real-time subscription, quotas, role access matrix, live sync, JSON/CSV exports)
  - `/clinic/directory` (seamlessly connected to the unified **Master File Directory**)
  - enter branch/clinic ➔ `/clinic/:clinicId/dashboard`
- **Clinic Subsystem Workspace (`/clinic/:clinicId/*`)**:
  - **Multi-Branch Subsystem Data Isolation & Storage Partitioning**:
    - **Isolated Patient Directory (`patientDirectoryStore.ts`)**: Every patient is strictly scoped by `clinicId` (e.g. `Angelo Dental Clinic` - `CLN-SUB-396924` vs. `Pantua Dental Clinic` - `CLN-1787478722569-296`). Registering, modifying, or deleting patients in one branch never leaks into or impacts other clinic branches.
    - **Isolated Calendar & Waitlist (`scheduleStorage.ts`)**: Appointments, procedures, and daily waitlist entries are partitioned by `clinicId`. Each branch maintains its own schedule without cross-branch bleeding.
    - **Branch Dashboard Live KPIs & Balances (`DashboardPage.tsx`)**: Total Patients, Today's Appointments, Pending Balances, and Birthdays strictly compute from the active branch's dataset.
    - **Branch Settings Initialization (`branchSettingsStore.ts`)**: Newly created branches dynamically inherit their real name, contact number, address, city, and province from `mockClinicService`.
  - **Associate Dentists & Staff Management Branch Designation**:
    - **Personnel Scoping (`mockAssociateDentistService.ts`, `mockStaffService.ts`)**: Associate dentists and staff records track authorized branches (`clinicIds`, `authorizedClinics`).
    - **Branch Subsystem Filtering**: Within each branch workspace and Daily Reports (`DentistStaffDailyLedger.tsx`), appointment dentist pickers, clinical roster ledgers, and staff logs only display personnel designated for that specific branch (`listDentistsForClinic`, `listStaffForClinic`).
  - **Main Hub Dashboard**:
    - KPIs (Total Patients, Today's Appointments, Pending Balances, Today's Birthdays)
    - Live Summary Cards (Today's Schedule, Today's Birthdays strictly matching MM-DD, Patients w/ Balance Ledger)
    - Operational section & Appointments overview
    - Dynamic Recent Activity timeline with 5-item blurred preview & 5-per-page paginated modal
    - **Operating Rooms Live Sync**: Dynamically reads active dental chairs count from `branchSettingsStore` and syncs on `BRANCH_SETTINGS_UPDATED_EVENT`.
  - **Subscription & Resource Quotas Synchronization**:
    - Synchronized `/clinic/settings` (Subscription & Quotas tab) with **100% Real Live Subscription Data** matching the clinic owner's active plan (e.g., **Max Plan / Max Subscription**).
    - Dynamically computes real clinic branches count from `mockClinicService`, active associate dentists count from `mockAssociateDentistService`, and active clinic staff count from `mockStaffService`.
    - Automatically provisions matching tier capacity (e.g. `Unlimited` capacity for Max Plan, numeric quota bars for Plus/Basic) and renders matching billing invoices in the billing history modal.
  - **Patients Clinical Dental Charting & Triple Notation Persistence**:
    - **Tooth Numbering System Selector**: Full dynamic switching between **FDI Two-Digit ISO-3950 (11–48 / 51–85)**, **Universal (ADA) (1–32 / A–T)**, and **Palmer Notation (1–8 / A–E with Quadrants: `┘`, `└`, `┐`, `┌`)**.
    - **Full Persistence**: `DentalChartRecord.toothNotation` saved to persistent storage and database.
    - Synchronized with default notation set in Branch Settings (`/clinic/:clinicId/settings`).
  - **Certificates Tab / Documents & Forms / Dental Chart Form & Print Layout**:
    - **Full Synchronization**: `DentalChartPrintForm.tsx` converts all 52 teeth dynamically across upper and lower odontogram arches based on saved or selected notation.
    - **Chart History Rail UI Alignment Fix**: Expanded sidebar grid column from 220px to 260px with `overflow: hidden`, snug sub-rail layout, compact selected card padding (`0.55rem 0.7rem`), and `patient-forms-history-rail__badge` styling ensuring no overlap with the Printable Preview panel.
    - **On-the-Fly Notation Toggle**: Interactive switcher in the toolbar for quick formatting changes before printing or downloading PDF.
    - **Print & PDF Engine**: `window.print()` and `html2canvas` / `jsPDF` render tooth numbers matching the active/saved notation.
  - **Branch Settings (`/clinic/:clinicId/settings`)**: 7-tab operational settings workspace (Branch Profile & Address, Interactive 7-Day Operating Schedule, Operatory Chair Manager with modal, Clinical Charting & FDI/Universal/Palmer notation defaults, Rx Pad & PTR/PRC license toggles, Daily Waitlist limits, Cash Drawer Opening Float baseline powering EOD reconciliation).
  - **Master File Directory**: Synchronized across Clinic Owner (`/clinic/directory`) and Branch Workspace (`/clinic/:clinicId/master-files`).

## Compact Top-Aligned Rows with 500px Table Containers

All 5 core reporting tables feature a **`min-height: 500px` `.table-container` with compact, top-aligned data rows** (no row stretching or thick vertical spacing), leaving clean open whitespace below rows with permanent pagination footers:
1. **Sales Overview (`AgingReceivablesFeed.tsx`)**: Aging Receivables & Pending Balances (`500px` container, compact rows at top).
2. **Sales Overview (`MultiBranchRevenueLeaderboard.tsx`)**: Multi-Branch Financial Leaderboard (`500px` container, compact rows at top).
3. **Daily Reports & Daily Results (`CashDrawerReconciliationCard.tsx`)**: Daily Clinic Petty Cash Expenses (`500px` container, compact rows at top, dynamically linked to Opening Cash Float).
4. **Daily Reports & Daily Results (`DentistStaffDailyLedger.tsx`)**: Clinical Roster & Productivity Ledger (`500px` container, compact rows at top).
5. **Daily Reports & Daily Results (`DailyLabDispatchCard.tsx`)**: Dental Lab Orders & Logistics Log (`500px` container, compact rows at top).

## End-to-End Phased Integration & Gatekeeper System
1. **Phase 1: Real Data & Personnel Persona Purge**: Purged synthetic mock personnel (`Doc. Maria Santos` and `Ana Bautista`) from `seedUsers` in `mockPlatformManagementService.ts`, ensuring the Users directory exclusively shows genuine subscriber-created personnel.
2. **Phase 2: Subscription Expiration & Status Gatekeeper Lock Screen (`SubscriptionLockedScreen.tsx`)**: Reactive router guard in `App.tsx` immediately blocks access to `/clinic/*` if the subscription status is `suspended`, `expired`, or `cancelled`, displaying a modern SaaS lock screen with contract details and GCash renewal remittance submission modal.
3. **Phase 3: Strict Plan Quota Guards on Branch, Dentist, & Staff Creation**: Integrated quota calculation against active plan tiers in `ClinicBranchCreatePage.tsx`, `AssociateDentistFormPage.tsx`, and `StaffFormPage.tsx` with dynamic warning alert banners and submission blockers.
4. **Phase 4: Clinic Lab Work Orders to Laboratories Directory Direct Integration**: Direct integration with `mockLaboratoryService.ts` (`WeSmile Dental Imaging Center & Lab`) with procedure catalogs and turnaround days.
5. **Unified 3-Dots Action Dropdown Menu Positioning Fix**: Fixed `RowActionMenu.tsx` and `overlay.css` to dynamically anchor on the **LEFT SIDE** of the 3-dots trigger button (`left: rect.left - menuWidth - 6px`), aligned with the top of the button (`rect.top - 2px`) or bottom (`bottom: window.innerHeight - rect.bottom - 4px` when near viewport bottom), preventing any dropdown occlusion or viewport jumping across all 7 Platform Owner modules (Subscribers, Users, Clinics, Laboratories, Plans, Subscriptions, Payments).
6. **Platform Analytics & Reports Executive Intelligence Suite (Fully Implemented & 100% Real-Data Synced)**:
   - **Clean Sidebar Navigation**: Standard direct button in Platform Sidebar navigating to `/platform/analytics-reports` with segmented portfolio tabs in-page (*1. Executive Overview*, *2. Financial & Revenue*, *3. Multi-Branch Facilities*, *4. Clinical & Patients*, *5. Personnel & System Audits*).
   - **Pure Real Data Aggregations**: Eliminated synthetic mockups across all charts. Dynamic feeds reading straight from subscriber ledgers, multi-branch settings (`branchSettingsStore.ts`), patient clinical records (`loadPatientDirectoryRecords`), bills & payments (`billPaymentStore.ts`), and audit log service (`mockAuditService.ts`).
   - **Reusable Multi-Chart Engine**: Interactive SVG chart components (`DonutPieChart`, `VerticalColumnChart`, `HorizontalBarChart`, `HistogramAreaChart`) with high-res Print PDF and CSV data ledger exports.
7. **System Announcements Module Redesign (Fully Implemented - All 4 Phases Complete)**:
   - **Phase 1 (Completed)**: 500px Compact Table Layout & Hero KPI Visuals in `AnnouncementsPage.tsx`. Integrated 4 Top Hero KPI cards (Total Broadcasts, Published & Live, Scheduled Queue, Urgent Alerts), secondary delivery metrics ribbon, 7 segmented status tabs with live badges, 500px sticky-header compact table with top-aligned rows, color-coded priority pills, read rate meters, left-anchored 3-dots action menu, modern cards view grid, and 3-mode broadcast preview modal (Desktop Banner, Notification Toast, Mobile View).
   - **Phase 2 (Completed)**: Announcement Form Overhaul & Quick Broadcast Templates in `AnnouncementForm.tsx` and `AnnouncementFormPage.tsx`. Integrated 5 1-Click Broadcast Presets, segmented card architecture, Live Audience Resolution Inspector, and live preview modal.
   - **Phase 3 (Completed)**: Interactive Visual Analytics & High-Res Details Suite in `AnnouncementDetailsPage.tsx`. Integrated Top 5 Hero KPI cards, 6 segmented tabs, interactive SVG Donut engagement chart, Horizontal Bar role distribution chart, 500px compact recipients ledger, and instant CSV export.
8. **Audit Logs Module Redesign (Fully Implemented - All 4 Phases Complete)**:
   - **Phase 1 (Completed)**: KPI Visuals, 500px Compact Table Layout & Navigation Overhaul in `AuditLogsPage.tsx`. Integrated 4 Top Hero KPI cards (Total Audit Events, Critical & Security Incidents, Active Actors, Correlation Streams), secondary security metrics ribbon, 6 segmented count tabs (`All`, `Critical`, `Failed & Denied`, `Security & Auth`, `Financial & Billing`, `Clinics & Clinical`), 500px sticky-header compact table with top-aligned rows, high-contrast severity pills (`critical`, `high`, `medium`, `low`, `informational`), result badges (`success`, `denied`, `failure`, `warning`, `partial`), left-anchored 3-dots action menu (`AuditActionMenu`), cards grid view switcher, Raw JSON inspector modal with 1-click copy, and universal CSV/PDF export.
   - **Phase 2 (Completed)**: Real-Data SVG Visual Analytics Suite in `AuditLogsPage.tsx`. Integrated toggleable interactive SVG charts (24-Hour Hourly Event Traffic Histogram with peak traffic indicators, Event Category Breakdown Donut chart with live percentage arcs, and Most Active Actors/Roles Horizontal Bar chart). Pure real-data reactive aggregations with zero synthetic mock data.
   - **Phase 3 (Completed)**: Visual JSON Snapshot Diff, Correlation Stream Flow & Integrity Inspector (`AuditDetailsPage.tsx`, `AuditCorrelationPage.tsx`, `AuditIntegrityPage.tsx`). Built side-by-side Before/After diff viewer with changed-fields badges and copy payload; sequential execution stream diagram with vertical step connectors and 500px table switcher; and visual blockchain-style parent-to-child SHA-256 block hash inspector with live integrity scan and heuristic anomaly detection.
   - **Phase 4 (Completed)**: Global Real-Time Event Dispatch & Cross-Tier Synchronization. Integrated automated audit logging helpers (`logAuthEvent`, `logClinicalEvent`, `logFinancialEvent`, `logAdminEvent`) in `mockAuditService.ts`, live window event dispatch (`AUDIT_LOG_APPENDED`) and storage event reactivity in `AuditLogsPage.tsx` across all 5 system tiers.
9. **Data Restore Module Redesign (Phases 1, 2, 3, & 4 Complete - Module Fully Upgraded)**:
   - **Phase 1 (Completed)**: Header 2-Button Standard, 4 Hero KPIs, Secondary Storage Ribbon, and 500px Compact Table Layout in `DataRestorePage.tsx`. Integrated clean 2-button header (`Restore Backup File` + `Create Backup`), 4 Top Hero KPI cards (Available Snapshots, Storage Footprint, Persisted Records, Last Backup Snapshot), secondary storage protocol ribbon, 5 segmented category tabs (`All`, `Manual`, `Pre-Restore`, `Pre-Reset`, `History`), 500px sticky-header compact table with top-aligned rows, monospace Snapshot IDs with 1-click copy, left-anchored 3-dots action menu (`RowActionMenu`), cards grid switcher, Create Backup modal, and Snapshot Details modal.
   - **Phase 2 (Completed)**: Real-Data SVG Visual Storage Analytics Suite in `DataRestorePage.tsx`. Integrated toggleable interactive SVG charts (Storage Footprint by System Domain Donut chart with live percentage breakdown and centered storage footprint, and Persisted Table Record Leaderboard Horizontal Bar chart with #1, #2, #3 badges and byte sublabels). Toggle button placed cleanly in the table toolbar alongside Print. Pure real-data reactive calculations with zero mockup clutter.
   - **Phase 3 (Completed)**: Interactive JSON File Validator, Pre-Restore Impact Matrix, Conflict Diff Inspector & Safety Confirmation Dialogs in `DataRestorePage.tsx`. Overhauled Restore Modal with interactive drag & drop upload dropzone, live schema/format/digest verification, 3 selectable strategy cards (*Replace Selected Modules*, *Merge & Preserve Existing*, *Merge & Update Matching*), per-module selective restore checkboxes with Select All/Clear All, and high-density Pre-Restore Impact Matrix table (Existing records, Backup records, To Add pills, To Update pills, Integrity/status badges) with auto-checkpoint rollback protection assurance.
   - **Phase 4 (Completed)**: Restore History Ledger, 1-Click Instant Rollback, Safe Reseed Engine & Cross-Platform Storage Reactivity. Built a filterable history toolbar with CSV export and 500px compact table, interactive history row inspector modal (`RestoreHistoryRecord`), 1-click rollback confirmation modal with pre-restore point targeting (`rollbackLatestRestore`), typed prototype reset (`RESET MOCK DATA`), and cross-tier event listener dispatch (`DATA_RESTORE_COMPLETED` & `storage` events).
10. **Notifications Module Redesign (Phases 1, 2, 3, & 4 Complete - Module Fully Upgraded)**:
    - **Phase 1 (Completed)**: Header 2-Button Standard, 4 Hero KPIs, Secondary Notification Engine Ribbon, 500px Compact Table Layout & Left-Anchored 3-Dots Action Menus in `NotificationsPage.tsx`. Integrated clean 2-button header (`Mark All as Read` + `Delivery Preferences`), 4 Top Hero KPI cards (Unread Alerts with status badge, High & Urgent Severity, Total Alert Volume across 12 categories, Broadcast Announcements), secondary notification engine ribbon, 6 segmented category tabs (`All`, `Unread`, `High & Urgent`, `System & Security`, `Announcements`, `Archived`), 500px sticky-header compact table with top-aligned rows, monospace Alert IDs (`NTF-000012`) with 1-click copy, left-anchored 3-dots action menu (`NotificationActionMenu`), bulk multi-select action drawer, cards grid switcher, and 1-click CSV export.
    - **Phase 2 (Completed)**: Real-Data SVG Visual Alert Analytics Suite in `NotificationsPage.tsx`. Integrated toggleable interactive SVG charts (Alert Distribution by Category Donut chart with live percentage arcs, category color coding, and centered `ALERTS` total badge, and Top Alerting Modules Leaderboard Horizontal Bar chart with #1-#6 rank badges and live unread sub-metrics). Toggle button placed cleanly in the table toolbar next to Print. 100% computed from real store records with zero mockup clutter.
    - **Phase 3 (Completed)**: Notification Details Inspector Modal/Page, Source Payload Viewer & Multi-Channel Preferences Matrix (`NotificationDetailsPage.tsx`, `NotificationPreferencesDialog.tsx`). Upgraded details page with 2-button header, summary hero card, metadata context grid, delivery status verification, and formatted JSON payload viewer with 1-click copy. Enhanced preferences matrix with 12 domain categories, 4 delivery channels (In-App, Email, SMS, Push), mandatory security policy locks, quick batch toggles, and reset policy defaults.
    - **Phase 4 (Completed)**: Global Cross-Tier Event Dispatch, Real-Time In-App Bell Synchronization & Full Build Verification (`mockNotificationService.ts`, `NotificationBell.tsx`, `NotificationsPage.tsx`). Configured `NOTIFICATION_STATE_CHANGED_EVENT` window dispatch on all mutations and storage reactivity, real-time unread badge synchronization in the top navigation bell with flyout dropdown, multi-tab sync, and clean build verification with 0 errors.
11. **Platform Sidebar Collapsible Dropdown Accordion Navigation (Fully Implemented)**:
    - Converted all 5 main platform sidebar section headers into collapsible accordion triggers with default closed state and smooth 90° rotating chevrons.
    - Enforced `text-align: left`, `flex: 1`, and `white-space: nowrap` on section headers and titles with `flex-shrink: 0` on icons, eliminating label wrapping and center alignment on `Subscription Management`.
12. **Global Real-Data Synchronization \u0026 Mock Clutter Purge (Phase 1 Complete)**:
    - **Zero Mock Seed Clutter**: Purged 10 dummy announcements, 4 fake audit logs, and 3 static notifications.
    - **Real Event-Driven Streams**: Synchronized real-time in-app notifications and correlated audit events with genuine payment submissions, approvals, and rejections.
    - **Universal Empty States**: Standardized empty state illustrations and clear messaging across all data tables and card grid views.
    - **Build Verification**: `npm run build` passing with 0 errors.
13. **End-to-End Workflow Synchronization & Quota Enforcement (Phase 2 Complete)**:
    - **G7 — Payment Submission Audit Trail** (`App.tsx`): Added `mockAuditService.appendAuditEvent(payment.submitted)` to `handleCompleteDemoPayment` so every registration payment submission is now permanently recorded in the real audit ledger (not just the internal activity log). Includes `afterSnapshot` with `paymentStatus: 'pending_verification'`, `paymentMethod`, and `referenceNumber`.
    - **G5 — Per-Subscriber Quota Scoping** (`AssociateDentistFormPage.tsx`, `StaffFormPage.tsx`): Fixed global dentist and staff quota counts to be scoped per-subscriber — `d.subscriberId === subscriberId` filter applied in both `currentDentistsCount` and `currentStaffCount` `useMemo` hooks. Orphaned records (no `subscriberId`) are safely included as a fallback to avoid over-blocking.
    - **G1 — Eager branchSettingsStore Initialization** (`ClinicBranchCreatePage.tsx`): After `mockClinicService.createClinic()` succeeds (non-draft), immediately calls `branchSettingsStore.getSettings(result.data.id)` to trigger lazy initialization and persist default branch settings to localStorage before the workspace is first opened. Emits a `branch.settings_initialized` audit event for traceability.
    - **2D — Dentist & Staff Create/Edit Audit Trail** (`AssociateDentistFormPage.tsx`, `StaffFormPage.tsx`): Added `mockAuditService.appendAuditEvent()` calls after successful dentist and staff create/update operations. Actions: `associate_dentist.created`, `associate_dentist.updated`, `staff.created`, `staff.updated` — all non-draft operations are now permanently recorded.
    - **Build Verification**: `npm run build` (`tsc -b && vite build`) passing with 0 errors.
14. **Cross-Module Verification & Context Synchronization (Phase 3 Complete)**:
    - **G8 — Parallel Store Identity Resolution** (`App.tsx`): Bridged `mockStorage.getUsers()` (Auth Users) and `mockPlatformManagementService.listUsers()` (Platform Users) directly at the login interception layer (`mockAuthService.login`).
    - **Dentist & Staff Dynamic Auto-Provisioning**: Upgraded `User` and `Session` TypeScript interfaces to natively support `associate` and `staff` roles. When staff or dentists attempt to log in for the first time, their credentials are dynamically provisioned in `pnj_mock_users` using `MOCK_TEMP_PASSWORD`, drawing role, status, and clinic mapping directly from their live subsystem records.
    - **Cascading Status Synchronization**: Because login dynamically checks `mockPlatformManagementService.listUsers()`, suspending a subscriber instantly prevents all associated subsystem personnel from logging into the platform.
    - **Routing Fix**: Updated `App.tsx` router logic to ensure `associate` and `staff` roles are directed to the `ClinicOwnerLayout` / Workspace rather than incorrectly falling through to the Platform Admin layout.
    - **Build Verification**: `npm run build` (`tsc -b && vite build`) passing with 0 errors.
15. **Non-IT & Client-Friendly Terminology Conversion (Phase 1 Complete)**:
    - **Navigation & Sidebar Overhaul** (`App.tsx`): Replaced technical developer section names and links with plain clinic business terminology:
      * `Subscriber Management` $\rightarrow$ `Clinic Accounts` (`Clinic Owners`, `Clinic Staff & Doctors`)
      * `Facilities Management` $\rightarrow$ `Clinics & Laboratories` (`Dental Clinics`, `Partner Laboratories`)
      * `Subscription Management` $\rightarrow$ `Plans & Billing` (`Subscription Plans`, `Active Subscriptions`, `Payments & Receipts`)
      * `System` $\rightarrow$ `System & Tools` (`Reports & Analytics`, `Announcements & Notices`, `Activity History`, `Backup & Recovery`, `Alerts & Notifications`, `System Settings`)
    - **Executive & Module Page Headers**: Converted technical headers, breadcrumbs, and subtitle descriptions across all 14 platform pages to intuitive, non-IT friendly language.
    - **Hero KPI Metrics & Portfolio Tabs**: Replaced cryptic metrics (`MRR`, `Operatory Units`, `Audit Integrity Chains`, `Snapshots`) with plain business indicators (`Monthly Plan Revenue`, `Operating Dental Chairs`, `Security Status`, `Saved Backup Copies`).
    - **Analytics Portfolio Tabs** (`AnalyticsReportsPage.tsx`): Renamed portfolios to `1. Executive Summary`, `2. Financial & Collections`, `3. Clinic Branches & Labs`, `4. Patients & Treatments`, `5. Doctor & Staff Activity`.
16. **Non-IT & Client-Friendly Terminology Conversion (Phase 2 Complete)**:
    - **Technical Inspector Modals & Popups Conversion**:
      * `AuditDetailsPage.tsx`, `AuditActionMenu.tsx`, `AuditCorrelationPage.tsx`, `AuditIntegrityPage.tsx`: Converted developer jargons (`Raw Audit Payload` $\rightarrow$ `Action Record Details`, `Visual JSON Diff` $\rightarrow$ `Changes Comparison`, `Correlation Stream` $\rightarrow$ `Connected Actions Trail`, `Cryptographic Hash Chain` $\rightarrow$ `Security Verification Stamp`, `SHA-256 Digest` $\rightarrow$ `Security Code`, `Before/After Snapshot` $\rightarrow$ `Original/Updated Values`).
      * `DataRestorePage.tsx`: Converted technical restore modals (`Restore Backup File` $\rightarrow$ `Restore from Backup File`, `Pre-Restore Impact Matrix` $\rightarrow$ `Recovery Summary Preview`, `Rollback Protection Checkpoint` $\rightarrow$ `Safety Backup Point`, `Replace Selected Modules` $\rightarrow$ `Replace Current Records`, `Merge & Preserve Existing` $\rightarrow$ `Add New Records Only`).
      * `NotificationsPage.tsx` & `NotificationDetailsPage.tsx`: Converted `Source Event Metadata Payload (JSON)` $\rightarrow$ `Alert Details & Properties`, `Copy Payload JSON` $\rightarrow$ `Copy Details`.
17. **Non-IT & Client-Friendly Terminology Conversion (Phase 3 Complete)**:
    - **Settings Deep Forms & Feature Controls Conversion**:
      * `PlatformSettingsPage.tsx` (`SettingsOverviewTab`, `GeneralRegionalPanel`, `BrandingPanel`, `RegistrationSubscriptionsPanel`, `PaymentsPanel`, `SecurityAuditPanel`, `FeatureFlagsMaintenancePanel`): Converted deep form inputs, helpers, and toggle descriptions:
        - `Feature Flags & Subsystem Modules` $\rightarrow$ `System Feature Controls & Modules`
        - `Platform Governance & Module Health Analytics` $\rightarrow$ `System Settings & Feature Status Analytics`
        - `Configuration Group Governance & Density` $\rightarrow$ `Settings Categories Summary`
        - `Enable Self-Service Registration` $\rightarrow$ `Enable Online Clinic Registration`
        - `Require Two-Factor Email Verification` $\rightarrow$ `Require Email Verification Code`
        - `Require Payment Clearance Before Approval` $\rightarrow$ `Require Payment Proof Before Account Approval`
        - `Auto-Provision Subscriptions & Quotas on Approval` $\rightarrow$ `Automatically Activate Plan & Quotas on Approval`
        - `Session Inactivity Timeout` $\rightarrow$ `Automatic Sign-Out Inactivity Time`
        - `Max Snapshot Restore Points` $\rightarrow$ `Maximum Saved Backups Kept`
        - `Require Confirmation for Destructive Actions` $\rightarrow$ `Require Confirmation Dialog Before Deleting Records`
        - `Create Pre-Restore / Pre-Reset Safety Checkpoint` $\rightarrow$ `Automatically Save Safety Backup Before Data Recovery / Resetting Settings`
        - `Platform Maintenance Mode Guard` $\rightarrow$ `System Maintenance Mode`
        - `Allow Platform Owner Bypass` $\rightarrow$ `Allow System Administrator Access During Maintenance`
        - `Bypass Whitelisted Routes` $\rightarrow$ `Allowed Page Addresses During Maintenance`
        - `Feature Flags Governance Table` $\rightarrow$ `System Feature Controls (Turn Features On / Off)`
18. **Login & Authentication UI/UX Redesign (Phase 1 Complete — Preserved Core Logic)**:
    - **Modern Dual-Panel Healthcare Hero Showcase** (`App.tsx`):
      * Replaced developer jargons with clinical value propositions: Interactive Dental Charting, Multi-Branch Facilities, Daily Drawer Balancing, and Data Safety & Privacy.
    - **Quick Demo Persona Switcher**:
      * Added 1-click pill buttons for **Platform Administrator** (`pnjdentalwebsite@gmail.com`) and **Clinic Owner (Angelo)** (`gelomhyr@gmail.com`) with instant credential autofill.
    - **Enhanced Input Experience**:
      * Real-time Caps Lock detector warning (`⚠️ Caps Lock is ON`).
      * Clean interactive password reveal toggle.
    - **Interactive Forgot Password Modal Dialog**:
      * Step-by-step password recovery modal with 1-click temporary access password copy (`Temp-PjD-8241!`).
19. **Registration Wizard UI/UX Redesign (Phase 2 Complete — Steps 1 to 3 & Stepper Framework)**:
    - **Numbered Ribbon Stepper Progress Tracker** (`App.tsx`):
      * Modern 6-step progress ribbon with distinct active/completed indicators, checkmarks, and brand styling.
    - **Step 1: Choose Plan (`/register/plan`)**:
      * Added **Monthly vs. Annual Billing Toggle** with a "Save 15%" discount badge.
      * Modern cards with "⭐ Most Popular" recommendation badges, clean PHP pricing per month/year, checkmark feature list, and clear plan selection highlights.
    - **Step 2: Owner Info (`/register/account`)**:
      * Reorganized layout into responsive 2-column input blocks for First Name, Last Name, Email, Mobile (`+63`), and Street Address / City / Province / Postal Code with inline error hints.
      * Professional legal agreements card with checkboxes for Subscription Terms & Conditions and Philippine DPA Compliance.
    - **Step 3: Clinic Info (`/register/clinic`)**:
      * Clean input sections for Clinic Name, Official Email, Landline/Mobile, and Facility Address.
      * 3-column counter cards for Associate Dentists, Auxiliary Staff, and Branch Locations.
      * Toggle switch for Dental Laboratory Partnerships with animated lab name input.
20. **Registration Wizard UI/UX Redesign (Phase 3 Complete — Steps 4 to 6: Review Invoice, OTP & Payment)**:
    - **Step 4: Review Details & Order Summary Invoice (`/register/review`)**:
      * Added complete Order Summary Invoice breakdown (Base Fee, Annual/Monthly cycle, VAT status, and Net Total in PHP).
      * Clean 2-column matrix for Primary Subscriber and Clinic Facility Profile.
      * Professional legal accuracy confirmation declaration.
    - **Step 5: Email OTP Verification (`/register/verify-email`)**:
      * Individual 6-digit input box array with auto-advance and backspace handling.
      * Live countdown timer with expired code alert and resend trigger.
      * 1-Click development testing auto-fill helper (`⚡ Auto-Fill 123456`).
    - **Step 6: Payment Submission & Checkout (`/register/payment`)**:
      * Multi-gateway selector cards for **GCash**, **Maya**, **Bank Transfer (BDO/BPI)**, and **Demo Bypass**.
      * Official payment receiving account details (Account Name & Account Numbers).
      * Reference number input field with validation.
22. **Cross-Platform Registration-to-Workspace Live Data Synchronization & Display Fix**:
    - **Pending Status Preservation in Mock Payment Service (`mockPaymentService.ts`)**:
      * Fixed `paymentStatusAfterAllocation` so pending payments with `verificationStatus === 'pending'` or `status === 'pending_verification'` are strictly preserved in `'pending_verification'` and never prematurely promoted to `'fully_allocated'` or `'approved'` before platform admin approval.
      * Updated `filterPayments` and `getPaymentSummary` to correctly include both `status === 'pending_verification'` and `verificationStatus === 'pending'`.
      * Fixed `PaymentsPage.tsx` tab counter so `pending verification (N)` correctly counts all pending verification submissions.
    - **Real Registration Data Mapping in Payments & Receipts (`/platform/payments`)**:
      * Replaced all static fallbacks in table rows, card grid view, and official e-Receipt modal with dynamic lookup:
        - Clinic Name: `{subscriber?.businessName || registration?.clinicName || pay.payerName}`
        - Payer Name & Email: `{pay.payerName || registration?.ownerName}` ({pay.payerEmail})
        - Initials Badge: Dynamic initials from clinic title (e.g. `DC`, `PD`, `AD`).
        - Historical prototype pricing reference retired. Current Phase 1 development catalog is Basic ₱5,000/mo or ₱51,000/yr, Plus ₱8,500/mo or ₱86,700/yr, and Max ₱10,000/mo or ₱102,000/yr.
        - Plan Allocation Tag: Dynamic `● unallocated to {plan.name}`.
    - **Platform Dashboard Pending Reviews Live Sync (`PlatformDashboardPage.tsx`)**:
      * Table reads live registrations from `mockPlatformManagementService.listRegistrations()`, correctly displaying all registrations where `paymentStatus === 'pending_verification'` or `registrationStatus === 'payment_under_review'`.
    - **Global Account Provisioning & Temporary Password Confirmation Modal (`App.tsx`)**:
      * Implemented an instant popup confirmation modal triggered whenever an admin approves a clinic registration or pending payment anywhere in the platform (`/platform/dashboard`, `/platform/subscribers`, `/platform/payments`, or `/platform/registrations/:id`).
      * Modal prominently displays:
        - Clinic Facility Name & Subscribed Plan Tier
        - Clinic Owner Name & Registered Login Email
        - Highlighted Temporary Master Password block (e.g. `Temp-PjD-8241!`)
        - 1-Click **"Copy Password"** button
        - 1-Click **"Copy Full Credentials"** button (formatted with Clinic Name, Email, Password, Tier, and Login URL)
        - Direct **"View Clinic Owner Profile"** link to the subscriber details page.
    - **Clinic Owner Subscriber Credentials & Temporary Password Displays (`SubscriberDetailsPage.tsx`)**:
      * Added **Access Credentials & Temporary Password (Debug / Dev Mode)** card directly underneath *Active Plan Terms* in the **Subscription** tab.
      * Added Temporary Master Password row with 1-click copy button under *Primary Owner Details* in the **Overview** tab.
      * Enhanced the **Reset Primary Owner Password** modal to display the existing temporary password with 1-click copy before re-generating and dispatching.
      * Seamlessly resolved and linked temporary credentials for all subscribers including newly approved clinics like **Disnuta Clinic** (`Distunia Lagsac`).
    - **Build Verification**: `npm run build` (`tsc -b && vite build`) passing with 0 errors in 4.63s.

23. **Registration Approval Provisioning Fix (Phase 2 Complete - August 25, 2026)**:
    - **Centralized Approval Path**:
      * `App.tsx` approval and rejection handlers now route through `centralizedPaymentService` only.
      * Removed double-provisioning risk from mixed legacy local payment approval calls.
    - **Idempotent Payment Approval Repair** (`mockPaymentService.ts`):
      * Re-approving an already verified registration now repairs provisioning instead of returning a stale "already approved" dead-end.
      * `approveRegistrationPayment(registrationId)` resolves both pending and existing verified payments so Platform Payments & Receipts can safely retry approvals.
    - **Subscriber / Owner / Auth Provisioning Upsert** (`mockPlatformManagementService.ts`):
      * Approved registrations now reliably create or update the linked subscriber, platform owner user, default clinic association, and auth login record.
      * Owner auth records retain an existing password when present, otherwise receive the shared temporary password `Temp-PjD-8241!`.
      * Registration records are back-synced with `subscriberId`, `userId`, `tempPassword`, `paymentStatus: approved`, and `registrationStatus: account_ready`.
    - **Platform UI Feedback**:
      * Approval toast now confirms the clinic owner account was provisioned.
      * Temporary password success modal reads from the repaired registration/subscriber state.
    - **Build Verification**:
      * `npm run build` (`tsc -b && vite build`) passed with 0 errors.
    - **Still Pending / Next Phases**:
      * First-login change-password UI redesign.
      * Supabase/RLS tenant enforcement for the production backend.
      * Master File Directory owner-vs-branch routing cleanup.

24. **Email-Only Account Status Check (Phase 3 Complete - August 25, 2026)**:
    - **Login Email-Only Lookup** (`App.tsx`):
      * If a user enters a valid email on `/login` and leaves the password blank, Sign In now checks registration/subscriber/owner-user state instead of showing a password-required dead end.
      * Lookup resolves account state from `mockPlatformManagementService.listRegistrations()`, `listSubscribers()`, and `listUsers()`.
    - **Custom Status Feedback Card**:
      * `ready`: shows approved/account-ready guidance, clinic/owner context, and the available temporary password.
      * `pending`: explains unpaid or under-review registration/payment state.
      * `rejected`: shows rejection guidance and platform-admin follow-up copy.
      * `not_found`: tells the user no matching clinic owner registration was found.
    - **Temporary Password Helper**:
      * Ready accounts expose `Temp-PjD-8241!` or the synced registration temp password with a 1-click copy action.
      * Uses custom toast feedback instead of browser alert dialogs.
    - **Audit Trail**:
      * Email-only status checks append `auth.email_status_check` audit events with status metadata.
    - **Build Verification**:
      * `npm run build` (`tsc -b && vite build`) passed with 0 errors.
    - **Still Pending / Next Phases**:
      * First-login change-password UI redesign.
      * Supabase/RLS tenant enforcement for the production backend.
      * Master File Directory owner-vs-branch routing cleanup.

25. **Temp Password + Change Password Flow (Phase 4 Complete - August 25, 2026)**:
    - **First-Login Password Gate (`App.tsx`)**:
      * Clinic owner accounts marked with `mustChangePassword` now route to `/clinic/change-password` after signing in with the approved temporary password.
      * Added a polished first-login security screen with clinic-owner email context, secure password fields, helper checklist, custom error banner, and cancel/logout flow.
    - **Password Validation & Save Behavior**:
      * Requires temporary/current password, new password, and confirmation.
      * Enforces minimum 8 characters with at least one letter and one number.
      * Prevents reusing the temporary password and blocks mismatched confirmation values.
      * Uses custom toast feedback instead of browser alert dialogs.
    - **Provisioned Account Flag Sync (`mockPlatformManagementService.ts`)**:
      * Added `completePasswordChangeByEmail(email)` to clear `mustChangePassword` and `resetRequired`, update `lastLoginAt`, and synchronize auth status after a successful password change.
    - **Audit Trail**:
      * Successful password changes append `auth.password_change` audit events.
    - **Build Verification**:
      * `npm run build` (`tsc -b && vite build`) passed with 0 errors.
    - **Still Pending / Next Phases**:
      * Supabase/RLS tenant enforcement for the production backend.
      * Master File Directory owner-vs-branch route separation.

26. **Subscriber / Tenant Data Isolation (Phase 5 Complete - August 25, 2026)**:
    - **Tenant Scope Utility (`tenantScope.ts`)**:
      * Added normalized subscriber matching for current and legacy primary IDs (`SUB-000001`, `SUB-396924`, `sub_001`) so older Angelo data stays readable while unrelated subscribers remain isolated.
      * Added reusable `scopeRecordsBySubscriber` and `subscriberIdMatches` helpers for owner-console services.
    - **Clinic Owner Dashboard & Activity Feed Isolation**:
      * `ClinicOwnerDashboardPage.tsx` resolves the logged-in owner to a subscriber and aggregates only that subscriber's branches, patients, staff, dentists, labs, and financials.
      * `ActivityFeed.tsx` computes financial and lab activity from subscriber-scoped patients and laboratories instead of global records.
      * `ActivityFeed.tsx` now resolves branch names from the active subscriber's clinic list so timeline copy says the correct branch scope instead of hardcoding `Angelo Dental Clinic`.
    - **Staff & Associate Dentist Isolation**:
      * `mockStaffService.ts` and `mockAssociateDentistService.ts` expose subscriber-scoped list helpers.
      * Staff and Associate Dentist listing/form pages show, create, edit, and count records only under the active subscriber.
      * Staff and Associate Dentist steppers only offer clinics and laboratories belonging to the active subscriber.
    - **Reports / Analytics / Settings Isolation**:
      * `mockSalesOverviewService.ts`, `mockClinicAnalyticsService.ts`, `mockDailyReportsService.ts`, and `GeneralSettingsPage.tsx` scope branch, patient, lab, staff, dentist, and financial datasets by subscriber context.
      * Daily Reports branch authorization accepts branch ID, branch code, or branch name to keep old saved assignments compatible.
    - **Build Verification**:
      * `npm run build` (`tsc -b && vite build`) passed with 0 errors.
    - **Still Pending / Next Phases**:
      * Master File Directory owner-vs-branch route separation.
      * Any platform-admin ledgers that intentionally show all subscribers must remain platform-admin-only.

27. **Branch / Sub-System Patient Clinical Isolation (Phase 6 Complete - August 25, 2026)**:
    - **Shared Patient Clinical Storage Scope (`patientClinicalStorage.ts`)**:
      * Added shared helpers for patient clinical localStorage keys using `${prefix}${clinicId}:${patientId}`.
      * Legacy `${prefix}${patientId}` keys remain fallback-only so older records can still be read without becoming the active write target.
    - **Scoped Patient Clinical Modules**:
      * Progress Notes, Bills & Payments, Patient Appointments, Dental Recalls, Dental Chart, Certificates, and Contract/Patient Forms now load and save under the active patient's `clinicId`.
      * The Progress Note sync chain preserves the clinic scope across `Progress Notes -> Bills & Payments -> Patient Appointments -> Dental Recalls -> Calendar`.
    - **Calendar Recall Isolation**:
      * Calendar recall sync/count/delete now reads and writes only the active clinic schedule partition.
      * Synced calendar recall items retain `clinicId` and `clinicName` metadata for branch-safe rendering and cleanup.
    - **Safe Delete / Balance Updates**:
      * Patient delete and generated-ID cleanup purge scoped patient records only for the active clinic.
      * Billing balance updates now target matching `patientId + clinicId`, preventing one branch from modifying another branch's patient balance.
    - **Build Verification**:
      * `npm run build` (`tsc -b && vite build`) passed with 0 errors.
    - **Still Pending / Next Phases**:
      * Supabase/RLS tenant enforcement for production backend persistence.

28. **Master File Directory Routing Fix (Phase 7 Complete - August 25, 2026)**:
    - **Owner vs. Branch Route Split (`App.tsx`)**:
      * Clinic Owner Master File Directory now resolves as owner-scoped for `/clinic/directory` and every nested `/clinic/directory/*` section.
      * Branch/subsystem Master File Directory remains isolated under `/clinic/{clinicId}/master-files/*`.
      * Removed confusion where owner directory navigation could be interpreted as an active branch route.
    - **Reusable Master File Renderer**:
      * `renderMasterFileDirectoryContent(routeBase, clinicContext)` now renders the same directory sections for both scopes while preserving the correct route base.
      * Owner scope uses an `OWNER-MASTER-FILES` context and branch scope uses the active `currentClinic`.
    - **Navigation Safety**:
      * Owner directory sidebar exits back to `/clinic/dashboard` with `Back to Clinic Console`.
      * Branch directory sidebar exits back to `/clinic/{clinicId}/dashboard`.
      * Owner directory navbar Add Patient action prompts the user to enter a clinic branch first instead of opening a branch-only patient workflow.
    - **Components Updated**:
      * `MasterFileDirectoryLayout.tsx`, `MasterFileDirectorySidebar.tsx`, `MasterFileNavGroup.tsx`, and `MasterFileDirectoryDashboardPage.tsx` now accept `routeBase` / back-route context.
      * `ClinicOwnerSidebar.tsx` highlights Master File Directory only for owner directory routes, not branch `/master-files` routes.
    - **Build Verification**:
      * `npm run build` (`tsc -b && vite build`) passed with 0 errors.
    - **Still Pending / Next Phases**:
      * Supabase/RLS tenant enforcement for production backend persistence.

29. **Verification + Context Sync (Phase 8 Complete - August 25, 2026)**:
    - **Verification Pass**:
      * Rechecked the Phase 7 owner-vs-branch Master File Directory routing notes across the active context set.
      * Confirmed owner routes remain documented as `/clinic/directory/*`.
      * Confirmed branch routes remain documented as `/clinic/{clinicId}/master-files/*`.
      * Confirmed owner back navigation is documented for `/clinic/dashboard` and branch back navigation for `/clinic/{clinicId}/dashboard`.
    - **Context Sync**:
      * Synchronized this verification checkpoint into the implementation, module, architecture, walkthrough, task, component inventory, and route inventory docs.
    - **Build Verification**:
      * `npm run build` (`tsc -b && vite build`) passed with 0 errors.
      * Only the existing Vite large-chunk warning remains.
    - **Still Pending / Next Phases**:
      * Supabase/RLS tenant enforcement planning and production persistence wiring.

30. **Clean Fresh State, Auth Password Flow, & Strict Multi-Tenant Isolation (August 25, 2026)**:
    - **Issue 1 - Complete Removal of Stale & Mock Non-Platform Data**:
      * Purged all mock and seeded non-platform initializers from `mockPlatformManagementService.ts`, `mockPaymentService.ts`, `mockSubscriptionService.ts`, `mockClinicService.ts`, and `mockLaboratoryService.ts`.
      * Preserved strictly the Platform Admin account (`DEFAULT_PLATFORM_OWNER` - `pnjdentalwebsite@gmail.com` / `pjDental**001`).
      * Clean empty state (`[]`) guaranteed on initial boot without auto-recreating mock records.
      * Replaced hardcoded dummy email placeholders across screens with generic samples (`clinicowner@example.com`).
    - **Issue 2 - Registration Approval & Single Source of Truth Temporary Password**:
      * Removed `MOCK_TEMP_PASSWORD` constant and static password fallbacks across the codebase.
      * Dynamic temporary password (`Temp-${code}!`) generated upon payment approval via `generateSecureTemporaryPassword()`.
      * Propagated synchronously to `Registration`, `Subscriber`, `PlatformUser`, and `pnj_mock_users` auth credential store with `mustChangePassword: true`.
      * On first login, authentication validates strictly against stored password hash.
      * Full cascading account deletion purges `pnj_mock_users` and blacklists the email in `DELETED_SUBSCRIBERS_KEY` to block deleted credentials.
    - **Issue 3 - Strict Multi-Tenant Subscriber & Clinic Data Isolation**:
      * Eliminated fallback behavior (e.g. `|| subs[0]`, `|| 'SUB-000001'`, `PRIMARY_SUBSCRIBER_ID`, and fuzzy clinic-name matching).
      * Tenant queries strictly resolved via authenticated `subscriberId`, `clinicOwnerId`, `clinicId`, or verified user email.
      * Scoped all staff, associate dentists, branches, and laboratories strictly to matching `subscriberId` or returns `[]` / `null`.
31. **End-to-End Registration Approval, Dynamic Temporary Password, & Login Sync (August 25, 2026)**:
    - **Root Cause Resolution**:
      * Purged all stale fallback references to `'Temp-PjD-8241!'` in `PaymentsPage.tsx`, `PlatformDashboardPage.tsx`, `SubscribersPage.tsx`, and `SubscriberDetailsPage.tsx`.
      * Fixed `createOwnerUserForSubscriber` in `mockPlatformManagementService.ts` to overwrite `passwordHash` in `pnj_mock_users` whenever a temporary password is generated for an account awaiting password change (`mustChangePassword: true`), preventing stale hashes from sticking in localStorage.
      * Fixed `syncRegistrationProvisioning` to guarantee the dynamic temporary password is saved directly to `pnj_mock_registrations`.
      * Upgraded `ensureApprovedRegistrationProvisioning` and `approveRegistrationPayment` in `mockPaymentService.ts` to auto-provision and sync the generated password into registrations and subscriptions upon payment approval.
      * Enhanced `mockAuthService.login` in `App.tsx` to dynamically sync `pnj_mock_users` with the latest temporary password generated from registration approval, guaranteeing that newly approved clinic owners can always sign in smoothly on first attempt.
      * Upgraded Quick Demo "Clinic Owner" button on `/login` to pick the latest approved registration or platform user credentials dynamically.
    - **Build Verification**:
      * `npm run build` (`tsc -b && vite build`) passed with 0 errors.
## Targeted Pending Registration Cleanup (August 25, 2026)

- Added a one-time cleanup migration for `REG-2026-000002` / `sad@gmail.com`.
- Removes the matching pending Clinic Owners registration and any directly linked payment, auth, subscriber, clinic, subscription, dentist, and staff artifacts.
- The cleanup marker prevents repeated destructive cleanup while allowing the same email to be registered again in a future clean workflow.

32. **Associate Assignment and Multi-Clinic Dashboard Sync (August 26, 2026)**:
    - Removed the embedded `WeSmile Dental Imaging Center` laboratory fallback from associate and staff forms.
    - Existing staff and associate records normalize laboratory assignments against the real subscriber laboratory ledger.
    - Associate creation allocates the lowest available `DEN-000001`-style number and persists selected real branch IDs.
    - Owner dashboard financial data aggregates every authorized branch by default; branch performance recalculates per `clinicId`.
    - **Build Verification**: `npm run build` passed with 0 errors (existing Vite chunk-size warning only).
    - Removed implicit default-clinic assignment for patient and schedule records without `clinicId`; unscoped records are now excluded from live branch views.
    - Sales and clinic analytics branch resolution now discovers all subscriber branches from the selected clinic when an owner session email is unavailable.
    - Browser smoke check reached `/login`; no approved clinic-owner account existed in the clean browser state, so destructive/create test data was not fabricated.
    - Added `multiClinicDataIntegrity.test.ts` covering branch balance aggregation (`200 + 1800 = 2000`), branch isolation, empty laboratory defaults, and reusable associate numbering.
    - Corrected stale associate cleanup so valid newly created `DEN-000001` records are not deleted by the legacy seed filter.
    - Final targeted verification passed: `multiClinicDataIntegrity.test.ts` 2/2 tests; production build passed with 0 TypeScript/Vite errors.

35. **Role-Aware Staff and Associate Workspaces (August 26, 2026)**:
    - Added `/staff/workspace` and `/associate/workspace` landing routes with live assigned-clinic cards; no example data is injected.
    - Login and refresh guards route Staff and Associate users to their matching workspace instead of the Clinic Owner dashboard.
    - Assigned clinic IDs are carried in the session/auth record and validated before opening a branch workspace.
    - Branch subsystem sidebar hides owner-only navigation: Staff cannot access Settings or Master Files; Associate can access Master Files but not Settings.
    - Direct URL checks reject unassigned branches and role-inappropriate branch modules.
    - Phase 3 status: **Implemented; granular permission enforcement remains Phase 4.**

36. **Granular Permission Session Boundary (August 26, 2026)**:
    - Staff and Associate privileges are now copied into the provisioned auth identity and session.
    - Associate `viewCalendar: false` removes Calendar navigation and blocks direct Calendar URLs for assigned branches.
    - Branch workspace receives the authenticated permission map for subsequent module/action guards.
    - Phase 4 status: **Foundation implemented; remaining action-level guards for patient, billing, expense, and record mutations are next.**

37. **Live Staff and Associate Workspace Profile Sync (August 26, 2026)**:
    - Staff and Associate workspaces now resolve the linked domain record by `linkedRecordId` from the live owner-side service.
    - Workspace summaries display live record status, role type, and assigned clinic count instead of static profile values.
    - Missing or inactive linked records show restricted/unavailable access state rather than granting a ready state.
    - Phase 5 status: **Live workspace identity sync implemented.**

33. **Staff and Associate Workspace Audit (August 26, 2026)**:
    - Phase 1 audit located the owner forms/routes at `/clinic/staff/*` and `/clinic/dentists/*`, with persisted records in `mockStaffService` and `mockAssociateDentistService`.
    - Both records already carry email, subscriber scope, clinic assignments, status, privileges, and schedules, but saving either record does not yet provision a corresponding authenticated user in `pnj_mock_users`.
    - `mockAuthService.login` currently recognizes only users already present in `pnj_mock_users`; successful non-platform login is routed to the Clinic Owner console and `/clinic/change-password`, regardless of `associate` or `staff` role.
    - The existing `ClinicOwnerSidebar` is owner-only, while `ClinicWorkspaceLayout` is the reusable branch subsystem shell. Dedicated Staff and Associate workspaces, role-specific route guards, and assigned-clinic switching are not yet implemented.
    - Phase 1 status: **Audit complete; implementation not started for the new staff/associate login workspaces.**

34. **Staff and Associate Account Provisioning (August 26, 2026)**:
    - Added `roleAccountProvisioningService` as the shared adapter from owner-created Staff/Associate records to `pnj_mock_users`.
    - Active Staff and Associate saves now provision or synchronize a unique email login with role, subscriber ID, assigned real clinic IDs, status, and linked domain record ID.
    - If no password is supplied, a random first-login temporary password is generated and `mustChangePassword` is enabled; drafts do not create login accounts.
    - Duplicate email identities and missing valid clinic assignments are rejected. Failed new-account provisioning rolls back the newly created domain record.
    - Phase 2 status: **Provisioning implemented; workspace routing remains Phase 3.**

38. **Assigned-Clinic Schedule Synchronization (August 26, 2026)**:
    - Staff and Associate workspaces load schedule items through branch-scoped `scheduleStorage` using only authenticated `clinicIds`.
    - Added selected-date schedule viewing and refresh on schedule update/storage events.
    - Unscoped schedule items remain excluded; no fallback branch is used.
    - Phase 6 status: **Assigned-clinic schedule sync implemented.**

39. **Branch Patient Data and Mutation Guards (August 26, 2026)**:
    - Staff and Associate branch patient views continue to use the same live `patientDirectoryStore` filtered by the current branch `clinicId`.
    - Patient edit and delete controls now receive role privileges from the authenticated session.
    - Associate `editPatientData` controls editing; Staff `canDeletePatients` controls deletion; Clinic Owner retains both actions.
    - Unauthorized patient actions are hidden and guarded by warning feedback; no alternate unscoped store is used.
    - Phase 7 status: **Branch patient synchronization and basic patient mutation guards implemented.**

40. **Appointment Permissions and Verification Boundary (August 26, 2026)**:
    - Calendar New Appointment and Events/Schedules actions now respect the authenticated Associate `viewAppointments` privilege.
    - Disabled appointment creation is hidden and protected by a handler-level permission warning.
    - Existing appointment/schedule data continues to use the branch-scoped store and active clinic ID.
    - All six context files were synchronized and `npm run build` passed with 0 errors.
    - Phase 8 status: **Implemented; browser E2E with newly created Staff/Associate accounts remains a manual clean-state scenario.**

41. **Final Role Flow Verification and Password Redirect Fix (August 26, 2026)**:
    - Fixed first-login password change completion so Staff returns to `/staff/workspace`, Associate returns to `/associate/workspace`, and Clinic Owner remains on `/clinic/dashboard`.
    - Updated password-change feedback and audit summary to be role-neutral.
    - Verified production build and the primary multi-clinic integrity test (2/2 passing) after the route fix.
    - `tenantScope.test.ts` still has one legacy expectation failure caused by its seeded-platform fixture behavior; this is a test-fixture cleanup gap, not a build failure.
    - Phase 9 status: **Implementation complete; primary contract verified, legacy tenant fixture and clean browser E2E remain pending.**

42. **Pending Payment Approval Action Fix (August 26, 2026)**:
    - Platform Payments & Receipts now treats `pending_verification` and `submitted` payment statuses as pending even when legacy records have an unnormalized `verificationStatus`.
    - The existing `Approve Payment` action is visible for those rows and continues through the existing approval, provisioning, subscription, and registration synchronization flow.
    - `npm run build` passed with 0 errors. The existing PaymentsPage test has a stale heading/fixture assertion unrelated to this fix.

43. **Registration Approval Ghost-Delete Fix (August 26, 2026)**:
    - Removed the hardcoded cleanup routine for `sad@gmail.com` / `REG-2026-000002` from normal platform data reads.
    - Platform dashboard refreshes and payment approval provisioning no longer delete registrations, payments, subscribers, users, clinics, or subscriptions by email.
    - Destructive cleanup remains limited to explicit deleted-subscriber markers/admin actions; approval now preserves the registration and transitions it to `approved` / `account_ready`.
    - `npm run build` passed with 0 errors.

44. **Staff and Associate Login Credential Wiring (August 26, 2026)**:
    - Staff and Associate final-stepper passwords are now persisted on their corresponding records before role account provisioning.
    - The existing `roleAccountProvisioningService` receives the exact email/password pair entered by the Clinic Owner and stores it in the shared auth user store with the correct role, subscriber, clinic IDs, and privileges.
    - Login can now authenticate those emails with the entered password and route Staff to `/staff/workspace` or Associate to `/associate/workspace`.
    - `npm run build` passed and `multiClinicDataIntegrity.test.ts` passed 2/2.

45. **Role-Aware Clinic Workspace Session Fix (August 26, 2026)**:
    - Clinic subsystem navbar now displays the authenticated role: `Associate Dentist`, `Clinic Staff`, or `Clinic Owner`.
    - Associate and Staff branch exit returns to their own role workspace instead of `/clinic/dashboard`.
    - Staff clinic sidebar now includes Dashboard, Patients, Calendar, Daily Waitlist, Overview Results, and Daily Results.
    - Associate/Staff route guards redirect owner-console routes back to their role workspace while preserving assigned-clinic access checks.
    - Global announcements now receive the active role instead of a hardcoded Associate role.
    - `npm run build` passed and `multiClinicDataIntegrity.test.ts` passed 2/2.

46. **Role-Based Subsystem Navbar Identity (August 26, 2026)**:
    - Replaced the duplicated clinic-name lines beside the Active badge with the authenticated role on the first line and the active clinic/branch name on the second line.
    - Clinic Owner, Associate Dentist, and Clinic Staff now have distinct navbar identity labels while retaining the active clinic context.

47. **Staff and Associate UI/UX Standardization (August 26, 2026)**:
    - Rebuilt `RoleWorkspacePage` as a production-style role landing workspace with identity, account status, live schedule, profile, assigned clinic cards, and responsive states.
    - Added role-specific presentation: Staff emphasizes operations/schedule tasks; Associate emphasizes clinical work and assigned patient schedule.
    - Added role variants to the branch dashboard header while retaining the same live branch-scoped KPI and clinical data stores.
    - Added shared responsive workspace styling for hero panels, metric cards, schedule rows, profile summaries, clinic access cards, buttons, empty states, and mobile stacking.
    - No mock records were added; existing tenant, branch, permissions, and route behavior remain the source of truth.
    - `npm run build` passed. Multi-clinic integrity passed 2/2. Legacy clinic-service tests still expect retired seeded fixtures and remain a known test-policy mismatch.

48. **Role Console Shell Refactor (August 26, 2026)**:
    - Staff and Associate landing routes now use the full Clinic Console shell with role-specific navigation.
    - Added `RoleConsoleLayout` and `RoleConsoleSidebar`; owner-only management routes remain hidden.
    - Existing role session, assigned-clinic guards, branch entry, tenant isolation, and live data sources are preserved.
    - `npm run build` passed after the refactor.
49. **Role Navbar Identity Polish (August 26, 2026)**:
    - Shared console header now shows the authenticated role as the primary identity and the active clinic as supporting context for Owner, Staff, and Associate sessions.
49. **Role Workspace Tabs (August 26, 2026)**:
    - Staff and Associate workspace sidebars now use hash-backed section routes so only the selected tab is active.
    - Dashboard, Assigned Clinics, Schedule/Tasks, Profile, and Associate Clinical Work render focused content sections.
    - Existing assigned-clinic data, authentication, permissions, and branch navigation remain unchanged.
    - `npm run build` passed.
50. **Role Workspace Polish and Profile Editing (August 26, 2026)**:
    - Added consistent header/content spacing for Staff and Associate tabs.
    - Removed duplicate workspace sign-out, Prototype Mode, and subscription decorations from personnel navbar presentation.
    - Replaced the notification alert with a non-destructive notification dropdown; refresh continues to use the live shell refresh callback.
    - Added safe Staff/Associate profile editing for personal/contact fields only; clinic assignments, permissions, role, and tenant data remain owner-controlled.
    - Linked role auth provisioning now updates an existing linked account when its email changes instead of leaving a duplicate auth record.
    - `npm run build` passed.
51. **Role Tab Header Spacing (August 26, 2026)**:
    - Added the same vertical gap below the role workspace hero for Schedule, Profile, and Clinical Work panels as Assigned Clinics.

52. **Supabase Phase 1: Secure Onboarding and Provisioning Foundation (August 26, 2026)**:
    - Added seed-free tenant, clinic, membership, payment, and branch-assignment provisioning migrations for the cloud database.
    - Deployed server-side Edge Functions for registration submission, payment submission, email-only status checks, platform approval, initial-password completion, and Staff/Associate account provisioning.
    - Platform approval now generates a one-time password server-side, creates the real Supabase Auth account, and provisions the subscriber, primary clinic, subscription, owner membership, and approved payment in one database transaction.
    - Staff and Associate accounts are provisioned with validated owner-controlled clinic assignments and branch-scoped role records; browser clients cannot call provisioning RPCs directly.
    - Added a browser-safe onboarding adapter at `src/infrastructure/supabase/onboarding.ts`. The existing legacy `App.tsx` localStorage workflow is intentionally not yet cut over; repository-by-repository UI migration is the next phase.
    - Cloud validation: all six functions are active; security-advisor checks have no Security Definer exposure findings. The remaining database-advisor notes are pre-existing RLS-policy performance warnings.
    - Verification: disposable local end-to-end registration, payment, approval, first-password, Staff provisioning/login, and Associate provisioning/login passed; the local database was reset after the test. `npm run build` and `scope.test.ts` pass.

53. **Phase 1C Registration Supabase Backend Foundation (August 29, 2026)**:
    - Added structured Registration staging fields without provisioning any tenant resources.
    - Added server-only hashed OTP challenges with expiry, attempt limits, resend cooldown/hourly limits, and replay prevention.
    - Added `registration-plans`, `registration-request-otp`, and `registration-verify-otp`; updated registration submit, payment, and status functions.
    - Added service-role-only atomic/idempotent payment and OTP verification RPCs; removed direct anon Registration insert policy.
    - Focused tests: 7 passed. `npm run build`: passed with 0 errors.
    - Status: deployed and validated through the live Phase 1 Registration browser flow; platform approval/provisioning remains outside this phase.

54. **Phase 1D Development/Test Plan Catalog (August 29, 2026)**:
    - Added a tracked, idempotent `public.plans` configuration migration for active Basic, Plus, and Max plans using integer centavos, canonical feature/limit JSON, and the Registration UI's existing 15% annual calculation.
    - Approved Plus quotas are 3 clinics and 6 associates; older 5-clinic/10-associate documentation values are stale.
    - Status: deployed and verified in the development project; the Registration frontend now reads this catalog through `registration-plans`.

55. **Phase 1 Registration Frontend Supabase Cutover (August 29, 2026)**:
    - The existing six-step Registration UI now uses the browser-safe `onboardingApi` adapter and deployed `registration-plans`, `registration-submit`, `registration-request-otp`, `registration-verify-otp`, `registration-submit-payment`, and `registration-status` functions.
    - The runtime no longer uses mock plans, mock registration/OTP/payment services, a hardcoded OTP, a demo payment bypass, or client-authoritative payment pricing.
    - Registration persists only the public continuation ID, registration number, and owner email in session storage; Supabase remains the status authority.
    - The flow stops at `pending_review` / `pending_verification`. Platform approval, provisioning, Auth creation, and temporary-password issuance remain out of scope.
    - **Phase 1 Registration: COMPLETE.** Controlled live backend testing and complete browser E2E were manually validated, including Gmail OTP delivery and real Supabase payment staging.
    - Verified browser registration `REG-2026-3339605B09` for Angelo Dental Clinic selected Plus and persisted the server-authoritative `850000` centavo monthly amount with `pending_review` / `pending_verification` statuses.
    - Next phase: Platform Admin payment review and provisioning only.

56. **Phase 2C.1 Platform Admin Database Foundation (August 29, 2026)**:
    - Added one local-only additive migration for server-authoritative payment review/rejection, registration rejection, durable provisioning claims/retries, structured owner/clinic preservation, subscription billing/price snapshots, and transactional audit events.
    - Privileged RPCs are `SECURITY DEFINER` with an empty `search_path`, unavailable to `PUBLIC`, `anon`, and `authenticated`, and executable only by `service_role`.
    - Clinic Owner access continues through the active subscriber-owner membership; no Clinic Owner `clinic_assignments` row is created.
    - Local rollback execution and `plpgsql_check` passed with zero findings; focused contracts passed 26/26 and `npm run build` passed.
    - Status: implemented and validated locally only. The migration is not deployed, the Admin frontend remains mock-backed, and no Auth user or tenant was provisioned.

57. **Phase 2C.2A Platform Admin Review API Foundation (August 29, 2026)**:
    - Added JWT-protected, Platform Admin-authorized Edge Functions for review queue listing, review detail, payment accept/reject, and registration rejection.
    - Every function derives actor identity from verified claims and checks `public.platform_admins` server-side before using privileged database access.
    - Review responses are explicit safe DTOs; no browser amount, tenant, subscriber, or actor identifiers are accepted for mutation.
    - Deno checks passed for all four functions, focused contracts passed 34/34, and `npm run build` passed.
    - Status at the 2C.2A boundary: implemented locally only and undeployed; Auth/provisioning orchestration was deferred and is now implemented locally in Phase 2C.2B below. The Admin UI remains mock-backed.

58. **Phase 2C.2B Platform Admin Auth, Provisioning, and Credential Orchestration (August 29, 2026)**:
    - Updated the existing JWT-protected `platform-approve-registration` to reuse the shared `platform_admins` authorization boundary, accept only `registrationId`, claim the durable provisioning attempt, resolve Auth identities by the approved conflict/retry rules, and call the four-argument `approve_registration_provisioning` RPC.
    - Auth users created by the current invocation are recorded against the attempt before tenant provisioning and are compensated only when database provisioning did not commit. A post-error ledger read protects committed provisioning from deletion or duplication after a lost response.
    - Approval responses now contain only safe registration/tenant scope and credential-delivery status. Temporary passwords remain transient server memory and are never returned, persisted, audited, or logged.
    - Generalized the existing Registration mail adapter without changing the Phase 1 OTP contract, added post-provisioning initial credential delivery, and added JWT-protected `platform-resend-initial-credential` password rotation without tenant reprovisioning.
    - `subscriber_memberships.must_change_password` remains the authoritative first-login flag; no duplicate password-state field was added to Auth user metadata.
    - Deno checks passed for approval, resend, and Registration OTP; focused Phase 1/2 contracts passed 58/58; `npm run build` passed with 0 errors.
    - Status: implemented and validated locally only. No migration or Edge Function was deployed, no remote Auth/tenant record was created, the Platform Admin UI remains mock-backed, and first-login completion hardening remains separate. Phase 2 is incomplete.

59. **Phase 2C.2C-A First-Login RLS Access Gate (August 29, 2026)**:
    - Confirmed the database authorization defect: active membership/owner/clinic helpers did not consider the authoritative `subscriber_memberships.must_change_password` state.
    - Added one local-only additive migration that requires `account_status = 'active'` and `must_change_password = false` for membership-derived subscriber, owner, and clinic-assignment access while preserving the Platform Admin bypass.
    - Added restricted `get_my_first_login_state()` for authenticated users. It accepts no target identity and returns only the caller's minimal membership routing state plus an explicit multiple-active-owner conflict signal.
    - Local migration reset, 43 pgTAP RLS assertions, schema lint, security advisors, 66 focused Phase 1/2 source contracts, and the production build passed. No migration was deployed and no remote data or Auth identity was changed.
    - `complete-initial-password` hardening remains the next first-login backend step. Frontend login routing and all Phase 2 UI cutovers remain undone; Phase 2 is incomplete.

60. **Phase 2C.2C-B Hardened Initial Password Completion (August 30, 2026)**:
    - Hardened the existing JWT-protected `complete-initial-password` function locally. It accepts exactly `{ newPassword }`, derives the Auth user from verified claims, and requires exactly one active `clinic_owner` membership.
    - Server password validation now requires 12-256 characters with at least one Unicode letter and digit. Already-completed, zero-membership, multiple-membership, Auth-failure, and conditional-finalization states return typed safe errors without provider details.
    - Auth password replacement occurs before a membership-ID/user/role/status/flag conditional update. Success sets `must_change_password = false`, stamps `password_changed_at`, and records `account.initial_password.changed` without credential material.
    - The current bearer token is passed to Supabase Admin `signOut(..., 'others')` after completion to preserve the current session where supported and revoke other refresh-token sessions. Revoked sessions' existing access JWTs can remain valid until expiry; revocation failure is safely audited and does not roll back the completed password transition.
    - Deno check, 24 runtime tests, 80 focused Phase 1/2 contracts, 43 pgTAP RLS assertions, schema lint, security advisors, and the production build passed locally. Frontend login/change-password routing remains unwired, nothing was deployed, and Phase 2 remains incomplete.
