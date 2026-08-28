import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConnectionState {
  configured: boolean;
  missing: Array<'VITE_SUPABASE_URL' | 'VITE_SUPABASE_PUBLISHABLE_KEY'>;
}

let browserClient: SupabaseClient | undefined;

export function getSupabaseConnectionState(): SupabaseConnectionState {
  const missing: SupabaseConnectionState['missing'] = [];
  if (!import.meta.env.VITE_SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
  if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');
  return { configured: missing.length === 0, missing };
}

/**
 * Returns null until a development or production Supabase project is explicitly
 * configured. This prevents an accidental partial cutover from writing records
 * to an undefined backend.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const connection = getSupabaseConnectionState();
  if (!connection.configured) return null;

  if (!browserClient) {
    browserClient = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        global: {
          headers: { 'x-client-info': 'pnj-dental-web' },
        },
      },
    );
  }

  return browserClient;
}

export function requireSupabaseClient(): SupabaseClient {
  const client = getSupabaseClient();
  if (client) return client;

  const { missing } = getSupabaseConnectionState();
  throw new Error(`Supabase is not configured. Missing: ${missing.join(', ')}.`);
}
