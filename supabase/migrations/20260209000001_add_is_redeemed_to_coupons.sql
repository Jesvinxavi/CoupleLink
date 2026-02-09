-- Add missing is_redeemed column to coupons
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS is_redeemed BOOLEAN DEFAULT false;
