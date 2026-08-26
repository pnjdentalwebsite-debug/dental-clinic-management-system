# Supabase Foundation

This directory now contains the repository's Phase 2 local Supabase CLI
bootstrap. It does not contain credentials, a linked project reference, a
running Docker stack, or production migrations yet.

Before the first migration is created:

1. Create a dedicated Supabase project for development, not production.
2. Install and authenticate the Supabase CLI without committing credentials.
3. Link the local project only after the owner confirms the project reference.
4. Create migrations through `supabase migration new`, then apply and test them
   against the development project.
5. Enable RLS and write an operation-specific policy test for every exposed table.

The authoritative Phase 1 schema and tenant design is documented in
`context/supabase_phase_1_foundation.md`.

The first seed-free core migration and its validation checklist are documented
in `context/supabase_phase_2_core_schema.md`.
