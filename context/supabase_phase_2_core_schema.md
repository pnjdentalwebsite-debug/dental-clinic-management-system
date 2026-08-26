# Supabase Phase 2 Core Schema - August 26, 2026

## What Is Ready

- `supabase/migrations/20260826101055_core_tenant_identity_and_branch_scope.sql`
  creates the seed-free relational foundation for the platform, subscriber,
  branch, staff, associate, laboratory, patient, scheduling, billing, upload,
  notification, and audit domains.
- Branch-operational data uses both `subscriber_id` and `clinic_id`; composite
  foreign keys prevent a patient, bill, tag, recall, upload, or payment from
  crossing tenant or clinic boundaries.
- Auth identities are represented by `auth.users` plus `public.profiles`.
  Memberships and active clinic assignments determine owner, staff, and
  associate scope. Roles are never taken from editable browser metadata.
- RLS is enabled for every created public table. The foundation grants branch
  reads only to assigned staff/associates and tenant management to active clinic
  owners. Platform provisioning remains server/database-admin only.
- `src/infrastructure/supabase/client.ts` uses only the public browser key and
  returns no client when configuration is incomplete. It never exposes a
  service-role credential.
- `src/infrastructure/supabase/scope.ts` requires `subscriberId` and `clinicId`
  for future branch data adapters.

## Deliberate Safety Limits

- Existing screens remain on localStorage until each module gets a tested
  repository adapter. There is no silent split-write or fallback to a live
  database.
- The migration has not been applied: this workstation has no Docker runtime
  and no linked Supabase development project.
- Staff and associate clinical write permissions are intentionally not enabled
  by the foundation migration. They need module-specific RLS policies and role
  permission tests before frontend cutover.
- A trusted setup procedure must provision the first platform admin after Auth
  is available. No seeded administrator, clinic, staff member, associate,
  laboratory, patient, payment, or subscription is created by this migration.

## Required Validation Before Applying

1. Create a separate Supabase development project.
2. Run `npx supabase login` locally, then link only the development project.
3. Apply the migration to the development project.
4. Provision test identities for platform admin, owner, assigned staff,
   assigned associate, and an unassigned user.
5. Verify RLS allows only same-subscriber and assigned-branch reads.
6. Add and execute operation-specific write-policy tests before wiring any UI
   module to the client.
