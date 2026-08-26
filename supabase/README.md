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
