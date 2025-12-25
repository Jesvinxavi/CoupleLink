-- Migration: Add Premium Status
-- Date: 2025-12-14

-- 1. Add is_premium column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT FALSE;

-- 2. Mock RPC to simulate purchase/upgrade
CREATE OR REPLACE FUNCTION public.upgrade_to_premium()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET is_premium = TRUE
  WHERE id = auth.uid();
END;
$$;
