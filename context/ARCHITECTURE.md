# Architecture

## Supabase Local Validation - August 26, 2026

- Local infrastructure is validated through Docker: PostgreSQL, Auth, REST, Realtime, Storage, Edge Runtime, and Mailpit are healthy at the CLI's local endpoints.
- The public registration RLS policy is deliberately constrained to an unpaid, pending-verification submission with no approval, review, or provisioning metadata. Platform provisioning stays server-side.
- A cloud Supabase development project is linked, but no application route has been cut over; localStorage remains the active runtime data source until repository adapters and role-policy tests are introduced.

## Supabase Development Project Link - August 26, 2026

- Cloud development project `cuatwirdydarxvqqqoem` is linked and contains the same three seed-free migrations as local.
- Automatic RLS helper execution has been revoked from public client roles. This preserves automatic RLS behavior while preventing exposed security-definer RPC execution.
- The development cloud database is schema-ready; application persistence remains intentionally uncut-over until repository adapters and end-to-end role tests are implemented.

## Supabase Phase 2 Core Schema - August 26, 2026

- `supabase/migrations/20260826101055_core_tenant_identity_and_branch_scope.sql` is the first database authority contract. It defines Auth profiles, platform access, subscriber membership, clinic assignments, and branch-scoped operational tables.
- Composite foreign keys enforce `clinic_id + subscriber_id` consistency for downstream patient and financial data. This supports owner-level all-clinic aggregation without leaking data between branches.
- The browser connection layer is fail-closed when public Supabase configuration is missing. Service-role operations, payment approval provisioning, and first platform-admin setup remain server-side responsibilities.
- The current production dependency audit is clean; bundle splitting remains a separate performance task.

## Supabase Phase 2 Local Bootstrap - August 26, 2026

- The repository owns a standard Supabase CLI configuration at `supabase/config.toml`; the Docker-backed local stack is running on API port `54321` and database port `54322`.
- The CLI default intentionally does not auto-expose newly created public tables through the Data API. Future migrations must use explicit grants alongside RLS policies.
- This is development infrastructure validation. The current runtime has a fail-closed Supabase client boundary and a linked development cloud project, but no server-backed request path yet.

## Supabase Phase 1 Foundation - August 26, 2026

- The production target is relational: `subscriber_id` is the tenant boundary and `clinic_id` is the branch boundary for operational and clinical rows.
- Supabase Auth will own identities; application membership and assignment tables will own role authorization. RLS, not frontend route guards, will enforce production access.
- See `context/supabase_phase_1_foundation.md` for the proposed table map, approval transaction boundary, storage plan, and policy matrix.

## Full-System Diagnostic Boundary - August 26, 2026

- Current architecture has a local Supabase client boundary, SQL migrations, RLS policies, Docker-backed validation, and a linked cloud development project. It still lacks server workflows, repository cutovers, and deployment configuration.
- Existing tenant and role isolation is enforced in client services and route guards only; production authorization must move to server-side policies.
- Build succeeds, but the single bundled route shell is large and should be split before production rollout.

## Layers

- Clinic Owner layer: `/clinic/*`
- Clinic Subsystem layer: `/clinic/:clinicId/*`
- Platform Owner layer: `/platform/*`

## Batch 1 Auth & Seed Cleanup Checkpoint - August 25, 2026

- Login is now read-only for provisioning: `mockAuthService.login` validates against `pnj_mock_users` and no longer creates a missing auth user from registration or platform-user fallback data.
- Approval/provisioning remains the intended creator of clinic-owner auth rows, temporary passwords, subscribers, subscriptions, and primary clinics.
- Deleted subscriber emails remain blocked during login. Fresh signup/provisioning can explicitly create new state, but sign-in itself does not revive deleted accounts.
- Platform Users no longer assign orphan Associate Dentist or Staff records to a default subscriber or `CLN-SUB-396924`. Personnel rows without a valid `subscriberId` are ignored until properly scoped.
- Laboratory initialization no longer auto-creates partner labs from registration `worksWithLab` fields. Lab records must be created by an explicit owner/platform workflow after approval.

## Batch 2 Approval-Only Provisioning Checkpoint - August 25, 2026

- Pending signup/payment submissions remain registration/payment records only. `mockSubscriptionService.listSubscriptions()` derives temporary pending subscription display rows from registrations without persisting subscribers, clinics, auth users, or real subscriptions.
- Payment approval is the provisioning boundary. `mockPaymentService.approveRegistrationPayment()` is responsible for generating/syncing the temporary password and creating the subscriber, owner platform user, auth login, primary clinic, and active subscription.
- `mockPlatformManagementService.listSubscribers()` is read-only and no longer creates subscribers from approved registrations.
- `tenantScope.ts` is read-only during clinic owner route resolution and reports missing provisioning instead of silently creating tenant records.

## Batch 3 Temp Password, Branch Guard, and Route Verification Checkpoint - August 26, 2026

- `mockAuthService.login` now resolves session `clinicName` from the linked clinic/subscriber record instead of copying the raw branch `clinicId` into session state.
- Email-only account status checks return `ready` only when an auth credential exists. Approved records with missing provisioning are shown as setup-incomplete pending records so the platform operator can re-run payment approval.
- Approval repair issues a fresh temporary password only for users still in `mustChangePassword` state. Users who already changed their password keep their real password.
- `completePasswordChangeByEmail` clears registration `tempPassword` after first-login password setup, while preserving `account_ready` status.
- `/clinic/:clinicId/*` branch routes are authorized against the logged-in subscriber. Branch IDs from another subscriber now resolve to a restricted/not-found workspace instead of opening cross-tenant data.
- Master File Directory owner scope remains `/clinic/directory/*`; branch scope remains `/clinic/:clinicId/master-files/*`.

## Batch 4 Fresh-Test Reset and Backup Coverage Checkpoint - August 26, 2026

- Approval repair is fully idempotent for changed-password clinic owners: platform user `mustChangePassword` remains false, registration `tempPassword` remains blank, and real passwords are preserved.
- Backup/restore now has a `branch_workspace` module so branch clinical records are visible to backup manifests, restore previews, storage footprint summaries, and pre-reset checkpoints.
- Dynamic branch/patient localStorage keys are included through prefixes for branch settings, patient directory drafts, progress notes, bills, appointments, dental recalls, dental chart history, certificates, uploads, scratchpad notes, follow-up lists, and treatment records.
- Emergency reset continues to clear non-session prototype data for a fresh test environment, then reinitializes only platform-support baselines; the app-level reset flow signs the user out and returns to login.

