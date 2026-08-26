# Permanent Workspace Rules & Memory

## 1. Automatic Context Folder Synchronization
> [!IMPORTANT]
> **MANDATORY RULE: NEVER FORGET THE CONTEXT FOLDER FILES.**
> After EVERY feature update, upgrade, UI/UX enhancement, data model modification, or bugfix, you MUST automatically update and synchronize all relevant documentation files in the `context/` directory:
> - `context/IMPLEMENTATION_STATUS.md`
> - `context/MODULES.md`
> - `context/ARCHITECTURE.md`
> - `context/walkthrough.md`
> - `context/task.md`
> - `context/component_inventory.md`

## 2. Multi-Branch Subsystem Data Isolation
- Each clinic branch created by the owner (e.g. Angelo Dental Clinic `CLN-SUB-396924` vs. Pantua Dental Clinic `CLN-1787478722569-296`) must have its own unique, isolated dataset for Patients, Schedules, Waitlists, Dashboard KPIs, and Branch Settings partitioned strictly by `clinicId`.
- Associate Dentists and Staff management records must enforce branch designation (`authorizedClinics`, `clinicIds`).

## 3. Real Data & Clean Storage Seed Policy
- Primary Subscriber: **Angelo Mhyr Lagsac** (`gelomhyr@gmail.com`, `Angelo Dental Clinic`, Max Plan, Active, 2 Clinics).
- No dummy/mockup clutter. All newly approved registrations must flow cleanly into persistent subscriber, clinic, and payment ledgers.

## 4. Build Verification Standard
- Always run `npm run build` (`tsc -b && vite build`) and ensure **0 errors** before concluding any task.

## 5. Standardized Brainstorming & Phased Redesign Protocol (Developer Triggers)

Whenever the developer asks for audits, suggestions, redesigns, analytics, or global synchronization, Antigravity MUST automatically follow these standardized triggers:

### A. Feature & Logic Audit Trigger ("anong pwede redesign ui/ux functions logic features...")
1. **Recap & Brainstorming First**: Always start with a structured recap and brainstorming review before touching any code. Break down current status, existing frictions, and proposed logic/UI enhancements.
2. **Per-Phase Breakdown**: Divide large scopes into bite-sized phases (e.g. Phase 1 Framework ➔ Phase 2 Core Logic ➔ Phase 3 Advanced Visuals ➔ Phase 4 Verification). Wait for explicit approval before executing each phase.

### B. Analytics & Reports Dashboard Trigger ("mga graphs like pie chart, histograph, column chart, bar chart...")
1. **Visual Multi-Chart Selection**: Automatically pick the appropriate SVG charts:
   - **Donut / Pie Charts**: Percentage distributions (plans, payment gateways, service categories, tooth notations).
   - **Vertical Column Charts**: Dual comparisons over time (billed vs. collected, SaaS MRR vs. clinical revenue).
   - **Horizontal Bar Charts**: Ranked leaderboards (#1, #2, #3 badges for branches, procedures, clinician productivity).
   - **Histogram / Step Area Charts**: Time-series hourly density (peak clinic visits, security events).
2. **Zero Dummy/Mock Data Standard**: All chart datasets must be 100% computed from real persisted store records (`payments`, `billPaymentStore.ts`, `patientDirectoryStore.ts`, `branchSettingsStore.ts`, `mockAuditService.ts`). Never inject static mockup arrays in graphs.
3. **Data Ledgers**: Pair charts with 500px compact tables, Print PDF, and CSV exports.

### C. UI/UX Layout & Design Trigger ("fixing ng ui/ux redesign the layout format...")
1. **Compact 500px Tables**: Top-aligned rows with badge indicators and paged containers.
2. **Left-Anchored 3-Dots Action Menus**: Dynamically positioned on the LEFT side of trigger buttons to avoid occlusion.
3. **Clean Visual Hierarchy**: Segmented pill selectors, responsive headers, and accessible contrast.

### D. Global Cross-Platform Synchronization Trigger ("dapat makikita jan lahat mula sa login, register, platform dashboard, clinic owner system, at subsystem clinic")
Ensure seamless real-time data integrity across all 5 tiers:
1. `Auth & Onboarding` (Register, Email Verification, Plan Quotas)
2. `Platform Console` (Platform MRR, Subscribers, Clinics, Laboratories, Plans, Subscriptions, Payments)
3. `Clinic Owner Console` (Sales Overview, Quota Enforcement, Dentist & Staff rosters)
4. `Clinic Subsystem Branches` (Multi-branch data isolation, Operating chairs sync, Waitlists, Daily reports)
5. `Patient Clinical Workspaces & Partner Labs` (Dental charting triple notation FDI/Universal/Palmer, Bills & Payments, Lab work orders)
