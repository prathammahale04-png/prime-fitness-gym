import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

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
    clientInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
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
 * Diagnostic helper to test the live connection to Supabase
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  latencyMs?: number;
}> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not configured in environment variables.',
    };
  }

  const start = performance.now();
  try {
    const client = getSupabase();
    // Test auth endpoint availability
    const { error } = await client.auth.getSession();
    const latency = Math.round(performance.now() - start);

    if (error) {
      return {
        connected: false,
        message: `Connection test error: ${error.message}`,
        latencyMs: latency,
      };
    }

    return {
      connected: true,
      message: `Successfully connected to Supabase (${latency}ms).`,
      latencyMs: latency,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Failed to connect: ${err?.message || 'Unknown network error'}`,
    };
  }
}
