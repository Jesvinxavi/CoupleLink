-- 20260208_020000_fix_schema_mismatches.sql
-- Align schema with frontend expectations and add missing indexes.

-- Fantasy bucket list: ensure fantasy_text and responded_at
ALTER TABLE public.fantasy_bucket_list
    ADD COLUMN IF NOT EXISTS fantasy_text TEXT,
    ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'fantasy_bucket_list'
          AND column_name = 'title'
    ) THEN
        UPDATE public.fantasy_bucket_list
        SET fantasy_text = COALESCE(fantasy_text, title)
        WHERE title IS NOT NULL;

        ALTER TABLE public.fantasy_bucket_list
            DROP COLUMN title;
    END IF;
END $$;

-- Coupons: normalize expiry column and add missing fields
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'coupons'
          AND column_name = 'expiry_date'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'coupons'
          AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE public.coupons
            RENAME COLUMN expiry_date TO expires_at;
    END IF;
END $$;

ALTER TABLE public.coupons
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'redeemed')),
    ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS gifted_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS gift_message TEXT,
    ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.coupons
    ALTER COLUMN assigned_to DROP NOT NULL;

UPDATE public.coupons
SET status = CASE WHEN is_redeemed THEN 'redeemed' ELSE 'active' END
WHERE status IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'coupons'
          AND column_name = 'expiry_date'
    ) THEN
        UPDATE public.coupons
        SET expires_at = COALESCE(expires_at, expiry_date)
        WHERE expires_at IS NULL AND expiry_date IS NOT NULL;

        ALTER TABLE public.coupons
            DROP COLUMN expiry_date;
    END IF;
END $$;

-- Indexes for frequent access paths
CREATE INDEX IF NOT EXISTS idx_coupons_assigned_to ON public.coupons(assigned_to);
CREATE INDEX IF NOT EXISTS idx_coupons_couple_id ON public.coupons(couple_id);
CREATE INDEX IF NOT EXISTS idx_coupons_template_id ON public.coupons(template_id);
CREATE INDEX IF NOT EXISTS idx_coupons_gifted_by ON public.coupons(gifted_by);
CREATE INDEX IF NOT EXISTS idx_coupons_couple_assigned_status ON public.coupons(couple_id, assigned_to, status);

CREATE INDEX IF NOT EXISTS idx_fantasy_bucket_list_couple_id ON public.fantasy_bucket_list(couple_id);
CREATE INDEX IF NOT EXISTS idx_fantasy_bucket_list_requester_id ON public.fantasy_bucket_list(requester_id);
CREATE INDEX IF NOT EXISTS idx_fantasy_bucket_list_approver_id ON public.fantasy_bucket_list(approver_id);
CREATE INDEX IF NOT EXISTS idx_fantasy_bucket_list_couple_status ON public.fantasy_bucket_list(couple_id, status);

CREATE INDEX IF NOT EXISTS idx_user_dates_couple_id ON public.user_dates(couple_id);
CREATE INDEX IF NOT EXISTS idx_completed_positions_couple_id ON public.completed_positions(couple_id);
CREATE INDEX IF NOT EXISTS idx_completed_positions_position_id ON public.completed_positions(position_id);

CREATE INDEX IF NOT EXISTS idx_challenge_history_couple_activity ON public.challenge_history(couple_id, activity_id);
