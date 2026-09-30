-- ==============================================================================
-- AlgoSphere Coding Platform: Supabase Auth & Profiles Migration
-- ==============================================================================
-- Run this script in your Supabase Project: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  auth_provider TEXT DEFAULT 'email',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile fields" ON public.profiles;
DROP POLICY IF EXISTS "Service role has full access" ON public.profiles;

-- RLS Policy: users can read only their own complete profile.
-- Public/leaderboard profile data should be exposed through a dedicated view or backend endpoint
-- so private fields such as email are never disclosed.
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policy: Users can update their own profile (username, full_name, avatar_url)
CREATE POLICY "Users can update own profile fields"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Protect server-owned profile fields.
-- Do not use current_user here: this function is SECURITY DEFINER, so current_user would
-- refer to the function owner rather than the caller. auth.role() reflects the caller JWT.
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $
BEGIN
  IF auth.role() = 'authenticated' THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.auth_provider IS DISTINCT FROM OLD.auth_provider
       OR NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Protected profile fields cannot be modified by users';
    END IF;
  END IF;

  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
DROP TRIGGER IF EXISTS tr_protect_profile_fields ON public.profiles;
CREATE TRIGGER tr_protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_fields();

-- 4. Trigger to automatically provision a profile on auth.users sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_raw_username TEXT;
  v_username TEXT;
  v_candidate TEXT;
  v_provider TEXT;
  v_full_name TEXT;
  v_avatar_url TEXT;
  v_counter INT := 0;
BEGIN
  -- Determine auth provider (google vs email)
  v_provider := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    CASE WHEN NEW.raw_user_meta_data->>'iss' LIKE '%google%' THEN 'google' ELSE 'email' END,
    'email'
  );

  -- Extract full name & avatar (Google metadata support)
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    ''
  );

  -- Determine initial requested username
  v_raw_username := LOWER(TRIM(COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  )));

  -- Sanitize username (keep alphanumeric and underscores)
  v_raw_username := REGEXP_REPLACE(v_raw_username, '[^a-zA-Z0-9_]', '', 'g');
  IF LENGTH(v_raw_username) < 3 THEN
    v_raw_username := 'coder_' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 6);
  END IF;

  -- Ensure uniqueness with collision handling
  v_username := v_raw_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_counter := v_counter + 1;
    v_username := v_raw_username || '_' || (FLOOR(RANDOM() * 9000 + 1000)::INT)::TEXT;
    IF v_counter > 10 THEN
      v_username := v_raw_username || '_' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 8);
      EXIT;
    END IF;
  END LOOP;

  -- Insert profile with strictly forced 'student' role
  INSERT INTO public.profiles (
    id,
    username,
    email,
    full_name,
    avatar_url,
    role,
    auth_provider,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    v_username,
    NEW.email,
    v_full_name,
    v_avatar_url,
    'student', -- ALWAYS student on creation
    v_provider,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
    avatar_url = CASE WHEN profiles.avatar_url = '' THEN EXCLUDED.avatar_url ELSE profiles.avatar_url END,
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. Administrator Promotion Query
-- ==============================================================================
-- To promote your account to administrator, replace OWNER_EMAIL with your email
-- and execute this query in the Supabase SQL editor:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'OWNER_EMAIL';
-- ==============================================================================