## Batch 5 Registration Visibility and Owner Routing Checkpoint - August 26, 2026

- `mockPlatformManagementService.listSubscribers()` now includes derived pending subscriber projections from `pnj_mock_registrations` for records that are still `unpaid` or `pending_verification`. This keeps the Clinic Owners workflow visibly pending before approval instead of relying only on persisted subscriber records.
- `mockPaymentService.listPayments()` now includes derived registration payment projections for registrations that are still `unpaid` or `pending_verification` and do not yet have a persisted payment row. This keeps Payments & Receipts aligned with the same onboarding pending state.
- `mockPaymentService.approveRegistrationPayment()` now skips projected `PAY-PENDING-*` display rows and creates a real payment ledger record before approval when no persisted payment exists.
- `mockClinicService.listClinics()` now includes derived pending clinic projections from registration records, so the Dental Clinics registry can show the registered clinic as `pending` before approval and then swap to the real persisted clinic after approval.
- `mockPlatformManagementService.purgeRequestedPendingRegistration()` now uses a new cleanup marker version and broader cascade matching by registration ID plus normalized email-linked payment rows. This lets existing browsers re-run the cleanup for the retired `sad@gmail.com` ghost record and also removes that retired email from the deleted blacklist so future fresh registrations are not accidentally blocked.
- `App.tsx` signup checkout now calls only `centralizedPaymentService.submitRegistrationPayment`. The old parallel legacy `mockPaymentService.submitPayment` path was removed so onboarding no longer writes malformed duplicate payment rows into the shared local payment ledger.
- `mockPlatformManagementService.ensureSeedData()` now runs a second cleanup sweep based on the deleted blacklist to remove orphaned artifacts across registrations, payments, subscribers, platform users, auth users, clinics, subscriptions, dentists, and staff.
- `PaymentsPage.tsx` KPI cards now show real summary values only, so an empty payments ledger no longer looks like it still has verified cash collections.
- `ClinicBranchesPage.tsx` now recognizes `pending` clinic status in the clinic owner branch directory instead of folding it into an archived-looking display state.
- The clinic owner shared Master File Directory was removed from sidebar navigation. Owner visits to `/clinic/directory/*` now stop at an explanatory return screen, while branch-only master files continue under `/clinic/:clinicId/master-files/*`.

## Batch 6 Stale-Safe Purge Control Checkpoint - August 26, 2026

- `mockBackupRestoreService.staleSafePurge()` now provides a targeted prototype cleanup path that clears processed platform ledgers and linked branch workspace traces without wiping platform admin auth, settings baselines, or restore checkpoints.
- The purge targets subscribers, platform users, registrations, subscriptions, payments, clinics, laboratories, staff, associate dentists, deleted-blacklist artifacts, OTP leftovers, notifications, activity logs, audit logs, and dynamic branch clinical storage keys.
- `App.tsx` now exposes this cleanup through a platform-owner-only navbar control beside `Prototype Mode`, guarded by a typed confirmation phrase: `PURGE STALE DATA`.
- This creates a pre-purge checkpoint first, then dispatches `DATA_RESTORE_COMPLETED` so platform and branch screens can refresh against the cleaned state.

## Multi-Branch Subsystem Architecture & Storage Partitioning

```mermaid
graph TD
    Owner[Clinic Owner Console /clinic/...] -->|Consolidated Aggregations & Branch Filtering| MultiBranchPool[Unified Platform Data Layer]
    
    MultiBranchPool -->|Partition: clinicId = CLN-SUB-396924| SubsystemAngelo[Angelo Dental Clinic Workspace]
    MultiBranchPool -->|Partition: clinicId = CLN-1787478722569-296| SubsystemPantua[Pantua Dental Clinic Workspace]
    
    subgraph "Angelo Dental Clinic Partition"
        SubsystemAngelo --> PatientsA[Patients: Angelo Dental Clinic]
        SubsystemAngelo --> SchedA[Calendar & Waitlist: Angelo Clinic]
        SubsystemAngelo --> DentistsA[Designated Dentists for Angelo]
        SubsystemAngelo --> StaffA[Designated Staff for Angelo]
        SubsystemAngelo --> SettingsA[Branch Settings: Angelo Profile]
    end
    
    subgraph "Pantua Dental Clinic Partition"
        SubsystemPantua --> PatientsB[Patients: Pantua Dental Clinic]
        SubsystemPantua --> SchedB[Calendar & Waitlist: Pantua Clinic]
        SubsystemPantua --> DentistsB[Designated Dentists for Pantua]
        SubsystemPantua --> StaffB[Designated Staff for Pantua]
        SubsystemPantua --> SettingsB[Branch Settings: Pantua Profile]
    end
```

- **Branch-Scoped Storage Partitioning**:
  - The selected `clinicId` remains in the route URL (`/clinic/:clinicId/...`) for every branch operation.
  - Patient Directory (`patientDirectoryStore.ts`) tags every patient with `clinicId` and `clinicName`. `loadPatientDirectoryRecords(clinicId)` ensures queries in a branch workspace only return patients registered in that branch.
  - `savePatientDirectoryRecords(records, clinicId)` merges branch records into the global database so saving in one clinic never wipes or impacts other clinics.
  - Calendar and Appointments (`scheduleStorage.ts`) tag items with `clinicId` and scope `getClinicScheduleItems` and `saveClinicScheduleItems` by `clinicId`.
  - Branch Settings (`branchSettingsStore.ts`) are stored under `pnj_mock_branch_settings_<clinicId>` and dynamically populate new branches from `mockClinicService`.

## Personnel Designation (Associate Dentists & Staff)

- Associate Dentists (`mockAssociateDentistService.ts`) and Staff (`mockStaffService.ts`) track designated branches via `clinicIds` and `authorizedClinics`.
- `listDentistsForClinic(clinicId)` and `listStaffForClinic(clinicId)` filter personnel assigned to that active branch.
- Within the branch workspace:
  - Appointment dentist pickers only show authorized dentists.
  - Daily Reports & Daily Results (`DentistStaffDailyLedger.tsx`) only list dentists and staff on duty for that branch.
- Within the Clinic Owner Console (`/clinic/dentists`, `/clinic/staff`), the owner can assign dentists/staff to specific branches or multi-branch coverage.

## Subscription Gatekeeper & Real Quota Enforcement Architecture

