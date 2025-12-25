-- 1. Performance Indices
CREATE INDEX IF NOT EXISTS idx_couples_user_one ON public.couples(user_one_id);
CREATE INDEX IF NOT EXISTS idx_couples_user_two ON public.couples(user_two_id);

-- 2. Refactor Foreign Keys to ON DELETE CASCADE
-- We wrap this in a DO block to safely handle constraint dropping/adding
DO $$
DECLARE
    -- List of tables and their constraint names (derived from previous schema inspection)
    -- Format: table_name, constraint_name
    r RECORD;
BEGIN
    FOR r IN SELECT * FROM (VALUES 
        ('memories', 'memories_couple_id_fkey'),
        ('calendar_events', 'calendar_events_couple_id_fkey'),
        ('user_answers', 'user_answers_couple_id_fkey'),
        ('folders', 'folders_couple_id_fkey'),
        ('sex_counter', 'sex_counter_couple_id_fkey'),
        ('completed_positions', 'completed_positions_couple_id_fkey'),
        ('fantasy_bucket_list', 'fantasy_bucket_list_couple_id_fkey'),
        ('coupons', 'coupons_couple_id_fkey'),
        ('user_dates', 'user_dates_couple_id_fkey'),
        ('game_sessions', 'game_sessions_couple_id_fkey')
    ) AS t(table_name, constraint_name)
    LOOP
        -- 1. Drop existing constraint
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
        
        -- 2. Add new constraint with ON DELETE CASCADE
        -- Note: We assume the foreign key always points to couples(id) which matches the previous schema
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE', r.table_name, r.constraint_name);
    END LOOP;
END $$;
