import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_SUPABASE_URL = 'https://dzrmxbiewdjexljinnsv.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_DigKsra1Km8UKJpckUFpqQ_FSF4YIIO';

const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabasePublicKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_PUBLISHABLE_KEY;

const forceLocalAuth =
  process.env.ALGO_LOCAL_AUTH === '1' ||
  process.env.NODE_ENV === 'test' ||
  Boolean(process.env.NODE_TEST_CONTEXT);

export const isSupabaseConfigured: boolean = !forceLocalAuth && Boolean(supabaseUrl && supabasePublicKey);

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabasePublicKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export function createUserScopedSupabaseClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl, supabasePublicKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