```mermaid
graph TD
    UserAccess[Clinic Route Request: /clinic/*] --> Guard{Subscription Status Guard}
    Guard -->|Active / Approved| Normal[Access Permitted: Multi-Branch Workspaces]
    Guard -->|Suspended / Expired / Cancelled| Lock[SubscriptionLockedScreen: Access Restricted]
    Lock --> Pay[Remittance Submission Flow]
    Pay --> Ledger[mockPaymentService: Pending Verification]
    
    SubAdd[Creation Workflows: Branch / Dentist / Staff] --> QuotaCheck{Plan Quota Engine: mockPlanService}
    QuotaCheck -->|Under Quota Limit| Allow[Allow Creation & Storage Persistence]
    QuotaCheck -->|At / Over Quota Limit| Block[Block Submission & Display Upgrade Banner]
```

- **Navigation Guard**: In `App.tsx`, active subscriptions are evaluated against the current route. If an account is suspended or expired, the `SubscriptionLockedScreen` replaces the operational workspace with an interactive GCash renewal modal.
- **Quota Engine**: `ClinicBranchCreatePage.tsx`, `ClinicLaboratoryFormPage.tsx`, `AssociateDentistFormPage.tsx`, and `StaffFormPage.tsx` calculate real-time resource allocations against the subscriber's active plan limits (`Basic`: 1 branch / 1 dentist / 0 labs / 3 staff; `Plus`: 3 branches / 6 dentists / 2 labs / 20 staff; `Max`: Unlimited), proactively rendering capacity warning alerts and disabling creation submissions.

## Registration Approval Provisioning Architecture

```mermaid
flowchart TD
    AdminApprove[Platform Admin approves registration payment] --> AppHandler[App.tsx handleApprovePayment]
    AppHandler --> Centralized[centralizedPaymentService.approveRegistrationPayment]
    Centralized --> PaymentService[mockPaymentService.approveRegistrationPayment]
    PaymentService --> Idempotent{Payment already verified?}
    Idempotent -->|Yes| Repair[Repair provisioning links]
    Idempotent -->|No| Approve[Mark payment verified / approved]
    Repair --> Provision[mockPlatformManagementService.createSubscriberFromApprovedRegistration]
    Approve --> Provision
    Provision --> Subscriber[Subscriber upsert]
    Provision --> OwnerUser[Platform clinic owner user upsert]
    Provision --> AuthUser[Auth login upsert with temp password]
    Provision --> Registration[Registration synced: account_ready, subscriberId, userId, tempPassword]
    Registration --> SuccessModal[Temporary password success modal]
```

- **Single Approval Owner**: `App.tsx` no longer calls both centralized and legacy local payment approval. The centralized payment service is the only approval entry point from the Platform UI.
- **Idempotent Repair**: Re-approving an already verified payment triggers a provisioning repair pass instead of failing. This protects against cases where a payment was approved but the subscriber, owner user, auth login, or registration links were stale/missing.
- **Owner Login Upsert**: `mockPlatformManagementService.createOwnerUserForSubscriber` updates existing platform/auth users by owner email or creates them when absent. Users still flagged `mustChangePassword` receive a fresh random temporary password on approval/repair; users who already changed passwords keep their existing credential.
- **Registration Back-Sync**: Approved registration records are always updated with `paymentStatus: approved`, `registrationStatus: account_ready`, `subscriberId`, `userId`, `tempPassword`, and `updatedDate`.
- **Email-Only Status Lookup**: `/login` now supports email-only approval checking. `App.tsx` resolves the email against registrations, subscribers, and platform owner users, then returns a custom `ready`, `pending`, `rejected`, or `not_found` UI card. Ready accounts can copy the synced temporary password without requiring a browser alert or password entry.
- **First-Login Password Change**: Approved clinic-owner accounts with `mustChangePassword` are routed to `/clinic/change-password` after temp-password login. `App.tsx` validates the temporary password and new password rules, then `mockPlatformManagementService.completePasswordChangeByEmail(email)` clears first-login flags, syncs auth status, updates `lastLoginAt`, and routes to the Clinic Owner dashboard.
- **Branch Route Authorization**: `App.tsx` verifies that the branch loaded from `/clinic/:clinicId/*` belongs to the logged-in subscriber before rendering the subsystem workspace.
- **Phase 5 Tenant Isolation**: Clinic Owner console datasets now resolve the logged-in owner email to a subscriber context, then scope branches, staff, dentists, laboratories, patient aggregates, financial summaries, analytics, daily reports, and activity feeds to that subscriber. Master File Directory owner/branch route separation remains a later phase.
- **Phase 6 Branch/Sub-System Patient Clinical Isolation**: Patient clinical records inside `/clinic/:clinicId/*` now persist under patient + clinic scoped keys so branch workspaces no longer share progress notes, bills, appointments, recalls, dental chart records, certificates, or contract/patient form state.
- **Phase 7 Master File Directory Route Isolation**: Owner master files use `/clinic/directory/*`; branch master files use `/clinic/:clinicId/master-files/*`. Both scopes reuse the Master File Directory UI, but route base, back navigation, navbar behavior, and clinic context are explicitly separated to prevent owner console navigation from jumping into a branch subsystem.
- **Phase 8 Verification + Context Sync**: Confirmed the Phase 7 owner/branch route split remains documented across context files and verified the project build with 0 errors.

## Subscriber / Tenant Data Isolation Architecture

```mermaid
flowchart TD
    LoginEmail[Logged-in clinic owner email] --> SubscriberLookup[mockPlatformManagementService: subscriber/user lookup]
    SubscriberLookup --> TenantScope[tenantScope.ts subscriberId resolver]
    TenantScope --> OwnerConsole[Clinic Owner Console]
    OwnerConsole --> Branches[mockClinicService.getClinicsBySubscriberId]
    OwnerConsole --> Dentists[mockAssociateDentistService.getDentistsBySubscriberId]
    OwnerConsole --> Staff[mockStaffService.getStaffBySubscriberId]
    OwnerConsole --> Labs[mockLaboratoryService.getLaboratoriesBySubscriberId]
    Branches --> Patients[patientDirectoryStore records scoped by clinicId]
    Patients --> Financials[aggregateClinicFinancials(scopedPatients)]
    Financials --> Reports[Dashboard / Sales / Analytics / Daily Reports / Activity Feed]
```

