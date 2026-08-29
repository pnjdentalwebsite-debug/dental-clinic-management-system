-- Phase 2C.2C-A: enforce mandatory first-login password completion at the
-- database authorization layer. This migration is additive and seed-free.

create or replace function app_private.is_subscriber_member(target_subscriber_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.is_platform_admin() or exists (
    select 1
    from public.subscriber_memberships membership
    where membership.subscriber_id = target_subscriber_id
      and membership.user_id = (select auth.uid())
      and membership.account_status = 'active'
      and membership.must_change_password = false
  );
$$;

create or replace function app_private.is_subscriber_owner(target_subscriber_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.is_platform_admin() or exists (
    select 1
    from public.subscriber_memberships membership
    where membership.subscriber_id = target_subscriber_id
      and membership.user_id = (select auth.uid())
      and membership.role = 'clinic_owner'
      and membership.account_status = 'active'
      and membership.must_change_password = false
  );
$$;

create or replace function app_private.can_access_clinic(
  target_subscriber_id uuid,
  target_clinic_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.is_subscriber_owner(target_subscriber_id) or exists (
    select 1
    from public.clinic_assignments assignment
    join public.subscriber_memberships membership
      on membership.id = assignment.membership_id
    where assignment.subscriber_id = target_subscriber_id
      and assignment.clinic_id = target_clinic_id
      and assignment.status = 'active'
      and membership.user_id = (select auth.uid())
      and membership.account_status = 'active'
      and membership.must_change_password = false
  );
$$;

-- This RPC is the sole first-login discovery path for a gated browser session.
-- It accepts no target identifier and returns only minimal state for the
-- authenticated user's own memberships. Returning all of the caller's own
-- memberships makes an unexpected multiple-active-owner conflict detectable.
create or replace function public.get_my_first_login_state()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'memberships', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'membershipId', membership.id,
          'role', membership.role,
          'accountStatus', membership.account_status,
          'mustChangePassword', membership.must_change_password
        )
        order by membership.created_at, membership.id
      ),
      '[]'::jsonb
    ),
    'activeClinicOwnerMembershipCount', count(*) filter (
      where membership.role = 'clinic_owner'
        and membership.account_status = 'active'
    ),
    'hasMultipleActiveClinicOwnerMemberships', (
      count(*) filter (
        where membership.role = 'clinic_owner'
          and membership.account_status = 'active'
      ) > 1
    )
  )
  from public.subscriber_memberships membership
  where membership.user_id = (select auth.uid());
$$;

comment on function public.get_my_first_login_state() is
  'Returns only the authenticated user''s minimal membership first-login state; accepts no target identity.';

-- CREATE OR REPLACE preserves function ACLs, but restate the intended grants
-- explicitly so helper and RPC execution cannot drift toward public access.
revoke all on function app_private.is_subscriber_member(uuid) from public, anon;
revoke all on function app_private.is_subscriber_owner(uuid) from public, anon;
revoke all on function app_private.can_access_clinic(uuid, uuid) from public, anon;
grant execute on function app_private.is_subscriber_member(uuid) to authenticated;
grant execute on function app_private.is_subscriber_owner(uuid) to authenticated;
grant execute on function app_private.can_access_clinic(uuid, uuid) to authenticated;

revoke all on function public.get_my_first_login_state() from public, anon;
grant execute on function public.get_my_first_login_state() to authenticated;
