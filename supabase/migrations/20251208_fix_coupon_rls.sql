
-- Drop existing policies to be safe
DROP POLICY IF EXISTS "Couples can view their own coupons" ON public.coupons;
DROP POLICY IF EXISTS "Couples can insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Couples can update their own coupons" ON public.coupons;
DROP POLICY IF EXISTS "Couples can delete their own coupons" ON public.coupons;

-- Re-create with safer "EXISTS" logic that strictly checks auth.uid()
-- This avoids fetching the partner's profile which might trigger other policies/recursions.

CREATE POLICY "Couples can view their own coupons"
    ON public.coupons FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.couple_id = coupons.couple_id
        )
    );

CREATE POLICY "Couples can insert coupons"
    ON public.coupons FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.couple_id = coupons.couple_id
        )
    );

CREATE POLICY "Couples can update their own coupons"
    ON public.coupons FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.couple_id = coupons.couple_id
        )
    );

CREATE POLICY "Couples can delete their own coupons"
    ON public.coupons FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.couple_id = coupons.couple_id
        )
    );
