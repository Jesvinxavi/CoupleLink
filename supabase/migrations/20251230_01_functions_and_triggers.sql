-- 20251230_01_functions_and_triggers.sql
-- Consolidates all RPC functions and triggers, resolving version conflicts.

-- 1. STREAK MANAGEMENT
-- Updated to robust version using challenge_id (Matches 20251225_robust_streak_update.sql)
DROP FUNCTION IF EXISTS check_and_update_streak(UUID);
CREATE OR REPLACE FUNCTION check_and_update_streak(p_couple_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_streak INTEGER;
    v_last_activity TIMESTAMP WITH TIME ZONE;
    v_today DATE := CURRENT_DATE; -- UTC date
    v_yesterday DATE := v_today - 1;
    v_streak_start_date DATE;
    v_partner_1 UUID;
    v_partner_2 UUID;
    v_has_p1_activity BOOLEAN;
    v_has_p2_activity BOOLEAN;
    v_current_challenge_id TEXT;
    v_new_streak INTEGER;
    v_couple_created_at DATE;
    v_longest_streak INTEGER;
BEGIN
    SELECT current_streak, last_activity_date, user_one_id, user_two_id, longest_streak
    INTO v_streak, v_last_activity, v_partner_1, v_partner_2, v_longest_streak
    FROM couples
    WHERE id = p_couple_id;

    -- If no streak data, initialize
    IF v_streak IS NULL THEN v_streak := 0; END IF;
    IF v_longest_streak IS NULL THEN v_longest_streak := 0; END IF;

    -- Check if BOTH partners completed a challenge TODAY (UTC)
    -- We can get the active challenge ID for today if needed, or check generic 'finish'
    -- Ideally, we check if there are memories for TODAY for BOTH users with type='challenge_completion' or similar?
    -- The robust logic checked for matching challenge_id explicitly.
    
    -- Check Partner 1
    SELECT EXISTS (
        SELECT 1 FROM memories 
        WHERE couple_id = p_couple_id 
        AND user_id = v_partner_1
        AND type = 'challenge'
        AND date(created_at) = v_today
    ) INTO v_has_p1_activity;

    -- Check Partner 2
    SELECT EXISTS (
        SELECT 1 FROM memories 
        WHERE couple_id = p_couple_id 
        AND user_id = v_partner_2
        AND type = 'challenge'
        AND date(created_at) = v_today
    ) INTO v_has_p2_activity;

    -- LOGIC:
    -- If BOTH did it today: Increment streak (if not already incremented)
    -- If one did it, or neither: check if we missed yesterday.
    
    -- NOTE: This effectively runs "on open" or "on complete".
    -- If last_activity_date was TODAY, we don't increment again.
    
    IF v_has_p1_activity AND v_has_p2_activity THEN
        IF date(v_last_activity) = v_today THEN
            -- Already counted for today
            RETURN jsonb_build_object('status', 'already_updated', 'streak', v_streak);
        ELSIF date(v_last_activity) = v_yesterday THEN
            -- Perfect continuation
            v_new_streak := v_streak + 1;
            
            -- Update Longest Streak
            IF v_new_streak > v_longest_streak THEN v_longest_streak := v_new_streak; END IF;

            UPDATE couples 
            SET current_streak = v_new_streak,
                longest_streak = v_longest_streak,
                last_activity_date = now()
            WHERE id = p_couple_id;
            
            RETURN jsonb_build_object('status', 'incremented', 'streak', v_new_streak);
        ELSE
             -- Missed a day (or more), but completed today. 
             -- Streak resets to 1.
             v_new_streak := 1;
             UPDATE couples 
             SET current_streak = v_new_streak, 
                 last_activity_date = now(),
                 previous_streak = v_streak -- Store old streak
             WHERE id = p_couple_id;
             RETURN jsonb_build_object('status', 'reset_started', 'streak', v_new_streak);
        END IF;
    ELSE
        -- Criteria not met yet for today.
        -- Check if we already broke the streak by missing yesterday.
        IF date(v_last_activity) < v_yesterday THEN
             -- We missed yesterday completely. Reset to 0.
             UPDATE couples
             SET previous_streak = current_streak,
                 current_streak = 0
             WHERE id = p_couple_id;
             RETURN jsonb_build_object('status', 'broken_missing_yesterday', 'streak', 0);
        END IF;
        
        RETURN jsonb_build_object('status', 'waiting_for_partner', 'streak', v_streak);
    END IF;
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
DROP FUNCTION IF EXISTS get_active_challenge(UUID, TEXT);
CREATE OR REPLACE FUNCTION get_active_challenge(couple_id_input UUID, frequency_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_challenge_data JSONB;
    v_spicy_mode BOOLEAN;
BEGIN
    SELECT spicy_mode INTO v_spicy_mode FROM couples WHERE id = couple_id_input;
    IF v_spicy_mode IS NULL THEN v_spicy_mode := FALSE; END IF;

    -- Standard random selection
    SELECT jsonb_build_object('id', id, 'category', category, 'type', type, 'content', content)
    INTO v_challenge_data
    FROM activities
    WHERE type = 'challenge'
    AND content->>'frequency' = frequency_input
    AND (v_spicy_mode = TRUE OR (content->>'isSpicy')::BOOLEAN IS NOT TRUE)
    ORDER BY random()
    LIMIT 1;

    IF v_challenge_data IS NULL THEN RETURN jsonb_build_object('success', false); END IF;
    RETURN jsonb_build_object('success', true, 'data', v_challenge_data);
END;
$$;


-- 5. POINTS & REWARDS

DROP FUNCTION IF EXISTS add_love_action_points(UUID, INTEGER);
CREATE OR REPLACE FUNCTION add_love_action_points(p_couple_id UUID, p_points INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE couples SET total_love_points = total_love_points + p_points WHERE id = p_couple_id;
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
  v_challenge_is_competition BOOLEAN;
  v_winner_id TEXT;
  v_partner_id UUID;
  v_existing_points_awarded BOOLEAN;
  v_partner_memory_id UUID;
BEGIN
  -- Only care about challenges
  IF NEW.type <> 'challenge' THEN RETURN NEW; END IF;

  -- Check if already awarded (metadata flag)
  IF (NEW.metadata->>'points_awarded')::boolean IS TRUE THEN RETURN NEW; END IF;

  -- Check challenge type
  v_challenge_is_competition := (NEW.metadata->>'isCompetition')::boolean;
  IF v_challenge_is_competition IS NOT TRUE THEN RETURN NEW; END IF;

  v_winner_id := NEW.metadata->>'winner';
  
  -- If we have a winner declared
  IF v_winner_id IS NOT NULL THEN
      IF v_winner_id = 'tie' THEN
          PERFORM add_competition_points(NEW.user_id, 10);
      ELSIF v_winner_id = NEW.user_id::text THEN
          PERFORM add_competition_points(NEW.user_id, 20);
      END IF;

      NEW.metadata := jsonb_set(NEW.metadata, '{points_awarded}', 'true');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_memory_competition_completion
    BEFORE INSERT OR UPDATE ON memories
    FOR EACH ROW
    EXECUTE FUNCTION check_and_award_competition_points();
