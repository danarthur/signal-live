import { createClient } from '@supabase/supabase-js';

// ⚠️ SECURITY WARNING:
// This client uses the SERVICE_ROLE_KEY. It bypasses ALL Row Level Security.
// It should ONLY be used in secure API routes (server-side), never in the browser.
// We use this to fetch data for the "Mock Session" user since they aren't really logged in.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase Service Key in .env.local');
}

export const systemClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false, // We don't need to maintain a session for the system bot
    autoRefreshToken: false,
  },
});