- **Tenant Scope Utility**: `src/features/clinic-owner/services/tenantScope.ts` normalizes subscriber IDs and supports the legacy primary aliases (`SUB-000001`, `SUB-396924`, `sub_001`) so older Angelo records remain readable without leaking into unrelated subscribers.
- **Owner Console Scoping**: `ClinicOwnerDashboardPage.tsx`, `GeneralSettingsPage.tsx`, `StaffManagementPage.tsx`, `AssociateDentistsPage.tsx`, `StaffFormPage.tsx`, and `AssociateDentistFormPage.tsx` now use subscriber-scoped branch, staff, dentist, and laboratory datasets.
- **Scoped Aggregation**: Clinic Owner dashboard widgets, Sales Overview, Analytics resource snapshots, Daily Reports, and Activity Feed pass subscriber branch patients into `aggregateClinicFinancials(scopedPatients)` instead of using global ledgers.
- **Activity Feed Branch Labels**: `ActivityFeed.tsx` receives subscriber and branch context, resolves branch names through `mockClinicService.getClinicsBySubscriberId(subscriberId)`, and uses scoped branch labels in timeline messages instead of fixed clinic names.
- **Personnel Assignment Safety**: Staff and Associate Dentist steppers only show clinics and laboratories owned by the current subscriber. Daily Reports branch matching accepts branch IDs, branch names, and branch codes for backwards compatibility with older saved personnel records.

## Branch / Sub-System Patient Clinical Isolation Architecture

```mermaid
flowchart TD
    BranchRoute[/clinic/:clinicId/*] --> PatientRecord[Patient record with clinicId]
    PatientRecord --> ClinicalScope[patientClinicalStorage.ts]
    ClinicalScope --> Notes[clinicProgressNotes:clinicId:patientId]
    ClinicalScope --> Bills[clinicBillPayments:clinicId:patientId]
    ClinicalScope --> Appts[clinicAppointments:clinicId:patientId]
    ClinicalScope --> Recalls[clinicDentalRecalls:clinicId:patientId]
    ClinicalScope --> Chart[clinicDentalChart(s):clinicId:patientId]
    ClinicalScope --> Docs[clinicCertificates / patientContractForm:clinicId:patientId]
    Notes --> SyncChain[Progress Note Sync Chain]
    SyncChain --> Bills
    SyncChain --> Appts
    SyncChain --> Recalls
    SyncChain --> Calendar[scheduleStorage clinic schedule partition]
```

- **Scoped Key Contract**: `src/features/clinic-subsystem/patients/clinical/shared/patientClinicalStorage.ts` centralizes `${prefix}${clinicId}:${patientId}` keys and legacy `${prefix}${patientId}` fallback reads.
- **Active Write Target**: New and edited clinical records write to the active patient's `clinicId`; legacy keys are read only as a migration fallback.
- **Synchronized Clinical Chain**: Saving a progress note can create or update linked bills, patient appointment recalls, dental recalls, and calendar recall items inside the same clinic partition only.
- **Safe Cleanup**: Deleting a patient, deleting a progress note, or removing linked recalls purges only the matching patient + clinic records and does not touch records in sibling branches.
- **Balance Safety**: Billing balance updates match both `patientId` and `clinicId` before mutating a patient directory record.

## Master File Directory Routing Architecture

```mermaid
flowchart TD
    OwnerConsole[Clinic Owner Console] --> OwnerDirectory[/clinic/directory/*]
    OwnerDirectory --> OwnerContext[OWNER-MASTER-FILES context]
    OwnerDirectory --> OwnerBack[/clinic/dashboard]
    BranchConsole[Branch Subsystem] --> BranchDirectory[/clinic/:clinicId/master-files/*]
    BranchDirectory --> BranchContext[active currentClinic context]
    BranchDirectory --> BranchBack[/clinic/:clinicId/dashboard]
    OwnerDirectory --> SharedRenderer[renderMasterFileDirectoryContent(routeBase, context)]
    BranchDirectory --> SharedRenderer
```

- **Owner Scope**: `App.tsx` treats `/clinic/directory` and nested `/clinic/directory/*` as Clinic Owner routes, not branch routes.
- **Current Owner UX**: Owner scope no longer opens editable master-file content. The route now exists only as a safe redirect/notice so branch isolation is preserved.
- **Branch Scope**: `/clinic/:clinicId/master-files/*` remains a branch route and uses the active clinic ID for section URLs and PDF Designer context.
- **Reusable Route Base**: `MasterFileDirectoryLayout`, `MasterFileDirectorySidebar`, `MasterFileNavGroup`, and `MasterFileDirectoryDashboardPage` accept `routeBase` and back-navigation props so the same UI can render safely in either scope.
- **Navigation Guard**: In owner scope, navbar Add Patient redirects to clinic branches with a toast because patient creation is branch-only.


## Central Financial & Clinical Aggregation Architecture

- **Single Source of Truth**: `aggregateClinicFinancials(inputPatientsOrDate, targetDate)` in `billPaymentStore.ts` serves as the central data bridge across the entire platform.
- **Dynamic Scoping**:
  - When passed a branch-filtered patient array `aggregateClinicFinancials(patients)`, it computes revenue, collections, outstanding balances, and dentist productivity strictly for that branch.
  - When called without arguments, it aggregates company-wide figures across all branches for Clinic Owner executive dashboards and sales reports.
- **Aggregation Pipeline**:
  1. Gathers registered patients from `patientDirectoryStore.ts` (filtered or global).
  2. Traverses all patient + clinic scoped billing records (`clinicBillPayments:${clinicId}:${patientId}`) and clinical progress notes (`clinicProgressNotes:${clinicId}:${patientId}`), with legacy patient-only keys read only as a migration fallback.
  3. Computes:
     - `grossBilled`: Total value of all clinical service lines and procedure invoices.
     - `totalCollected`: Total cash, digital, and card payments received.
     - `totalOutstanding`: Real-time receivables balance (`payableAmount - paidAmount`).
     - `paymentMethodTotals`: Exact distribution across Cash, GCash/Maya, Credit Card, and HMO.
     - `todayCollections`: Segregated cash and digital collections for End-of-Day (EOD) audit.
     - `dentistProduction`: Tally of procedures performed and revenue attributed per attending dentist.
     - `allServices`: Flat list of all clinical procedures performed with line costs and quantities.
- **Reactive Event Bus**:
  - `clinic-bill-payments:updated`
  - `clinic-progress-notes:updated`
  - `clinic-subsystem:patients-updated`
  - `clinic-schedules:updated`
  - `branch-settings:updated`
  - `AUDIT_LOG_APPENDED`
  - `NOTIFICATION_STATE_CHANGED_EVENT`
  - `PLATFORM_SETTINGS_CHANGED_EVENT`
  - `storage`
  These events trigger reactive state re-renders across Subsystem Dashboards, Clinic Owner Dashboard, Sales Overview, Clinic Analytics, Notification Bell, and Daily Reports.

