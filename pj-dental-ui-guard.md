# PJ Dental UI Preservation

## Purpose

Preserve the approved UI/UX of the PJ Dental Clinic Management System while backend, Supabase, authentication, database, synchronization, RLS, Edge Function, RPC, and service-layer work is implemented.

This skill acts as a **visual regression guard**. Backend work is not permission to redesign the product.

## Core Rule: UI Is Frozen by Default

Treat the current existing UI/UX as approved and frozen unless the user explicitly asks for visual redesign.

For backend or system-integration tasks, preserve:

- page layout
- sidebar structure
- navbar/header structure
- typography
- spacing
- colors
- cards
- tables
- forms
- modals
- buttons
- icons
- labels
- responsive behavior
- section ordering
- existing interaction patterns

Do not modernize, simplify, restyle, rearrange, replace, or redesign existing screens unless explicitly requested.

## Allowed Frontend Changes

Frontend code may be changed only when required to connect the existing UI to real functionality, including:

- replacing mock/localStorage fetches with Supabase queries
- wiring existing buttons and forms to real actions
- adding hooks, queries, mutations, event handlers, validation, and state
- adding loading/error/empty states using the existing visual language
- passing real IDs and relationship keys
- fixing broken functionality without changing the approved layout
- making the smallest technical change required for backend integration

## Forbidden Changes Without Explicit Approval

Do not:

- rebuild pages for convenience
- replace existing component structures because another approach is easier
- introduce a new design system
- change sidebar or navbar layout
- rename visible labels without requirement
- move actions or buttons
- change modal sizing/layout
- change table column structure unless backend requirements make it unavoidable
- alter typography, spacing, colors, shadows, radius, borders, or iconography
- remove existing sections
- add decorative sections
- perform opportunistic visual refactors
- change unrelated frontend files while doing backend work

## Preferred Integration Pattern

Use:

`Existing UI → Existing Component → Hook/Service/Repository → Supabase / Edge Function / RPC`

Avoid:

`New Backend → New Page → New Components → New UI`

The backend must be integrated underneath the existing approved interface.

## Visual Change Escalation Rule

If a backend requirement truly requires a visible UI change:

1. Do not implement the visual change automatically.
2. Explain why the existing UI cannot support the requirement.
3. Identify the smallest possible visual change.
4. Wait for explicit user approval.
5. Only then implement that approved visual change.

## Scope Discipline

When assigned a module, modify only what is necessary for that module.

Example:

If the task is `Payments & Receipts Supabase integration`, do not redesign:

- Platform Admin sidebar
- headers
- other billing pages
- dashboard cards
- unrelated components

No "while I'm here" redesigns or broad frontend cleanup.

## Baseline Verification

Before finishing a task, compare affected pages with the pre-change version or available screenshots.

Verify:

- sidebar unchanged
- navbar unchanged
- page composition unchanged
- typography unchanged
- colors unchanged
- cards unchanged
- tables unchanged
- forms unchanged
- modals unchanged
- spacing unchanged
- responsive behavior not degraded

## Completion Report Requirement

Every backend/system task must report:

### UI Preservation
- Layout changed: YES/NO
- Sidebar changed: YES/NO
- Navbar changed: YES/NO
- Typography/style changed: YES/NO
- Table/form structure changed: YES/NO
- Files with intentional visual changes: list or `NONE`

If any visual change occurred without explicit user approval, the task is not complete.

## Final Principle

**Change the data source and system behavior, not the approved appearance.**
