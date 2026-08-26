# Supabase Foundation

This directory is intentionally a planning boundary for Phase 1. It does not
contain credentials, a linked project reference, or production migrations yet.

Before Phase 2 creates migrations:

1. Create a dedicated Supabase project for development, not production.
2. Install and authenticate the Supabase CLI without committing credentials.
3. Link the local project only after the owner confirms the project reference.
4. Create migrations through `supabase migration new`, then apply and test them
   against the development project.
5. Enable RLS and write an operation-specific policy test for every exposed table.

The authoritative Phase 1 schema and tenant design is documented in
`context/supabase_phase_1_foundation.md`.
