import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xrjtisqlvksbhpdkpyde.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyanRpc3FsdmtzYmhwZGtweWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NzA2MzksImV4cCI6MjEwNDM0NjYzOX0.sgO1Yvq7mECv-_COBJKzZM0fErwPhueo0a8sIq8LS1w';
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
