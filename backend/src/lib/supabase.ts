import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  (supabaseAnonKey || supabaseServiceKey) &&
  !supabaseUrl.includes('your-project')
);

// Standard Supabase client
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? (supabaseAnonKey || 'placeholder-anon') : 'placeholder-anon',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Privileged Supabase Admin client using service role key (Never exposed to frontend)
export const supabaseAdmin: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? (supabaseServiceKey || 'placeholder-service') : 'placeholder-service',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
