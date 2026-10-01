import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'soc_supabase_url';
const STORAGE_KEY_ANON_KEY = 'soc_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'local' | 'none';
}

export function getSupabaseConfig(): SupabaseConfig {
  const localUrl = localStorage.getItem(STORAGE_KEY_URL);
  const localKey = localStorage.getItem(STORAGE_KEY_ANON_KEY);

  if (localUrl && localKey) {
    return {
      url: localUrl.trim(),
      anonKey: localKey.trim(),
      isConfigured: true,
      source: 'local',
    };
  }

  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && !envUrl.includes('your-project-id') && !envKey.includes('your-anon-key')) {
    return {
      url: envUrl.trim(),
      anonKey: envKey.trim(),
      isConfigured: true,
      source: 'env',
    };
  }

  return {
    url: localUrl?.trim() || envUrl?.trim() || '',
    anonKey: localKey?.trim() || envKey?.trim() || '',
    isConfigured: Boolean(localUrl || (envUrl && !envUrl.includes('your-project-id'))),
    source: 'none',
  };
}

let activeClient: SupabaseClient | null = null;

export function initSupabaseClient(): SupabaseClient {
  const config = getSupabaseConfig();
  const fallbackUrl = config.url || 'https://placeholder-soc.supabase.co';
  const fallbackKey = config.anonKey || 'placeholder-anon-key';

  activeClient = createClient(fallbackUrl, fallbackKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return activeClient;
}

export function getSupabase(): SupabaseClient {
  if (!activeClient) {
    return initSupabaseClient();
  }
  return activeClient;
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_ANON_KEY, anonKey.trim());
  initSupabaseClient();
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_ANON_KEY);
  initSupabaseClient();
}

export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{
  success: boolean;
  message: string;
  latencyMs?: number;
}> {
  const startTime = Date.now();
  const clientToTest = (url && anonKey)
    ? createClient(url.trim(), anonKey.trim(), { auth: { persistSession: false } })
    : getSupabase();

  const config = getSupabaseConfig();
  if (!url && !config.isConfigured) {
    return {
      success: false,
      message: 'Supabase URL and Anon Key are not yet configured. Please enter your credentials in the Backend Connection tab.',
    };
  }

  try {
    // Attempt lightweight ping to Supabase Auth API
    const { error } = await clientToTest.auth.getSession();
    const latencyMs = Date.now() - startTime;
    
    if (error && error.message.toLowerCase().includes('apikey')) {
      return {
        success: false,
        message: `Invalid Supabase API Key: ${error.message}`,
        latencyMs,
      };
    }

    return {
      success: true,
      message: `Connection established successfully (${latencyMs}ms)`,
      latencyMs,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown connection error';
    return {
      success: false,
      message: `Failed to reach Supabase backend: ${message}`,
      latencyMs: Date.now() - startTime,
    };
  }
}

export const supabase = getSupabase();
