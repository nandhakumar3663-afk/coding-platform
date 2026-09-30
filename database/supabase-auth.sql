-- ==============================================================================
-- AlgoSphere Coding Platform: Supabase Auth & Profiles Migration
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  auth_provider TEXT NOT NULL DEFAULT 'email',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (lower(username));
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile fields" ON public.profiles;
DROP POLICY IF EXISTS "Service role has full access" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile fields"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Data API privileges: authenticated clients may read their row, but may update
-- only non-security-sensitive columns. role/email/auth_provider/id stay server-owned.
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.profiles FROM authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (username, full_name, avatar_url) ON TABLE public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $profile$
DECLARE
  v_raw_username TEXT;
  v_username TEXT;
  v_provider TEXT;
  v_full_name TEXT;
  v_avatar_url TEXT;
  v_counter INT := 0;
BEGIN
  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');

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

  v_raw_username := LOWER(TRIM(COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(COALESCE(NEW.email, ''), '@', 1)
  )));

  v_raw_username := REGEXP_REPLACE(v_raw_username, '[^a-zA-Z0-9_]', '', 'g');

  IF LENGTH(v_raw_username) < 3 THEN
    v_raw_username := 'coder_' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 6);
  END IF;

  v_username := v_raw_username;
  WHILE EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(username) = lower(v_username)
  ) LOOP
    v_counter := v_counter + 1;
    v_username := v_raw_username || '_' || (FLOOR(RANDOM() * 9000 + 1000)::INT)::TEXT;

    IF v_counter > 10 THEN
      v_username := v_raw_username || '_' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 8);
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO public.profiles (
    id,
    username,
    email,
    full_name,
    avatar_url,
    role,
    auth_provider
  ) VALUES (
    NEW.id,
    v_username,
    NEW.email,
    v_full_name,
    v_avatar_url,
    'student',
    v_provider
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE
      WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = ''
        THEN EXCLUDED.full_name
      ELSE public.profiles.full_name
    END,
    avatar_url = CASE
      WHEN public.profiles.avatar_url IS NULL OR public.profiles.avatar_url = ''
        THEN EXCLUDED.avatar_url
      ELSE public.profiles.avatar_url
    END,
    auth_provider = EXCLUDED.auth_provider,
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$profile$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Promote an owner only from the Supabase SQL editor or trusted server context:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'OWNER_EMAIL';
