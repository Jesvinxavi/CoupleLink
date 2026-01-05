-- 20251230_00_consolidated_schema.sql
-- Consolidates schema changes for Sex, Dates, Fantasy, Coupons, and core table alterations.

-- 1. BASE TABLES for New Features
-- Sex Counter
CREATE TABLE IF NOT EXISTS public.sex_counter (
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (couple_id)
);

-- Completed Positions
CREATE TABLE IF NOT EXISTS public.completed_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    position_id TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    UNIQUE(couple_id, position_id)
);

-- User Dates (Date Ideas)
CREATE TABLE IF NOT EXISTS public.user_dates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    duration TEXT,
    cost TEXT,
    checklist JSONB DEFAULT '[]'::jsonb,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Fantasy Bucket List
CREATE TABLE IF NOT EXISTS public.fantasy_bucket_list (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed')),
    requester_id UUID NOT NULL REFERENCES auth.users(id),
    approver_id UUID REFERENCES auth.users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    category TEXT DEFAULT 'general'
);

-- Coupon Templates (Static/Admin data)
CREATE TABLE IF NOT EXISTS public.coupon_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('romantic', 'spicy', 'service', 'fun')),
    intensity INTEGER DEFAULT 1,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Coupons (User/Couple instances)
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('romantic', 'spicy', 'service', 'fun')),
    assigned_to UUID NOT NULL REFERENCES auth.users(id),
    is_redeemed BOOLEAN DEFAULT false,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    template_id UUID REFERENCES public.coupon_templates(id) ON DELETE SET NULL
);

-- Challenge History (Tracks shown/completed/expired challenges)
CREATE TABLE IF NOT EXISTS public.challenge_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('daily', 'weekly', 'monthly', 'question')),
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    period_key TEXT NOT NULL, -- e.g., '2026-01-05' for daily, '2026-W01' for weekly
    status TEXT DEFAULT 'shown' CHECK (status IN ('shown', 'completed', 'expired')),
    shown_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(couple_id, challenge_type, period_key)
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_challenge_history_couple_type ON public.challenge_history(couple_id, challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenge_history_status ON public.challenge_history(status);
CREATE INDEX IF NOT EXISTS idx_challenge_history_lookup ON public.challenge_history(couple_id, challenge_type, status, activity_id);


-- 2. ALTERATIONS to Existing Core Tables

-- Couples Table Additions
ALTER TABLE public.couples 
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS spicy_mode BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS previous_streak INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rain_check_tokens INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_love_points INTEGER DEFAULT 0;

-- Profiles Table Additions
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS competition_points INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS unclaimed_vouchers INTEGER DEFAULT 0;

-- Memories Table Additions
ALTER TABLE public.memories
    ADD COLUMN IF NOT EXISTS challenge_id TEXT;

-- 3. INDICES and PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_memories_challenge_id ON public.memories(challenge_id);
CREATE INDEX IF NOT EXISTS idx_couples_user_one ON public.couples(user_one_id);
CREATE INDEX IF NOT EXISTS idx_couples_user_two ON public.couples(user_two_id);
CREATE INDEX IF NOT EXISTS idx_activities_category ON public.activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);

-- 4. REPLICATION
-- Ensure DELETE events on memories send full rows for Realtime filtering
ALTER TABLE public.memories REPLICA IDENTITY FULL;
