-- Add granular last_seen columns to profiles for fantasy tabs
-- Dependent on: 20260105202020_add_seen_timestamps.sql

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS last_seen_fantasy_pending TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS last_seen_fantasy_approved TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS last_seen_fantasy_completed TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
