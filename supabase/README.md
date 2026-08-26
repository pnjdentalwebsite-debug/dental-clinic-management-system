# Supabase Foundation

This directory contains the repository's local Supabase CLI configuration and
seed-free database migrations. It does not contain credentials or a linked
cloud project reference.

## Local development

The local stack has been validated with Docker. On this workstation, use the
lean command below because Docker Desktop currently has limited memory:

```powershell
npx --yes supabase@latest start --agent no --exclude studio --exclude logflare --exclude vector --exclude imgproxy
```

The database is available locally on port `54322`, and the API on port
`54321`. Do not commit `.env.local` or any local API keys.

## Cloud development handoff

The project is linked to a dedicated development environment. Continue to keep
cloud credentials out of the repository and use `supabase db push --linked
--dry-run --skip-vault` before every remote migration push.

1. Add role-scoped Auth and RLS integration tests.
2. Push future migrations to development only after their local tests pass.
3. Migrate localStorage modules one at a time through explicit
   subscriber/clinic-scoped repositories.

The authoritative Phase 1 schema and tenant design is documented in
`context/supabase_phase_1_foundation.md`.

The first seed-free core migration, the public-registration safeguard, and the
validation checklist are documented in `context/supabase_phase_2_core_schema.md`.

## Secure onboarding functions

Phase 1 deploys the following functions:

- `registration-submit` and `registration-submit-payment` are public intake
  endpoints. They validate input and calculate plan amounts on the server.
- `registration-status` returns only a small account lifecycle state for an
  email address.
- `platform-approve-registration` is authenticated and platform-admin-only.
  It creates the real owner Auth account and provisions the subscriber, active
  subscription, primary clinic, membership, and payment atomically.
- `complete-initial-password` is authenticated and lets only the current user
  replace their one-time password.
- `provision-member-account` is authenticated and owner-authorized. It creates
  Staff or Associate Auth accounts only for validated assigned branches.

The privileged database functions used by approval and personnel provisioning
are not executable by `anon` or `authenticated` database roles. Keep the
service-role key in Edge Function secrets only; never add it to a Vite client
environment file.

For a deployed web application, configure the permitted frontend origin before
using public intake functions:

```powershell
supabase secrets set ALLOWED_ORIGIN=https://your-production-domain.example
```

No production rows are seeded. Create a controlled platform administrator and
real subscription plans through a trusted administrative procedure before live
registration testing. The legacy UI remains localStorage-backed until the next
repository-by-repository migration phase.
