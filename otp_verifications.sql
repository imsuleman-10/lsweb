-- Run this in Supabase SQL Editor
-- Table for custom OTP-based signup verification

CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL,
  full_name    text NOT NULL DEFAULT '',
  otp          text NOT NULL,
  password_enc text NOT NULL,
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  used         boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Index for fast email lookup
CREATE INDEX IF NOT EXISTS otp_verifications_email_idx ON public.otp_verifications(email);

-- Auto-cleanup: delete expired records older than 1 hour
-- (Optional: run as a cron or just rely on app-level cleanup)

-- No RLS needed — only accessed via service role key from server