## Zero-Mock Real Event Stream Architecture (Phase 1)

```mermaid
flowchart LR
    EventTrigger[User / System Event] --> AuditStream[mockAuditService: Event Appended]
    EventTrigger --> NotificationEngine[mockNotificationService: Alert Dispatched]
    NotificationEngine --> BellUI[Top Nav Notification Bell & Dropdown]
    NotificationEngine --> CenterUI[Notifications Central Page]
    AuditStream --> AuditLedger[Audit Logs 500px Table & Integrity Hash Chain]
```

- **Event-Driven Audit & Notifications**: Hardcoded static mockup records in Announcements, Audit Logs, and Notifications have been replaced with 100% genuine user and system action triggers with zero mock clutter.
- **Empty States**: If zero items exist in a filtered dataset or the system starts fresh, structured empty state visual containers are rendered without fallback to synthetic mock arrays.

## Auth Provisioning & Dynamic Temporary Password Architecture

```mermaid
flowchart TD
    Reg[User Registration in pnj_mock_registrations] --> AdminApprove[Platform Admin Approves Payment]
    AdminApprove --> GenPass[generateSecureTemporaryPassword]
    GenPass --> RegPass[Save tempPassword to Registration]
    GenPass --> UserPass[Save tempPassword to PlatformUser]
    GenPass --> AuthPass[Save passwordHash & mustChangePassword to pnj_mock_users]
    AdminApprove --> Modal[Approval Modal Displays Temp Password]
    Modal --> FirstLogin[User Logs In with Registered Email & Temp Password]
    FirstLogin --> ValidateAuth[Validate against pnj_mock_users]
    ValidateAuth --> ForceChange[Force Password Change Screen]
    ForceChange --> Dashboard[Access Clinic Owner Console]
```

- **Single Source of Truth**: Removed static fallback passwords (`MOCK_TEMP_PASSWORD`, `DEFAULT_TEMP_PASSWORD`). Temporary passwords are created dynamically at approval time via `generateSecureTemporaryPassword()`.
- **Sync & Blacklist**: Synchronized to registration, user profile, and auth storage (`pnj_mock_users`). When an account is deleted, credentials are removed and the email is blacklisted in `DELETED_SUBSCRIBERS_KEY` to block reuse of old temporary passwords.
## One-Time Browser Store Cleanup

- `mockPlatformManagementService.ensureSeedData()` runs a versioned, one-time migration for the explicitly retired registration `REG-2026-000002`.
- The migration cascades by exact registration ID, normalized email, and discovered linked IDs across platform local-storage ledgers.
- A cleanup marker prevents reruns without turning the retired email into a permanent blacklist.

## Branch-Scoped Assignment and Financial Aggregation - August 26, 2026
- Staff and associate laboratory assignments validate against the real subscriber laboratory ledger.
- Associate creation maps selected clinics to real `clinicId` values and never writes the legacy seed branch.
- Owner dashboards aggregate authorized clinics; branch performance recalculates independently per clinic.
- Missing `clinicId` is treated as invalid scope instead of being silently mapped to the primary branch, preventing cross-branch leakage.
- Associate legacy cleanup excludes the valid reusable `DEN-000001` sequence; only explicit legacy seed IDs and seed emails are purged.
- Verification contract confirms branch financial isolation and all-branch aggregation from the same scoped bill store.

## Staff and Associate Authentication Boundary Audit - August 26, 2026
- Staff and Associate Dentist domain records are separate services/types, but authentication currently has no provisioning adapter from those records into `pnj_mock_users`.
- `App.tsx` supports role values for `associate` and `staff` in the type model, yet its post-login route decision only distinguishes platform owner from the clinic-owner flow.
- The future boundary must resolve role, `subscriberId`, `clinicIds`, status, and permissions from one authenticated identity before rendering any workspace or branch route.
- Existing owner and branch layouts should be reused only behind role-aware route guards; no role may inherit owner navigation by default.

## Staff and Associate Provisioning Boundary - August 26, 2026
- `roleAccountProvisioningService` is the current adapter between owner domain records and the shared prototype auth ledger.
- It preserves tenant and branch boundaries by resolving selected clinic names to real clinic IDs under the submitted `subscriberId`.
- The adapter rejects duplicate login emails and invalid empty clinic scope, and supports rollback at the form boundary when provisioning fails.
- Role-aware routing is intentionally deferred to Phase 3 so the identity record is established first.

## Role-Aware Workspace Routing - August 26, 2026
- Authenticated Staff and Associate users enter dedicated workspace routes rather than the owner console.
- The workspace resolves branch cards from persisted `clinicIds`; branch entry is allowed only when the ID is assigned to the authenticated account.
- `ClinicWorkspaceLayout` and `ClinicSubsystemSidebar` accept the account role and remove owner-only navigation.
- Route checks supplement hidden navigation to prevent direct URL access to unassigned branches or restricted modules.

## Permission Session Boundary - August 26, 2026
- Domain privileges are now part of the provisioned auth identity and session boundary.
- Navigation and route guards can consume the same permission map, avoiding separate stale permission state.
- Current enforced example: Associate `viewCalendar`; action-level patient/billing/expense guards remain to be applied module by module.

## Live Workspace Identity Sync - August 26, 2026
- Workspace presentation resolves `linkedRecordId` against the same domain service used by the Clinic Owner console.
- This prevents stale duplicated Staff/Associate profile state in the role workspace.
- Missing or inactive records are treated as unavailable access and are not represented as active workspace identities.

## Assigned-Clinic Operational Sync - August 26, 2026
- Role workspace schedules use the same clinic-scoped schedule ledger as the branch Calendar module.
- Aggregation is restricted to authenticated assigned clinic IDs, preserving branch isolation.
- Event-driven refresh keeps workspace schedule data synchronized with branch scheduling changes.

## Branch Patient Mutation Boundary - August 26, 2026
- Patient data remains partitioned by `clinicId` through `patientDirectoryStore`.
- The branch Patients module receives permissions from the authenticated role session rather than a separate mock permission source.
- Edit and delete actions are guarded at both rendering and handler boundaries.

## Appointment Permission Boundary - August 26, 2026
- Calendar creation actions consume the authenticated role permission map.
- Associate `viewAppointments` controls appointment/event creation visibility and execution.
- Branch appointment records remain read/written through the clinic-scoped scheduling stores.

