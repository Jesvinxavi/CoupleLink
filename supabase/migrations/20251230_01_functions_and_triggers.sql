-- 20251230_01_functions_and_triggers.sql
-- Consolidates all RPC functions and triggers, resolving version conflicts.

-- 1. STREAK MANAGEMENT
-- Robust version using challenge_id matching for partner verification
DROP FUNCTION IF EXISTS check_and_update_streak(UUID);
CREATE OR REPLACE FUNCTION check_and_update_streak(p_couple_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_one_id UUID;
    v_user_two_id UUID;
    v_last_activity_date DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
    v_q_count INTEGER;
    v_c_count INTEGER;
    v_today DATE := CURRENT_DATE;
    v_yesterday DATE := CURRENT_DATE - 1;
    v_streak_updated BOOLEAN := FALSE;
BEGIN
    SELECT user_one_id, user_two_id, last_activity_date::DATE, current_streak, longest_streak
    INTO v_user_one_id, v_user_two_id, v_last_activity_date, v_current_streak, v_longest_streak
    FROM couples
    WHERE id = p_couple_id;

    IF v_current_streak IS NULL THEN v_current_streak := 0; END IF;
    IF v_longest_streak IS NULL THEN v_longest_streak := 0; END IF;

    -- 1. Check if both partners answered today's question
    SELECT COUNT(DISTINCT user_id) INTO v_q_count
    FROM user_answers ua
    JOIN activities a ON ua.activity_id = a.id
    WHERE ua.couple_id = p_couple_id
    AND ua.created_at::DATE = v_today
    AND a.type IN ('quiz', 'draw');

    -- 2. Check if challenge was completed by BOTH partners (using challenge_id matching)
    SELECT COUNT(*) INTO v_c_count
    FROM memories m
    WHERE m.couple_id = p_couple_id
    AND m.type = 'challenge'
    AND m.created_at::DATE = v_today
    AND EXISTS (
        SELECT 1 FROM memories partner_m
        WHERE partner_m.couple_id = m.couple_id
        AND partner_m.type = 'challenge'
        AND partner_m.uploader_id != m.uploader_id
        AND (
            -- Robust match: Both have the same non-null challenge_id
            (m.challenge_id IS NOT NULL AND partner_m.challenge_id = m.challenge_id)
            OR 
            -- Fallback match: If ID missing, match by Title
            (m.challenge_id IS NULL AND partner_m.title = m.title)
        )
    );

    -- Requirements: Both answered (count=2) OR at least one completed challenge (count>=1)
    IF v_q_count >= 2 OR v_c_count >= 1 THEN
        -- Requirements met!
        
        -- Check if already updated today
        IF v_last_activity_date IS NULL OR v_last_activity_date < v_today THEN
            
            IF v_last_activity_date = v_yesterday THEN
                v_current_streak := v_current_streak + 1;
            ELSE
                -- Streak broken or new, start at 1
                v_current_streak := 1;
            END IF;

            -- Update longest streak
            IF v_current_streak > v_longest_streak THEN
                v_longest_streak := v_current_streak;
            END IF;

            UPDATE couples
            SET current_streak = v_current_streak,
                longest_streak = v_longest_streak,
                last_activity_date = v_today
            WHERE id = p_couple_id;
            
            v_streak_updated := TRUE;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'streak_updated', v_streak_updated,
        'current_streak', v_current_streak
    );
END;
$$;


-- 2. COUPLE RESTORE LOGIC (Merged)

-- check_archived_couple
-- Checks active status AND correct stats
DROP FUNCTION IF EXISTS public.check_archived_couple(text);
CREATE OR REPLACE FUNCTION public.check_archived_couple(partner_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  partner_id uuid;
  archived_couple_id uuid;
  partner_active_couple_id uuid;
  photo_count bigint;
  journal_count bigint;
  history_start date;
  history_end timestamptz;
  duration_days int;
BEGIN
  current_user_id := auth.uid();
  
  -- Find partner ID
  SELECT id INTO partner_id FROM auth.users WHERE email = partner_email LIMIT 1;
  IF partner_id IS NULL THEN RETURN NULL; END IF;

  -- Check if partner is ALREADY in an active couple
  SELECT couple_id INTO partner_active_couple_id FROM public.profiles WHERE id = partner_id;
  IF partner_active_couple_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.couples WHERE id = partner_active_couple_id AND status = 'active') THEN
          partner_active_couple_id := NULL; 
      END IF;
  END IF;

  -- Find archived couple
  SELECT id, anniversary_date, archived_at INTO archived_couple_id, history_start, history_end
  FROM public.couples
  WHERE ((user_one_id = current_user_id AND user_two_id = partner_id) OR (user_one_id = partner_id AND user_two_id = current_user_id))
  AND status = 'archived'
  ORDER BY archived_at DESC
  LIMIT 1;

  IF archived_couple_id IS NULL THEN RETURN NULL; END IF;

  -- Stats
  SELECT count(*) INTO photo_count FROM public.memories WHERE couple_id = archived_couple_id AND type = 'image';
  SELECT count(*) INTO journal_count FROM public.memories WHERE couple_id = archived_couple_id AND type = 'journal';

  IF history_end IS NOT NULL AND history_start IS NOT NULL THEN
     duration_days := (date(history_end) - history_start);
     IF duration_days < 0 THEN duration_days := 0; END IF;
  ELSE
     duration_days := 0;
  END IF;

  RETURN json_build_object(
    'found', true,
    'couple_id', archived_couple_id,
    'partner_active_couple_id', partner_active_couple_id,
    'stats', json_build_object('photo_count', photo_count, 'journal_count', journal_count, 'duration_days', duration_days)
  );
