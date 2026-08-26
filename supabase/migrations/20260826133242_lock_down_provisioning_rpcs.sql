-- Supabase creates explicit grants for API roles in some environments. Revoke
-- them directly, in addition to PUBLIC, so privileged RPCs remain Edge-only.
revoke execute on function public.approve_registration_provisioning(uuid, uuid, uuid) from anon, authenticated;
revoke execute on function public.provision_member_account(uuid, uuid, uuid, public.app_role, text, text, text, text, text, text, text, text, text, text, text, text, text, uuid[]) from anon, authenticated;

grant execute on function public.approve_registration_provisioning(uuid, uuid, uuid) to service_role;
grant execute on function public.provision_member_account(uuid, uuid, uuid, public.app_role, text, text, text, text, text, text, text, text, text, text, text, text, text, uuid[]) to service_role;