## Final Role Flow Verification - August 26, 2026
- Password-change completion preserves the authenticated role boundary.
- Role workspace routing remains the single post-auth destination for Staff and Associate accounts.
- No platform or clinic-owner identity is modified by Staff/Associate password completion.
- Verification note: primary branch isolation contract passes; the legacy tenant fixture needs alignment with the clean seed policy.

## Payment State Compatibility - August 26, 2026
- Platform payment actions use canonical payment `status` as a fallback when older records have incomplete `verificationStatus` values.
- This prevents a pending payment from becoming a ghost state in the action menu while preserving the existing approval synchronization pipeline.

## Approval Data Lifecycle Safety - August 26, 2026
- `mockPlatformManagementService.ensureSeedData()` may normalize known seed/deleted markers but must not perform email-specific destructive cleanup.
- Registration approval is an update/provisioning transition, not a delete operation.
- Registration, payment, subscriber, subscription, clinic, and auth records remain linked by registration/subscriber IDs after approval.

## Personnel Authentication Boundary - August 26, 2026
- The Staff and Associate record is the source for the login email and configured password.
- `roleAccountProvisioningService` creates or updates the shared auth record with role, subscriber, clinic assignments, and privileges.
- `mockAuthService.login` then establishes a role-aware session; workspace guards enforce the assigned clinic boundary.

## Role Workspace Boundary - August 26, 2026
- `/associate/workspace` and `/staff/workspace` are the role-level return destinations.
- `/clinic/:clinicId/*` is permitted only when the clinic is assigned to the authenticated personnel account.
- `/clinic/dashboard` and other owner-console static routes are not valid Staff/Associate destinations.
- Subsystem navigation is generated by role, with Staff's explicitly approved clinical modules restored.

## Navbar Identity Boundary - August 26, 2026
- Subsystem navbar identity is derived from the session role, not from a hardcoded clinic label.
- The second identity line is derived from the currently opened assigned clinic/branch.

## Role UI Composition - August 26, 2026
- `RoleWorkspacePage` is the shared role landing composition; its data remains sourced from assigned clinic IDs, schedule storage, and linked role records.
- `DashboardPage` accepts a role variant for section labels and role-specific copy without changing branch data aggregation.
- `index.css` contains the shared role workspace visual system and responsive breakpoints; no tenant or permission logic is embedded in styling.
## Role Console Shell - August 26, 2026
- `RoleConsoleLayout` composes `RoleConsoleSidebar`, the shared owner-baseline header, announcements, and `RoleWorkspacePage`.
- This is a presentation shell only; existing role guards and `subscriberId`/`clinicId` data partitioning remain authoritative.
## Role Navbar Identity Polish - August 26, 2026
- `ClinicOwnerHeader` accepts an optional role label and renders role-first identity without changing authorization.
## Role Workspace Tabs - August 26, 2026
- `RoleConsoleSidebar` produces role workspace section routes; `RoleWorkspacePage` derives the active section from the route hash.
- Hash changes are presentation/navigation state only and do not affect tenant, branch, or authorization boundaries.
## Role Profile and Navbar Safety - August 26, 2026
- `RoleWorkspacePage` edits only linked-record personal/contact fields and delegates persistence to the role service.
- `roleAccountProvisioningService.sync` reconciles the linked auth record by `linkedRecordId`, preventing duplicate users after email edits.
- Owner-controlled clinic IDs, privileges, tenant IDs, and role values are not exposed in the personnel edit form.
## Role Tab Header Spacing - August 26, 2026
- Shared role workspace grid spacing is applied consistently across all role sections.

## Supabase Phase 1 Onboarding Boundary - August 26, 2026
- Public registration flow: `registration-submit -> registration-submit-payment -> platform-approve-registration`.
- Privileged approval and personnel provisioning execute only in Supabase Edge Functions using the service role; the browser uses the publishable key and invokes functions only.
- `approve_registration_provisioning` and `provision_member_account` are `SECURITY DEFINER` database operations, explicitly revoked from `anon` and `authenticated`, and granted only to `service_role`.
- Every provisioned resource is linked by `subscriber_id`; every branch-facing assignment and domain record is additionally scoped by `clinic_id`.
- Supabase Auth is now the intended identity authority. The current localStorage auth/services are a temporary UI compatibility layer and must be replaced incrementally with scoped repositories rather than merged with cloud data.
- No seed rows are created by migrations or functions. A trusted platform-admin bootstrap and real subscription-plan setup are required in each environment before live onboarding.

## Phase 1C Registration Backend Foundation - August 29, 2026
- Public flow foundation: `registration-plans -> registration-submit -> registration-request-otp -> registration-verify-otp -> registration-submit-payment -> registration-status`.
- Plans remain unreadable directly by anon users; the catalog Edge Function returns only active display-safe fields.
- Registration OTP hashes are server-only, registration/email-bound, expiring, attempt-limited, resend-limited, and consumed on success.
- Payment insertion and registration transition are atomic and idempotent through `submit_registration_payment_atomic`, executable only by `service_role`.
- The frozen Registration UI is cut over through `onboardingApi`; the Registration runtime has no mock/local status, OTP, payment, or plan source.

## Phase 1D Development Plan Catalog - August 29, 2026
- Tracked configuration defines active `basic`, `plus`, and `max` plans in `public.plans` by stable `plan_code`.
- Development/test prices are ₱5,000/₱51,000, ₱8,500/₱86,700, and ₱10,000/₱102,000 monthly/annual; annual values match the existing Registration UI 15% calculation.
- This catalog is platform configuration and is consumed by the Registration frontend only through the public-safe `registration-plans` Edge Function.

## Phase 1 Registration Frontend Cutover - August 29, 2026
- The approved UI now follows `existing registration screen -> onboardingApi -> public Edge Function -> Supabase` for all six registration steps.
- Browser persistence is limited to a session-scoped continuation tuple of registration UUID, registration number, and normalized owner email; OTPs, hashes, secrets, and pricing authority are never persisted in the browser.
- The backend owns active catalog data, OTP delivery/verification, payment pricing, payment idempotency, and status. The browser uses only the publishable key.
- The boundary remains `registration_status = pending_review` and `payment_status = pending_verification`; privileged approval and provisioning stay separate.
- Phase 1 is complete and manually validated against the linked development project. The verified Plus browser flow persisted the server-derived monthly amount of `850000` centavos; Gmail OTP delivery and public status lookup were confirmed.

