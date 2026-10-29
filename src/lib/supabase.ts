import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Normalizes any Supabase URL by extracting only the origin (scheme + domain + port).
 * This strips any accidental trailing slashes ('/'), REST endpoints ('/rest/v1'), 
 * or Auth endpoints ('/auth/v1') that users may have copied from the Supabase dashboard.
 */
export const normalizeSupabaseUrl = (rawUrl?: string): string => {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return trimmed
      .replace(/\/rest\/v1\/?$/i, '')
      .replace(/\/auth\/v1\/?$/i, '')
      .replace(/\/+$/, '');
  }
};

const getEnv = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return String((import.meta as any).env[key]).trim();
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return String(process.env[key]).trim();
    }
  } catch {}
  return '';
};

const rawUrl = getEnv('VITE_SUPABASE_URL');
const supabaseUrl = normalizeSupabaseUrl(rawUrl);
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project-id') &&
    supabaseAnonKey.length > 20
  );
};

export const getSupabaseConfig = () => ({
  url: supabaseUrl || '',
  hasAnonKey: Boolean(supabaseAnonKey),
  isConfigured: isSupabaseConfigured(),
});

// Singleton client instance
let clientInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (clientInstance) {
    return clientInstance;
  }

  if (isSupabaseConfigured()) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return clientInstance;
  }

  // Fallback placeholder client that logs informative warnings
  clientInstance = createClient(
    'https://placeholder-primefitness.supabase.co',
    'placeholder-anon-key-primefitness-mh19-needs-configuration',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return clientInstance;
};

export const supabase = getSupabase();

/**
 * Creates or retrieves a scoped Supabase client with the authenticated user's Bearer JWT
 * explicitly attached in the Authorization header. This guarantees requests to protected
 * tables (such as members and profiles) execute under the 'authenticated' PostgreSQL role
 * rather than falling back to 'anon'.
 */
export const getAuthenticatedClient = (
  tokenOrSession?: string | { access_token?: string } | null
): SupabaseClient => {
  const token = typeof tokenOrSession === 'string' ? tokenOrSession : tokenOrSession?.access_token;

  if (!token || !isSupabaseConfigured()) {
    return getSupabase();
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

/**
 * Diagnostic helper to test the live connection to Supabase
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  tablesMigrated: boolean;
  message: string;
  latencyMs?: number;
}> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      tablesMigrated: false,
      message: 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not configured in environment variables.',
    };
  }

  const start = performance.now();
  try {
    const client = getSupabase();
    // 1. Test auth endpoint availability & active session
    const { data: sessionData, error: authErr } = await client.auth.getSession();
    const latency = Math.round(performance.now() - start);

    if (authErr) {
      return {
        connected: false,
        tablesMigrated: false,
        message: `Connection test error: ${authErr.message}`,
        latencyMs: latency,
      };
    }

    // 2. Test if core platform tables exist in schema using public packages table
    // (packages table is intentionally readable by anon and contains no private member data)
    const { error: tableErr } = await client.from('packages').select('id', { head: true });
    const tablesMigrated = !tableErr || tableErr.code !== 'PGRST205';

    if (!tablesMigrated) {
      return {
        connected: true,
        tablesMigrated: false,
        message: 'Connected to Supabase, but database tables are pending migration. Data is running in offline local cache until migrations are applied.',
        latencyMs: latency,
      };
    }

    const hasActiveSession = Boolean(sessionData?.session?.user);

    return {
      connected: true,
      tablesMigrated: true,
      message: hasActiveSession
        ? `Successfully connected to Supabase (${latency}ms) with active authenticated session.`
        : `Connected to Supabase (${latency}ms). Public schema verified; sign in to access live member data.`,
      latencyMs: latency,
    };
  } catch (err: any) {
    return {
      connected: false,
      tablesMigrated: false,
      message: `Failed to connect: ${err?.message || 'Unknown network error'}`,
    };
  }
}
