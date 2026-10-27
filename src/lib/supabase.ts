import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/* ------------------------------------------------------------------ */
/*  Determine whether real Supabase credentials are available         */
/* ------------------------------------------------------------------ */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isDemoMode = !supabaseUrl || !supabaseKey;

/* ------------------------------------------------------------------ */
/*  Real client (when env vars are set)                               */
/* ------------------------------------------------------------------ */
let supabase: SupabaseClient;

if (!isDemoMode) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  // In demo mode we still create a client pointing at a placeholder URL
  // so that the rest of the codebase can reference `supabase` without
  // null-checks. All data will come from local seed data instead.
  supabase = createClient(
    'https://demo.supabase.co',
    'demo-anon-key',
  );
}

export { supabase };