## Phase 2C.1 Platform Admin Database Foundation - August 29, 2026
- Local target flow: `pending_review + approved payment -> begin_registration_provisioning -> later server-side Auth resolution -> approve_registration_provisioning -> profile/subscriber/owner membership/subscription/primary clinic/audit`.
- Payment review is a separate atomic operation and never provisions tenant resources. Registration rejection is blocked after payment approval until a refund workflow exists.
- `registration_provisioning_attempts.registration_id` is the durable idempotency anchor; existing subscriber/current-subscription/primary-clinic constraints and new payment/attempt constraints prevent duplicates.
- The migration remains local and unapplied remotely. Admin reads and server orchestration are now implemented locally in Phase 2C.2A/2C.2B; coordinated deployment and frontend cutover remain subsequent work.

## Phase 2C.2A Platform Admin Review API Foundation - August 29, 2026
- Authenticated review flow: `verified user JWT -> shared platform_admins ledger check -> service-role server query/RPC -> safe DTO or typed error`.
- Queue/detail endpoints expose only review fields. Mutation endpoints accept only review identifiers, decision, and bounded rejection reason; actor identity remains server-derived.
- Payment acceptance ends at `payment approved + registration pending_review`; no API in this phase creates Auth, subscriber, membership, clinic, or subscription records.
- These functions depend on the local Phase 2C.1 migration and are not deployed or connected to frontend runtime.

## Phase 2C.2B Auth and Tenant Provisioning Orchestration - August 29, 2026
- Local approval flow: `verified Admin JWT -> shared platform_admins check -> begin_registration_provisioning(registration, actor) -> ledger-proven Auth resolution -> approve_registration_provisioning(registration, attempt, owner user, actor) -> server-only credential email -> safe attempt delivery state/audit`.
- `registration_id` remains the idempotency anchor. Completed/database-provisioned retries read existing scope; claimed attempts return an in-progress conflict; failed attempt reuse requires the exact recorded `auth_user_id`, `auth_user_created_by_attempt = true`, matching normalized email, and no subscriber membership.
- A newly created Auth identity is compensatable only before database commit and only by the invocation that created it. The Edge Function re-reads durable attempt state after an RPC error before considering deletion.
- Database tenant writes remain exclusively inside the transactional four-argument RPC. The Edge Function creates no subscriber, membership, subscription, clinic, payment, or clinic-assignment row directly.
- Credential delivery is post-commit. Delivery failure records only bounded safe state/code and does not roll back tenant provisioning; resend rotates the password and updates the existing owner membership without reprovisioning.
- `subscriber_memberships.must_change_password` is the authoritative first-login state. No password is stored in Postgres, responses, browser storage, metadata, or audit events.
- This architecture is validated locally only and depends on the unapplied Phase 2C.1 migration; no Phase 2 function or frontend cutover is deployed.

## Phase 2C.2C-A Database First-Login Authorization Gate - August 29, 2026
- Tenant authorization remains database-owned: `is_subscriber_member`, `is_subscriber_owner`, and both branches of `can_access_clinic` require an active membership with `must_change_password = false`; Platform Admin authorization remains an independent bypass.
- Existing tenant policies inherit the gate through those helpers, covering subscriber, clinic, patient, appointment, clinical, billing, payment, subscription, laboratory, assignment, and tenant-audit access without duplicating policy logic.
- A gated session discovers its next route only through `public.get_my_first_login_state()`. The restricted no-argument `SECURITY DEFINER` RPC binds to `auth.uid()`, uses an empty search path and qualified relations, and returns no subscriber ID, user ID, permissions, or tenant record.
- The correction is one unapplied additive migration. The service-role membership boundary used by `complete-initial-password` remains reachable, but that endpoint is not yet hardened and no frontend routing is cut over.

## Phase 2C.2C-B First-Login Completion Boundary - August 30, 2026
- Local flow: `verified user JWT -> own active Clinic Owner cardinality check -> server password validation -> Auth Admin password update -> conditional resolved-membership finalization -> safe audit -> revoke other refresh-token sessions`.
- Auth failure leaves the membership gate true. A post-Auth conditional-update failure returns `PASSWORD_UPDATED_STATE_FINALIZATION_REQUIRED`; the old temporary password is never restored, and the still-true membership remains the authoritative repair signal.
- The completion audit contains only actor, subscriber, membership, timestamp, and safe flag transition. Passwords and Authorization tokens never enter Postgres, response bodies, audit metadata, or logs.
- Supabase Admin `signOut(accessToken, 'others')` preserves the current session where supported while revoking other refresh tokens. Already-issued JWTs remain valid until expiry, and revocation failure does not reverse the completed Auth/membership state.
- `get_my_first_login_state()` and RLS remain the future routing/authorization pair. Browser routing and the stale frontend completion adapter are intentionally not cut over in this backend-only phase.

## Phase 2E.1 Browser First-Login Boundary - August 30, 2026
- Browser path: `Supabase Auth session -> get_my_first_login_state() -> mandatory Change Password when required -> complete-initial-password({ newPassword }) -> refreshed get_my_first_login_state() -> RLS-scoped Clinic Owner routing`.
- `subscriber_memberships.must_change_password` and the deployed RLS gate remain authoritative. The browser gate prevents tenant UX navigation during first login but never replaces database authorization.
- Tenant scope is derived from the authenticated owner membership after the gate clears; it is not derived from email, registration records, mock users, or browser storage. SDK-managed Supabase session storage is the only session persistence used by this path.
- Platform Admin frontend data remains outside this cutover and is the Phase 2E.2 boundary.

## Phase 2E.2 Platform Admin Browser Boundary - August 30, 2026
- Read path: `Supabase Auth session -> platform-admin-read -> shared requirePlatformAdmin -> server-only admin client -> explicit safe DTO -> real-data adapter -> existing Platform UI`.
- Mutation path remains `authenticated browser adapter -> existing Phase 2 review/provisioning/resend Edge Function -> authoritative refetch`; the browser never supplies payment amount, actor identity, provisioning scope, or credentials.
- Cross-tenant tables remain inaccessible through broad browser policies. Service-role access occurs only after server-side Platform Admin verification; no service-role key or secret is included in frontend code.
- Directory reads are page-size constrained and screen-owned: Dashboard loads aggregate summary plus pending reviews, list screens request only their active page/search/filter, and detail screens request one exact backend UUID. The browser never walks every server page to build a complete cross-tenant snapshot.
- Users/subscriptions composite search resolves matching relation IDs and constrains the base query before `.range()`, preserving filtered `count: exact` totals. User/detail identity is membership-UUID based, while the Auth user UUID remains a non-routing safe identity field.
- Unsupported legacy writes are read-only/blocked and direct mock form routes cannot mount. A failed resource read clears that resource projection instead of consulting localStorage.
- `platform-admin-read` is remotely deployed and the first live browser pass is complete. That pass exposed a split-authority defect where list hooks received a page but screens rendered a separate mutable compatibility snapshot; the corrected path is now `bounded response -> typed mapper -> requesting page`.
- Dashboard and global Subscriber KPIs are self-contained summary DTO fields. Subscriber, Clinic, Subscription, Payment, and User safe related labels are supplied by their own resource DTOs, so direct navigation/refresh does not require a different directory cache.
- Current status: **REMOTE READ FUNCTION DEPLOYED / LIVE VALIDATION IN PROGRESS / DEFECT FIX PENDING REDEPLOY/REVALIDATION**. No migration was introduced.

