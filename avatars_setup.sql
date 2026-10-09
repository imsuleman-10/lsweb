-- Full role & positions reference for Literary Society UET
-- Run this in Supabase SQL Editor

-- Add new columns if not already present
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phylum_id uuid REFERENCES public.phylums(id) ON DELETE SET NULL;

-- Add director/head assignment to phylums table
ALTER TABLE public.phylums ADD COLUMN IF NOT EXISTS director_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.phylums ADD COLUMN IF NOT EXISTS head_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.phylums ADD COLUMN IF NOT EXISTS type text DEFAULT 'phylum' CHECK (type IN ('phylum', 'wing'));

-- Avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (run each separately if needed)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public avatars access' AND tablename = 'objects') THEN
    CREATE POLICY "Public avatars access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'User can upload avatar' AND tablename = 'objects') THEN
    CREATE POLICY "User can upload avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'User can update avatar' AND tablename = 'objects') THEN
    CREATE POLICY "User can update avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
  END IF;
END $$;
