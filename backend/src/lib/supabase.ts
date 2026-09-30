import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')
);

export const isSupabaseAdminConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseServiceKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseServiceKey.includes('your-service-role-key')
);

// Standard server client for user-token verification and password auth.
// No sessions are persisted on the backend.
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Privileged client. The service-role key is never allowed to fall back to the
// anon key; privileged operations fail closed if the service key is missing.
export const supabaseAdmin: SupabaseClient = createClient(
  isSupabaseAdminConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseAdminConfigured ? supabaseServiceKey : 'placeholder-service',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
