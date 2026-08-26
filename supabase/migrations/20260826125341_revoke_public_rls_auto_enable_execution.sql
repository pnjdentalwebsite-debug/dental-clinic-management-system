-- Some cloud projects with automatic RLS enabled include this helper in the
-- public schema. It is trigger-only infrastructure, never a client RPC.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public';
    execute 'revoke execute on function public.rls_auto_enable() from anon, authenticated';
  end if;
end;
$$;
