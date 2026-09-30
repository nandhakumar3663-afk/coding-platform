-- Per-user saved code drafts for the Monaco editor
-- One draft per authenticated user + problem + language.

CREATE TABLE IF NOT EXISTS public.saved_code (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_slug TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('python', 'cpp', 'c', 'java')),
  code TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, problem_slug, language)
);

ALTER TABLE public.saved_code ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own saved code" ON public.saved_code;
DROP POLICY IF EXISTS "Users can insert own saved code" ON public.saved_code;
DROP POLICY IF EXISTS "Users can update own saved code" ON public.saved_code;
DROP POLICY IF EXISTS "Users can delete own saved code" ON public.saved_code;

CREATE POLICY "Users can read own saved code"
  ON public.saved_code
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own saved code"
  ON public.saved_code
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own saved code"
  ON public.saved_code
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own saved code"
  ON public.saved_code
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

REVOKE ALL ON TABLE public.saved_code FROM anon;
REVOKE ALL ON TABLE public.saved_code FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.saved_code TO authenticated;

CREATE INDEX IF NOT EXISTS saved_code_user_updated_idx
  ON public.saved_code (user_id, updated_at DESC);
