import { requireSupabaseClient } from './client';

type AuthClient = ReturnType<typeof requireSupabaseClient>;

export type PlatformAdminAccess =
  | { kind: 'loading' }
  | { kind: 'signed_out' }
  | { kind: 'not_platform_admin' }
  | { kind: 'ready'; email: string }
  | { kind: 'error'; message: string };

/**
 * This is intentionally a server/RLS-backed membership check. The browser does
 * not infer an administrator role from email, metadata, or local storage.
 */
export async function resolvePlatformAdminAccess(
  client: AuthClient = requireSupabaseClient(),
): Promise<PlatformAdminAccess> {
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  const session = sessionData.session;
  if (sessionError) return { kind: 'error', message: 'Your sign-in session is unavailable. Please sign in again.' };
  if (!session?.user?.email) return { kind: 'signed_out' };

  const { data, error } = await client
    .from('platform_admins')
    .select('user_id')
    .maybeSingle();
  if (error) return { kind: 'error', message: 'Platform Administrator access could not be verified.' };
  return data ? { kind: 'ready', email: session.user.email } : { kind: 'not_platform_admin' };
}

