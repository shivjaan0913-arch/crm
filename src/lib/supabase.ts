import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xrjtisqlvksbhpdkpyde.supabase.co';
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