END;
$$;

-- check_existing_archive_for_pair
-- Merged: 7-day expiry + anniversary duration + returns 'expires_at'
DROP FUNCTION IF EXISTS public.check_existing_archive_for_pair();
CREATE OR REPLACE FUNCTION public.check_existing_archive_for_pair()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  current_couple_id uuid;
  partner_id uuid;
  archived_couple_record record;
  photo_count bigint;
  journal_count bigint;
  history_start date;
  history_end timestamptz;
  duration_days int;
  
  -- Logic for temporary space expiry
  v_current_created_at timestamptz;
  v_expires_at timestamptz;
BEGIN
  current_user_id := auth.uid();
  SELECT couple_id INTO current_couple_id FROM public.profiles WHERE id = current_user_id;

  IF current_couple_id IS NULL THEN RETURN NULL; END IF;

  -- Get partner & created_at of current temporary couple
  SELECT 
    CASE WHEN user_one_id = current_user_id THEN user_two_id ELSE user_one_id END,
    created_at
  INTO partner_id, v_current_created_at
  FROM public.couples
  WHERE id = current_couple_id;

  IF partner_id IS NULL THEN RETURN NULL; END IF;
  
  -- Expiry Check: If current couple is > 7 days old, do not offer restore
  v_expires_at := v_current_created_at + interval '7 days';
  IF now() > v_expires_at THEN RETURN NULL; END IF;

  -- Find archive
  SELECT * INTO archived_couple_record
  FROM public.couples
  WHERE ((user_one_id = current_user_id AND user_two_id = partner_id) OR (user_one_id = partner_id AND user_two_id = current_user_id))
  AND status = 'archived'
  ORDER BY archived_at DESC
  LIMIT 1;

  IF archived_couple_record IS NULL THEN RETURN NULL; END IF;

  -- Stats
  SELECT count(*) INTO photo_count FROM public.memories WHERE couple_id = archived_couple_record.id AND type = 'image';
  SELECT count(*) INTO journal_count FROM public.memories WHERE couple_id = archived_couple_record.id AND type = 'journal';

  history_start := archived_couple_record.anniversary_date;
  history_end := archived_couple_record.archived_at;
  
  IF history_end IS NOT NULL AND history_start IS NOT NULL THEN
     duration_days := (date(history_end) - history_start);
     IF duration_days < 0 THEN duration_days := 0; END IF;
  ELSE
     duration_days := 0;
  END IF;

  RETURN json_build_object(
    'found', true,
    'archived_couple_id', archived_couple_record.id,
    'archived_at', archived_couple_record.archived_at,
    'expires_at', v_expires_at,
    'stats', json_build_object('photo_count', photo_count, 'journal_count', journal_count, 'duration_days', duration_days)
  );
END;
$$;

