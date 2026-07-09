import { createClient } from '@supabase/supabase-js';

// Lu depuis import.meta.env (Vite). Les vars doivent être préfixées VITE_.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Message explicite pour ne pas tourner en rond pendant le dev.
  // eslint-disable-next-line no-console
  console.error(
    '[supabase] Variables manquantes. Définis VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env (local) et dans Vercel Project Settings > Environment Variables.'
  );
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,   // gère les redirects Google + reset password
      flowType: 'pkce',
    },
  }
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
