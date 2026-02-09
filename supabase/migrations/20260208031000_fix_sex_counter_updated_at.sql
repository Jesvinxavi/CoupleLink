-- 20260208_03_fix_sex_counter_updated_at.sql
-- Align sex_counter timestamp column with updated_at naming
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'sex_counter'
          AND column_name = 'last_updated'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'sex_counter'
          AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.sex_counter RENAME COLUMN last_updated TO updated_at;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'sex_counter'
          AND column_name = 'last_updated'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'sex_counter'
          AND column_name = 'updated_at'
    ) THEN
        UPDATE public.sex_counter
        SET updated_at = COALESCE(updated_at, last_updated);

        ALTER TABLE public.sex_counter DROP COLUMN last_updated;
    END IF;
END $$;

ALTER TABLE public.sex_counter
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