-- restore_archived_and_delete_current
-- Uses clean CASCADE logic
DROP FUNCTION IF EXISTS public.restore_archived_and_delete_current(uuid);
CREATE OR REPLACE FUNCTION public.restore_archived_and_delete_current(archived_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  current_couple_id uuid;
  target_user_one uuid;
  target_user_two uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Validation
  SELECT user_one_id, user_two_id INTO target_user_one, target_user_two
  FROM public.couples
  WHERE id = archived_id AND (user_one_id = current_user_id OR user_two_id = current_user_id);
  
  IF target_user_one IS NULL THEN RAISE EXCEPTION 'Access Denied'; END IF;

  -- Get current active couple
  SELECT couple_id INTO current_couple_id FROM public.profiles WHERE id = current_user_id;

  -- 1. Point Profiles to Archive
  UPDATE public.profiles SET couple_id = archived_id WHERE id IN (target_user_one, target_user_two);

  -- 2. Restore Archive
  UPDATE public.couples SET status = 'active', archived_at = NULL WHERE id = archived_id;

  -- 3. Delete Temp
  IF current_couple_id IS NOT NULL AND current_couple_id <> archived_id THEN
      DELETE FROM public.couples WHERE id = current_couple_id;
  END IF;
END;
$$;

-- 3. COUPLE CORE OPS

-- unpair_couple (Archive version)
DROP FUNCTION IF EXISTS unpair_couple();
CREATE OR REPLACE FUNCTION unpair_couple()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  v_couple_id UUID;
BEGIN
  current_user_id := auth.uid();

  FOR v_couple_id IN 
      SELECT id FROM couples 
      WHERE (user_one_id = current_user_id OR user_two_id = current_user_id) 
      AND status = 'active'
  LOOP
      -- Archive it
      UPDATE couples 
      SET status = 'archived', archived_at = NOW() 
      WHERE id = v_couple_id;
      
      -- Clear profile references
      UPDATE profiles 
      SET couple_id = NULL 
      WHERE couple_id = v_couple_id;
  END LOOP;
END;
$$;

-- join_couple (Removed archive check block)
DROP FUNCTION IF EXISTS join_couple(text);
CREATE OR REPLACE FUNCTION join_couple(invite_code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_couple_id UUID;
  current_user_id UUID;
  v_user_one UUID;
  v_user_two UUID;
BEGIN
  current_user_id := auth.uid();

  -- Find couple by code (case insensitive)
  SELECT id, user_one_id, user_two_id INTO v_couple_id, v_user_one, v_user_two
  FROM couples
  WHERE lower(invite_code) = lower(invite_code_input)
  AND status = 'active';

  IF v_couple_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid invite code');
  END IF;

  IF v_user_two IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Couple is full');
  END IF;

  IF v_user_one = current_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'You cannot join your own couple');
  END IF;

  -- Update couple
  UPDATE couples
  SET user_two_id = current_user_id
  WHERE id = v_couple_id;

  -- Update profile
  UPDATE profiles
  SET couple_id = v_couple_id
  WHERE id = current_user_id;

  RETURN jsonb_build_object('success', true, 'couple_id', v_couple_id);
END;
$$;


-- 4. UTILS & HELPERS

-- get_daily_question (Deterministic)
DROP FUNCTION IF EXISTS get_daily_question(UUID);
CREATE OR REPLACE FUNCTION get_daily_question(couple_id_input UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_activity_data JSONB;
    v_count INTEGER;
    v_offset INTEGER;
    v_seed INTEGER;
    v_spicy_mode BOOLEAN;
BEGIN
    SELECT spicy_mode INTO v_spicy_mode FROM couples WHERE id = couple_id_input;
    IF v_spicy_mode IS NULL THEN v_spicy_mode := FALSE; END IF;

    SELECT COUNT(*) INTO v_count 
    FROM activities 
    WHERE type = 'quiz'
    AND (v_spicy_mode = TRUE OR (content->>'isSpicy')::BOOLEAN IS NOT TRUE);
    
    IF v_count = 0 THEN RETURN jsonb_build_object('success', false, 'message', 'No questions found'); END IF;

    v_seed := ABS(hashtext(couple_id_input::TEXT) + (EXTRACT(YEAR FROM CURRENT_DATE) * 1000 + EXTRACT(DOY FROM CURRENT_DATE))::INTEGER);
    v_offset := v_seed % v_count;
    
    SELECT jsonb_build_object('id', id, 'category', category, 'type', type, 'content', content)
    INTO v_activity_data
    FROM activities
    WHERE type = 'quiz'
    AND (v_spicy_mode = TRUE OR (content->>'isSpicy')::BOOLEAN IS NOT TRUE)
    ORDER BY id
    LIMIT 1 OFFSET v_offset;

    RETURN jsonb_build_object('success', true, 'data', v_activity_data);
END;
$$;

-- get_active_challenge
-- Probability-based deterministic selection for challenge sync between partners
DROP FUNCTION IF EXISTS get_active_challenge(UUID, TEXT);
CREATE OR REPLACE FUNCTION get_active_challenge(couple_id_input UUID, frequency_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_activity_data JSONB;
    v_count INTEGER;
    v_offset INTEGER;
    v_seed INTEGER;
    v_date_factor INTEGER;
    v_roll DOUBLE PRECISION;
    v_is_competition BOOLEAN;
    v_is_online_game BOOLEAN;
    v_is_spicy BOOLEAN;
    v_spicy_mode BOOLEAN;
BEGIN
    -- Get Spicy Mode setting
    SELECT spicy_mode INTO v_spicy_mode FROM couples WHERE id = couple_id_input;
    IF v_spicy_mode IS NULL THEN v_spicy_mode := FALSE; END IF;

    -- Calculate date factor based on frequency for deterministic seeding
    IF frequency_input = 'daily' THEN
        v_date_factor := (EXTRACT(YEAR FROM CURRENT_DATE) * 1000 + EXTRACT(DOY FROM CURRENT_DATE))::INTEGER;
    ELSIF frequency_input = 'weekly' THEN
        v_date_factor := (EXTRACT(ISOYEAR FROM CURRENT_DATE) * 100 + EXTRACT(WEEK FROM CURRENT_DATE))::INTEGER;
    ELSIF frequency_input = 'monthly' THEN
        v_date_factor := (EXTRACT(YEAR FROM CURRENT_DATE) * 100 + EXTRACT(MONTH FROM CURRENT_DATE))::INTEGER;
    ELSE
        v_date_factor := (EXTRACT(YEAR FROM CURRENT_DATE) * 1000 + EXTRACT(DOY FROM CURRENT_DATE))::INTEGER;
    END IF;

    -- Generate deterministic seed and roll value (0-1)
    v_seed := ABS(hashtext(couple_id_input::TEXT || frequency_input || v_date_factor::TEXT));
    v_roll := (v_seed % 1000) / 1000.0;

    -- Initialize bucket flags
    v_is_competition := NULL;
    v_is_online_game := FALSE;
    v_is_spicy := FALSE;

    -- Spicy Mode bucket logic
    IF v_spicy_mode THEN
        DECLARE
            v_spicy_prob DOUBLE PRECISION := 0.0;
        BEGIN
            IF frequency_input = 'daily' THEN
                v_spicy_prob := 0.12;  -- 12% spicy for daily
            ELSIF frequency_input = 'weekly' THEN
                v_spicy_prob := 0.15;  -- 15% spicy for weekly
            ELSIF frequency_input = 'monthly' THEN
                v_spicy_prob := 0.0;   -- No spicy monthly challenges
            END IF;

            IF v_roll < v_spicy_prob THEN
                v_is_spicy := TRUE;
            ELSE
                -- Rescale roll for remaining percentage
                IF v_spicy_prob > 0 THEN
                    v_roll := (v_roll - v_spicy_prob) / (1.0 - v_spicy_prob);
                END IF;
            END IF;
        END;
    END IF;

    -- Standard bucket logic (if NOT spicy selected)
    IF NOT v_is_spicy THEN
        IF frequency_input = 'daily' THEN
            -- Daily: 20% Competitive, 80% Normal
            IF v_roll < 0.20 THEN v_is_competition := TRUE; ELSE v_is_competition := FALSE; END IF;
        ELSIF frequency_input = 'weekly' THEN
            -- Weekly: 20% Online Game, 33% Competitive, 47% Normal
            IF v_roll < 0.20 THEN
                v_is_online_game := TRUE; v_is_competition := TRUE;
            ELSIF v_roll < 0.53 THEN
                v_is_competition := TRUE;
            ELSE
                v_is_competition := FALSE;
            END IF;
        ELSIF frequency_input = 'monthly' THEN
            -- Monthly: 33% Competitive, 67% Normal
            IF v_roll < 0.33 THEN v_is_competition := TRUE; ELSE v_is_competition := FALSE; END IF;
        END IF;
    END IF;

    -- Count matching challenges (excluding completed and within cooloff)
    SELECT COUNT(*) INTO v_count 
    FROM activities 
    WHERE type = 'challenge' 
    AND content->>'frequency' = frequency_input
    -- Exclude completed challenges OR uncompleted within cooloff period
    AND id NOT IN (
        SELECT activity_id FROM challenge_history 
        WHERE couple_id = couple_id_input 
        AND challenge_type = frequency_input 
        AND activity_id IS NOT NULL
        AND (
            -- Always exclude completed
            status = 'completed'
            OR (
                -- Exclude uncompleted within cooloff period
                status IN ('shown', 'expired') AND
                shown_at > NOW() - CASE frequency_input
                    WHEN 'daily' THEN INTERVAL '14 days'
                    WHEN 'weekly' THEN INTERVAL '4 weeks'
                    WHEN 'monthly' THEN INTERVAL '3 months'
                    ELSE INTERVAL '14 days'
                END
            )
        )
    )
    -- Spicy Filter
    AND (
        (v_spicy_mode = FALSE AND (content->>'isSpicy')::BOOLEAN IS NOT TRUE)
        OR
        (v_spicy_mode = TRUE AND (
            (v_is_spicy = TRUE AND (content->>'isSpicy')::BOOLEAN = TRUE) 
            OR 
            (v_is_spicy = FALSE AND (content->>'isSpicy')::BOOLEAN IS NOT TRUE)
        ))
    )
    -- Competition/Online filters (only if NOT spicy bucket)
    AND (
        v_is_spicy = TRUE 
        OR 
        (
            (v_is_competition IS NULL OR (content->>'isCompetition')::BOOLEAN = v_is_competition)
            AND
            (NOT v_is_online_game OR content->>'title' ILIKE '%Online Game%')
            AND
            (v_is_online_game OR content->>'title' NOT ILIKE '%Online Game%')
        )
    );
    
    -- If all challenges are completed, reset by allowing all (cycle complete)
    IF v_count = 0 THEN
        SELECT COUNT(*) INTO v_count 
        FROM activities 
        WHERE type = 'challenge' 
        AND content->>'frequency' = frequency_input
        AND (
            (v_spicy_mode = FALSE AND (content->>'isSpicy')::BOOLEAN IS NOT TRUE)
            OR
            (v_spicy_mode = TRUE AND (
                (v_is_spicy = TRUE AND (content->>'isSpicy')::BOOLEAN = TRUE) 
                OR 
                (v_is_spicy = FALSE AND (content->>'isSpicy')::BOOLEAN IS NOT TRUE)
            ))
        )
        AND (
            v_is_spicy = TRUE 
            OR 
            (
                (v_is_competition IS NULL OR (content->>'isCompetition')::BOOLEAN = v_is_competition)
                AND
                (NOT v_is_online_game OR content->>'title' ILIKE '%Online Game%')
                AND
                (v_is_online_game OR content->>'title' NOT ILIKE '%Online Game%')
            )
        );
    END IF;

    -- Fallback: If no challenge found in specific bucket, use any matching frequency
    IF v_count = 0 THEN
        SELECT COUNT(*) INTO v_count 
        FROM activities 
        WHERE type = 'challenge' 
        AND content->>'frequency' = frequency_input
        AND (v_spicy_mode = TRUE OR (content->>'isSpicy')::BOOLEAN IS NOT TRUE);
        
        -- Reset strict filters
        v_is_spicy := FALSE; 
        v_is_competition := NULL; 
        v_is_online_game := FALSE;
    END IF;

    IF v_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'No challenges found');
    END IF;

    -- Deterministic offset selection
    v_offset := v_seed % v_count;
    
    -- Select the challenge (with same filters as COUNT)
    SELECT jsonb_build_object(
        'id', id,
        'category', category,
        'type', content->>'frequency',
        'title', content->>'title',
        'description', content->>'description',
        'durationMinutes', (content->>'durationMinutes')::INTEGER,
        'isCompetition', (content->>'isCompetition')::BOOLEAN,
        'isSpicy', (content->>'isSpicy')::BOOLEAN
    )
    INTO v_activity_data
    FROM activities
    WHERE type = 'challenge'
    AND content->>'frequency' = frequency_input
    -- Exclude completed and within-cooloff challenges (same filter as COUNT, unless pool exhausted)
    AND (
        id NOT IN (
            SELECT activity_id FROM challenge_history 
            WHERE couple_id = couple_id_input 
            AND challenge_type = frequency_input 
            AND activity_id IS NOT NULL
            AND (
                status = 'completed'
                OR (
                    status IN ('shown', 'expired') AND
                    shown_at > NOW() - CASE frequency_input
                        WHEN 'daily' THEN INTERVAL '14 days'
                        WHEN 'weekly' THEN INTERVAL '4 weeks'
                        WHEN 'monthly' THEN INTERVAL '3 months'
                        ELSE INTERVAL '14 days'
                    END
                )
            )
        )
        OR NOT EXISTS (
            SELECT 1 FROM activities a2
            WHERE a2.type = 'challenge'
            AND a2.content->>'frequency' = frequency_input
            AND a2.id NOT IN (
                SELECT activity_id FROM challenge_history 
                WHERE couple_id = couple_id_input 
                AND challenge_type = frequency_input 
                AND activity_id IS NOT NULL
                AND (
                    status = 'completed'
                    OR (
                        status IN ('shown', 'expired') AND
                        shown_at > NOW() - CASE frequency_input
                            WHEN 'daily' THEN INTERVAL '14 days'
                            WHEN 'weekly' THEN INTERVAL '4 weeks'
                            WHEN 'monthly' THEN INTERVAL '3 months'
                            ELSE INTERVAL '14 days'
                        END
                    )
                )
            )
        )
    )
    AND (
        (v_spicy_mode = FALSE AND (content->>'isSpicy')::BOOLEAN IS NOT TRUE)
        OR
        (v_spicy_mode = TRUE AND v_is_spicy = TRUE AND (content->>'isSpicy')::BOOLEAN = TRUE)
        OR
        (v_spicy_mode = TRUE AND v_is_spicy = FALSE AND (content->>'isSpicy')::BOOLEAN IS NOT TRUE)
        OR 
        (v_spicy_mode = TRUE AND v_is_competition IS NULL AND v_is_online_game = FALSE) 
    )
    AND (
        v_is_spicy = TRUE
        OR
        (
            (v_is_competition IS NULL OR (content->>'isCompetition')::BOOLEAN = v_is_competition)
            AND
            (NOT v_is_online_game OR content->>'title' ILIKE '%Online Game%')
            AND
            (v_is_online_game OR content->>'title' NOT ILIKE '%Online Game%')
        )
    )
    ORDER BY id
    LIMIT 1 OFFSET v_offset;

    RETURN jsonb_build_object('success', true, 'data', v_activity_data);
END;
$$;


-- 4b. CHALLENGE POOL STATUS & RESET

-- Get challenge pool status (total vs shown for each frequency)
DROP FUNCTION IF EXISTS get_challenge_pool_status(UUID);
CREATE OR REPLACE FUNCTION get_challenge_pool_status(couple_id_input UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_spicy_mode BOOLEAN;
    v_result JSONB := '{}';
    v_frequency TEXT;
    v_total INTEGER;
    v_shown INTEGER;
BEGIN
    -- Get Spicy Mode setting
    SELECT spicy_mode INTO v_spicy_mode FROM couples WHERE id = couple_id_input;
    IF v_spicy_mode IS NULL THEN v_spicy_mode := FALSE; END IF;

    -- Calculate for each frequency
    FOR v_frequency IN SELECT unnest(ARRAY['daily', 'weekly', 'monthly']) LOOP
        -- Count total challenges available (matching spicy mode)
        SELECT COUNT(*) INTO v_total
        FROM activities
        WHERE type = 'challenge'
        AND content->>'frequency' = v_frequency
        AND (
            (v_spicy_mode = FALSE AND (content->>'isSpicy')::BOOLEAN IS NOT TRUE)
            OR v_spicy_mode = TRUE
        );

        -- Count distinct shown challenges for this couple
        SELECT COUNT(DISTINCT activity_id) INTO v_shown
        FROM challenge_history
        WHERE couple_id = couple_id_input
        AND challenge_type = v_frequency
        AND activity_id IS NOT NULL;

        v_result := v_result || jsonb_build_object(
            v_frequency, jsonb_build_object(
                'total', v_total,
                'shown', v_shown,
                'allShown', v_shown >= v_total AND v_total > 0
            )
        );
    END LOOP;

    RETURN jsonb_build_object('success', true, 'data', v_result);
END;
$$;

-- Reset challenge cycle (clears cooloff without deleting history)
DROP FUNCTION IF EXISTS reset_challenge_cycle(UUID, TEXT);
CREATE OR REPLACE FUNCTION reset_challenge_cycle(couple_id_input UUID, frequency_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Set shown_at to a date far in the past to clear cooloff
    -- Set status to 'reset' to distinguish from normal shown/expired
    UPDATE challenge_history
    SET shown_at = NOW() - INTERVAL '1 year',
        status = 'expired'  -- Keep as expired so it can be re-shown
    WHERE couple_id = couple_id_input
    AND challenge_type = frequency_input
    AND status IN ('shown', 'expired');

    RETURN jsonb_build_object('success', true, 'message', 'Challenge cycle reset for ' || frequency_input);
END;
$$;


-- 5. POINTS & REWARDS

-- Full version with token generation (10 pts = 1 token)
DROP FUNCTION IF EXISTS add_love_action_points(UUID, INTEGER);
CREATE OR REPLACE FUNCTION add_love_action_points(p_couple_id UUID, p_points INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_points INTEGER;
    v_tokens INTEGER;
    v_new_tokens INTEGER := 0;
    v_total_points INTEGER;
    v_total_lifetime_points INTEGER;
BEGIN
    SELECT action_points, rain_check_tokens, total_love_points 
    INTO v_current_points, v_tokens, v_total_lifetime_points
    FROM couples
    WHERE id = p_couple_id;

    -- Handle nulls
    IF v_current_points IS NULL THEN v_current_points := 0; END IF;
    IF v_tokens IS NULL THEN v_tokens := 0; END IF;
    IF v_total_lifetime_points IS NULL THEN v_total_lifetime_points := 0; END IF;

    -- Calculate temporary total for token logic
    v_total_points := v_current_points + p_points;
    
    -- POSITIVE POINTS
    IF p_points > 0 THEN
        -- Add to lifetime counter
        v_total_lifetime_points := v_total_lifetime_points + p_points;

        -- Calculate new tokens (10 points = 1 token)
        IF v_total_points >= 10 THEN
            v_new_tokens := v_total_points / 10;
            v_total_points := v_total_points % 10;
        END IF;
        
        v_tokens := v_tokens + v_new_tokens;
        
    -- NEGATIVE POINTS (e.g., undoing an action)
    ELSE
        -- Reduce from lifetime counter
        v_total_lifetime_points := v_total_lifetime_points + p_points;
        IF v_total_lifetime_points < 0 THEN v_total_lifetime_points := 0; END IF;

        -- If points go below 0, use tokens to cover the debt
        WHILE v_total_points < 0 AND v_tokens > 0 LOOP
            v_tokens := v_tokens - 1;
            v_total_points := v_total_points + 10;
        END LOOP;
        
        -- Clamp to 0 if still negative
        IF v_total_points < 0 THEN
            v_total_points := 0;
        END IF;
    END IF;

    UPDATE couples
    SET action_points = v_total_points,
        rain_check_tokens = v_tokens,
        total_love_points = v_total_lifetime_points
    WHERE id = p_couple_id;

    RETURN jsonb_build_object(
        'new_points', v_total_points,
        'tokens_awarded', v_new_tokens,
        'total_tokens', v_tokens,
        'total_love_points', v_total_lifetime_points
    );
END;
$$;

DROP FUNCTION IF EXISTS add_competition_points(UUID, INTEGER);
CREATE OR REPLACE FUNCTION add_competition_points(p_user_id UUID, p_points INTEGER)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE profiles
    SET competition_points = competition_points + p_points,
        unclaimed_vouchers = unclaimed_vouchers + floor((competition_points + p_points) / 100) - floor(competition_points / 100)
    WHERE id = p_user_id;
END;
$$;

DROP FUNCTION IF EXISTS check_and_award_competition_points();
CREATE OR REPLACE FUNCTION check_and_award_competition_points()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    partner_mem RECORD;
    my_selection TEXT;
    partner_selection TEXT;
    winner_id UUID;
    points_to_award INTEGER;
BEGIN
    -- Only care about challenges
    IF NEW.type <> 'challenge' THEN RETURN NEW; END IF;
    
    -- Check if competition
    IF (NEW.metadata->>'is_competition')::BOOLEAN IS NOT TRUE THEN RETURN NEW; END IF;
    
    -- Check if already awarded
    IF (NEW.metadata->>'points_awarded')::BOOLEAN IS TRUE THEN RETURN NEW; END IF;
    
    -- Check if winner_selection is present
    IF NEW.metadata->>'winner_selection' IS NULL THEN RETURN NEW; END IF;

    -- Find partner memory for same challenge
    SELECT * INTO partner_mem
    FROM memories
    WHERE couple_id = NEW.couple_id
      AND title = NEW.title
      AND type = 'challenge'
      AND uploader_id != NEW.uploader_id
    LIMIT 1;

    IF NOT FOUND THEN RETURN NEW; END IF;

    -- Check if partner already handled it
    IF (partner_mem.metadata->>'points_awarded')::BOOLEAN IS TRUE THEN
        RETURN NEW;
    END IF;

    partner_selection := partner_mem.metadata->>'winner_selection';
    my_selection := NEW.metadata->>'winner_selection';

    IF partner_selection IS NULL THEN
        RETURN NEW; -- Partner hasn't selected yet
    END IF;

    winner_id := NULL;
    points_to_award := 0;

    -- Determine Outcome
    -- My 'me' means I think I won. Partner's 'partner' means they think I won.
    IF my_selection = 'me' AND partner_selection = 'partner' THEN
        winner_id := NEW.uploader_id;
        points_to_award := 3;
    ELSIF my_selection = 'partner' AND partner_selection = 'me' THEN
        winner_id := partner_mem.uploader_id;
        points_to_award := 3;
    ELSIF my_selection = 'tie' AND partner_selection = 'tie' THEN
        points_to_award := 1; -- For BOTH
        winner_id := NULL; -- Tie flag
    ELSE
        RETURN NEW; -- Disagreement, no points
    END IF;

    -- Award Points
    IF winner_id IS NOT NULL THEN
        UPDATE profiles SET competition_points = COALESCE(competition_points, 0) + points_to_award 
        WHERE id = winner_id;
    ELSE
        -- TIE: Update both
        UPDATE profiles SET competition_points = COALESCE(competition_points, 0) + points_to_award 
        WHERE id IN (NEW.uploader_id, partner_mem.uploader_id);
    END IF;

    -- Mark Partner Memory as awarded
    UPDATE memories 
    SET metadata = jsonb_set(metadata, '{points_awarded}', 'true'::jsonb)
    WHERE id = partner_mem.id;

    -- Mark My Memory (NEW)
    NEW.metadata := jsonb_set(NEW.metadata, '{points_awarded}', 'true'::jsonb);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_memory_competition_completion ON memories;
CREATE TRIGGER on_memory_competition_completion
    BEFORE INSERT OR UPDATE ON memories
    FOR EACH ROW
    EXECUTE FUNCTION check_and_award_competition_points();


-- 6. MISSING FUNCTIONS

-- check_streak_broken: Checks if streak is broken on load
DROP FUNCTION IF EXISTS check_streak_broken(UUID);
CREATE OR REPLACE FUNCTION check_streak_broken(p_couple_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_last_activity_date DATE;
    v_current_streak INTEGER;
    v_yesterday DATE := CURRENT_DATE - 1;
    v_is_broken BOOLEAN := FALSE;
    v_previous_streak INTEGER;
BEGIN
    SELECT last_activity_date::DATE, current_streak, previous_streak
    INTO v_last_activity_date, v_current_streak, v_previous_streak
    FROM couples WHERE id = p_couple_id;

    IF v_current_streak IS NULL THEN v_current_streak := 0; END IF;

    -- Broken if last activity before yesterday AND streak > 0
    IF (v_last_activity_date IS NULL OR v_last_activity_date < v_yesterday) 
       AND v_current_streak > 0 THEN
        UPDATE couples
        SET previous_streak = v_current_streak, current_streak = 0
        WHERE id = p_couple_id;
        
        v_is_broken := TRUE;
        v_previous_streak := v_current_streak;
    END IF;

    RETURN jsonb_build_object(
        'is_broken', v_is_broken,
        'previous_streak', v_previous_streak
    );
END;
$$;

-- restore_streak: Uses token to restore broken streak
DROP FUNCTION IF EXISTS restore_streak(UUID);
CREATE OR REPLACE FUNCTION restore_streak(p_couple_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_tokens INTEGER;
    v_prev_streak INTEGER;
BEGIN
    SELECT rain_check_tokens, previous_streak 
    INTO v_tokens, v_prev_streak
    FROM couples WHERE id = p_couple_id;

    IF v_tokens > 0 AND v_prev_streak > 0 THEN
        UPDATE couples
        SET rain_check_tokens = v_tokens - 1,
            current_streak = v_prev_streak,
            last_activity_date = CURRENT_DATE - 1
        WHERE id = p_couple_id;
        RETURN TRUE;
    END IF;
    RETURN FALSE;
END;
$$;

-- use_rain_check_token: Deduct 1 token
DROP FUNCTION IF EXISTS use_rain_check_token(UUID);
CREATE OR REPLACE FUNCTION use_rain_check_token(p_couple_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_tokens INTEGER;
BEGIN
    SELECT rain_check_tokens INTO v_tokens FROM couples WHERE id = p_couple_id;
    IF v_tokens IS NULL THEN v_tokens := 0; END IF;

    IF v_tokens > 0 THEN
        UPDATE couples SET rain_check_tokens = v_tokens - 1 WHERE id = p_couple_id;
        RETURN TRUE;
    END IF;
    RETURN FALSE;
END;
$$;

-- refund_rain_check_token: Add 1 token back
DROP FUNCTION IF EXISTS refund_rain_check_token(UUID);
CREATE OR REPLACE FUNCTION refund_rain_check_token(p_couple_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE couples SET rain_check_tokens = rain_check_tokens + 1 
    WHERE id = p_couple_id;
    RETURN TRUE;
END;
$$;

-- unskip_challenge: Delete skipped memory + refund token
DROP FUNCTION IF EXISTS unskip_challenge(UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION unskip_challenge(
    p_couple_id UUID, 
    p_title TEXT, 
    p_type TEXT, 
    p_start_date TIMESTAMPTZ, 
    p_end_date TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_deleted_count INTEGER;
BEGIN
    -- Touch record first for Realtime event
    UPDATE memories SET created_at = created_at
    WHERE couple_id = p_couple_id
      AND type = 'challenge'
      AND title = p_title
      AND (metadata->>'skipped')::boolean = true
      AND (metadata->>'challenge_type') = p_type
      AND created_at BETWEEN p_start_date AND p_end_date;

    -- Delete skipped memory
    WITH deleted AS (
        DELETE FROM memories
        WHERE couple_id = p_couple_id
          AND type = 'challenge'
          AND title = p_title
          AND (metadata->>'skipped')::boolean = true
          AND (metadata->>'challenge_type') = p_type
          AND created_at BETWEEN p_start_date AND p_end_date
        RETURNING *
    )
    SELECT COUNT(*) INTO v_deleted_count FROM deleted;

    -- Refund token if deleted
    IF v_deleted_count > 0 THEN
        UPDATE couples SET rain_check_tokens = rain_check_tokens + 1
        WHERE id = p_couple_id;
        RETURN TRUE;
    END IF;
    RETURN FALSE;
END;
$$;

-- restore_couple: Simple restore without deleting current
DROP FUNCTION IF EXISTS restore_couple(UUID);
CREATE OR REPLACE FUNCTION restore_couple(target_couple_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    current_user_id uuid;
    couple_record record;
BEGIN
    current_user_id := auth.uid();

    SELECT * INTO couple_record FROM couples
    WHERE id = target_couple_id
      AND (user_one_id = current_user_id OR user_two_id = current_user_id)
      AND status = 'archived';

    IF couple_record IS NULL THEN
        RAISE EXCEPTION 'Archived couple not found or permission denied';
    END IF;

    UPDATE couples SET status = 'active', archived_at = NULL
    WHERE id = target_couple_id;

    UPDATE profiles SET couple_id = target_couple_id
    WHERE id IN (couple_record.user_one_id, couple_record.user_two_id);
END;
$$;

-- upgrade_to_premium: Mock RPC for premium upgrade
DROP FUNCTION IF EXISTS upgrade_to_premium();
CREATE OR REPLACE FUNCTION upgrade_to_premium()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE profiles SET is_premium = TRUE WHERE id = auth.uid();
END;
$$;

-- handle_competition_points_update: Trigger to auto-award vouchers
DROP FUNCTION IF EXISTS handle_competition_points_update();
CREATE OR REPLACE FUNCTION handle_competition_points_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Award voucher for every 10 points crossed
    IF FLOOR(NEW.competition_points / 10) > FLOOR(COALESCE(OLD.competition_points, 0) / 10) THEN
        NEW.unclaimed_vouchers := COALESCE(NEW.unclaimed_vouchers, 0) + 
            (FLOOR(NEW.competition_points / 10) - FLOOR(COALESCE(OLD.competition_points, 0) / 10));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_competition_points_change ON profiles;
CREATE TRIGGER on_competition_points_change
    BEFORE UPDATE OF competition_points ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_competition_points_update();
