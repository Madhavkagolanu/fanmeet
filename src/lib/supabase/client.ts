import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder-project') &&
    !supabaseAnonKey.includes('placeholder')
  );
};

export const createClient = () => {
  if (!isSupabaseConfigured()) {
    // Return dummy client to prevent crashes when developing locally
    return createSupabaseClient('https://dummy.supabase.co', 'dummy-anon-key');
  }
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createClient();
