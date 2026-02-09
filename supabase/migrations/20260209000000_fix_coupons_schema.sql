-- Fix missing category column in coupons table
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('romantic', 'spicy', 'service', 'fun'));
