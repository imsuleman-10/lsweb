-- ==============================================================================
-- LITERARY SOCIETY UET — COMPLETE DATABASE MIGRATION SCRIPT
-- Paste and run this once in Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. Enum Types (Safe check)
DO $$ BEGIN
  ALTER TYPE system_role ADD VALUE IF NOT EXISTS 'managing_director';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE system_role ADD VALUE IF NOT EXISTS 'hr';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE system_role ADD VALUE IF NOT EXISTS 'mentor';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE society_position ADD VALUE IF NOT EXISTS 'managing_director';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE society_position ADD VALUE IF NOT EXISTS 'hr';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE society_position ADD VALUE IF NOT EXISTS 'mentor';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  published_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. OTP Verifications Table (Custom 6-Digit Code)
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  otp text NOT NULL,
  password_enc text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_verifications_email_idx ON public.otp_verifications(email);

-- 4. Poetry Table
CREATE TABLE IF NOT EXISTS public.poetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  language text NOT NULL DEFAULT 'Urdu',
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Push Subscriptions Table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Audit Logs Table (if not exists)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL DEFAULT 'general',
  entity_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Row Level Security Policies (Permissive for authenticated app)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read announcements for all" ON public.announcements;
CREATE POLICY "Allow read announcements for all" ON public.announcements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow all for service_role announcements" ON public.announcements;
CREATE POLICY "Allow all for service_role announcements" ON public.announcements FOR ALL TO service_role USING (true);

ALTER TABLE public.phylums ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read phylums for all" ON public.phylums;
CREATE POLICY "Allow read phylums for all" ON public.phylums FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow all for service_role phylums" ON public.phylums;
CREATE POLICY "Allow all for service_role phylums" ON public.phylums FOR ALL TO service_role USING (true);

ALTER TABLE public.poetry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read poetry for all" ON public.poetry;
CREATE POLICY "Allow read poetry for all" ON public.poetry FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow all for service_role poetry" ON public.poetry;
CREATE POLICY "Allow all for service_role poetry" ON public.poetry FOR ALL TO service_role USING (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read own notifications" ON public.notifications;
CREATE POLICY "Allow read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow all for service_role notifications" ON public.notifications;
CREATE POLICY "Allow all for service_role notifications" ON public.notifications FOR ALL TO service_role USING (true);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow own push subscriptions" ON public.push_subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow all for service_role push" ON public.push_subscriptions;
CREATE POLICY "Allow all for service_role push" ON public.push_subscriptions FOR ALL TO service_role USING (true);
