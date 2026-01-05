-- Add last_seen columns to profiles for 'new' badge logic
-- Dependent on: 20251230000000_consolidated_schema.sql (profiles table existence)

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS last_seen_fantasies TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS last_seen_coupons TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
