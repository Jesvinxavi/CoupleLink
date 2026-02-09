-- 20260208_03_add_status_enums.sql
-- Add enums for status/category columns to align with frontend constants
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coupon_status') THEN
        CREATE TYPE public.coupon_status AS ENUM ('active', 'redeemed');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coupon_category') THEN
        CREATE TYPE public.coupon_category AS ENUM ('romantic', 'spicy', 'service', 'fun');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fantasy_status') THEN
        CREATE TYPE public.fantasy_status AS ENUM ('pending', 'approved', 'completed');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challenge_history_status') THEN
        CREATE TYPE public.challenge_history_status AS ENUM ('shown', 'completed', 'expired');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challenge_history_type') THEN
        CREATE TYPE public.challenge_history_type AS ENUM ('daily', 'weekly', 'monthly', 'question');
    END IF;
END $$;

ALTER TABLE public.coupons
    ALTER COLUMN status TYPE public.coupon_status USING (
        CASE
            WHEN status IS NULL THEN NULL
            WHEN status::text IN ('active', 'redeemed') THEN status::public.coupon_status
            ELSE NULL
        END
    ),
    ALTER COLUMN category TYPE public.coupon_category USING (
        CASE
            WHEN category IS NULL THEN NULL
            WHEN category::text IN ('romantic', 'spicy', 'service', 'fun') THEN category::public.coupon_category
            ELSE NULL
        END
    );

ALTER TABLE public.coupon_templates
    ALTER COLUMN category TYPE public.coupon_category USING (
        CASE
            WHEN category IS NULL THEN NULL
            WHEN category::text IN ('romantic', 'spicy', 'service', 'fun') THEN category::public.coupon_category
            ELSE NULL
        END
    );

ALTER TABLE public.fantasy_bucket_list
    ALTER COLUMN status TYPE public.fantasy_status USING (
        CASE
            WHEN status IS NULL THEN NULL
            WHEN status::text IN ('pending', 'approved', 'completed') THEN status::public.fantasy_status
            ELSE NULL
        END
    );

ALTER TABLE public.challenge_history
    ALTER COLUMN status TYPE public.challenge_history_status USING (
        CASE
            WHEN status IS NULL THEN NULL
            WHEN status::text IN ('shown', 'completed', 'expired') THEN status::public.challenge_history_status
            ELSE NULL
        END
    ),
    ALTER COLUMN challenge_type TYPE public.challenge_history_type USING (
        CASE
            WHEN challenge_type IS NULL THEN NULL
            WHEN challenge_type::text IN ('daily', 'weekly', 'monthly', 'question') THEN challenge_type::public.challenge_history_type
            ELSE NULL
        END
    );