## Phase 2E.2 Exact Detail DTO Coherence Boundary - August 30, 2026
- Direct detail navigation is now `exact UUID request -> resource-owned safe related summaries -> typed detail model -> existing UI`; it does not depend on which list or detail page was visited first.
- Subscriber detail includes the active owner membership/profile, authoritative plan amounts, active facilities and personnel, safe payment rows, and server-computed approved/pending/refunded totals. Payment and Subscription detail include their own safe association summaries; Clinic and User detail include bounded relation summaries. Plan detail exposes aggregate subscriber count only, not a cross-resource identity directory.
- The frontend never derives paid totals from plan price and never derives owner identity from subscriber business name. Missing unsupported relation data is explicit and non-authoritative.
- Status: **PHASE 2E.2 / LIVE VALIDATION IN PROGRESS / FINAL DETAIL COHERENCE FIX PENDING REDEPLOY AND REVALIDATION**. No schema change was required.

## Phase 2E.2 Detail Association Display Boundary - August 30, 2026
- Clinic plan display is resolved only from the exact Clinic DTO's current subscription summary.
- Payment allocation display is an association projection, not a persisted allocation row: `payment -> subscription.source_payment_id -> plan`. Its count, plan label, and allocated amount are all derived from that same exact relation.
- Plan detail remains `exact plan UUID -> real catalog DTO -> aggregate subscriber count`; it never fabricates subscriber identities. No backend/schema contract changed in this display-only pass.

## Phase 2E.2 Closure - August 30, 2026
- The deployed `platform-admin-read` boundary and real-data frontend were live browser validated end-to-end. Exact detail routes reconstruct authoritative related summaries after direct refresh without cross-page cache authority.
- The verified payment display uses the real `source_payment_id` subscription association; it is not a synthetic allocation table record. Credentials and privileged server material remain outside browser DTOs.
- **Status: COMPLETE / REMOTE FUNCTION DEPLOYED / LIVE BROWSER VALIDATED / READY TO MERGE.**

## Phase 2E.3A Clinic Owner Read Boundary - August 30, 2026
- Owner shell reads now follow `authenticated Auth user -> get_my_first_login_state() -> exactly one active clinic_owner membership -> RLS-visible subscriber_id -> subscriber/profile/current subscription/plan/clinics/resource counts`.
- The browser adapter accepts no subscriber identifier. Every tenant query uses only the subscriber ID resolved from the authenticated membership, while existing RLS remains the security boundary.
- Live browser validation confirmed the provisioned Clinic Owner resolves Angelo Mhyr Lagsac, Angelo Dental Clinic, and the active Plus plan; membership/profile/subscriber/subscription/plan/clinic/resource reads succeed, including a direct `/clinic/dashboard` refresh, without a visible runtime or RLS failure.
- Plan limits are normalized from `plans.limits`; missing values remain unavailable and are never promoted to Max, unlimited, or a fabricated number. Logout clears protected access and provider data, and a subsequent refresh/direct dashboard URL does not restore the prior owner scope. The Reset Mock Data control remains absent.
- The legacy Dashboard content—welcome email text, blank Clinic field, generic Subscription label, counts, branch overview, financial summary, and recent activity—remains non-authoritative and deferred to Phase 2E.3B. Other owner business-page cutovers remain queued for 2E.3B-2E.3E.
- **PHASE 2E.3A = COMPLETE / FRONTEND-RLS READ FOUNDATION / LIVE BROWSER VALIDATED / READY FOR CHECKPOINT.** No migration, Edge Function, RPC, remote deployment, merge, or Phase 2E.3B work was introduced during closure.

## Phase 2E.3B.1 Dashboard and Branch Directory Read Boundary - August 31, 2026
- `/clinic/dashboard` and `/clinic/branches` now consume the existing `ClinicOwnerReadProvider`; neither page accepts email, clinic name, subscriber ID, `tenantScope.ts`, mock platform users, `mockClinicService`, or browser storage as tenant authority.
- The bootstrap remains `authenticated user -> exact active clinic_owner membership -> subscriber_id -> RLS-scoped reads`. Its clinic projection now includes real branch type and creation time, and its recent-activity projection selects only safe audit identifiers/type/timestamp fields from owner-readable `audit_events`, filtered by the membership-derived subscriber ID.
- Dashboard identity, active clinic/associate/staff KPIs, clinic overview, and branch directory are provider-authoritative. Patients, clinical financial totals, and setup progress show controlled unavailable/deferred states; no local zero or prototype completion percentage is promoted as real data.
- Branch creation/edit/status changes, bulk actions, details routing, and branch-workspace entry remain controlled unavailable so no mock write or mock destination can masquerade as persistence. Clinic quota is informational and comes from normalized plan limits.
- The authenticated Clinic Owner header no longer renders the development-only Prototype Mode badge. No migration, RPC, Edge Function, deployment, merge, or Phase 2E.3B.2 work was introduced.
- Live browser validation confirmed the real owner (Angelo Mhyr Lagsac), Angelo Dental Clinic, and Plus plan persist through Dashboard/Branches hard refreshes. Active usage is 1 clinic, 0 associates, and 0 staff; the real primary clinic's number, address, contact, and email render from authenticated tenant scope.
- Patients, Financial Summary, and setup progress remain controlled unavailable/deferred rather than fabricated values. Recent Activity renders real RLS-visible audit events, and the Clinic Owner Prototype Mode badge remains absent.
- Logout clears protected access and provider state: direct `/clinic/dashboard` or `/clinic/branches` reopening returns to login. No mock clinic rows or persistence are involved.
- **PHASE 2E.3B.1 = COMPLETE / REAL-DATA READ CUTOVER / LIVE BROWSER VALIDATED / READY FOR CHECKPOINT.** Real branch mutations and server-enforced quota transactions remain deferred to Phase 2E.3B.2.
