-- Add previous_streak column
ALTER TABLE couples ADD COLUMN IF NOT EXISTS previous_streak INTEGER DEFAULT 0;

-- Function to handle point awarding and token generation
-- Add total_love_points column
ALTER TABLE couples ADD COLUMN IF NOT EXISTS total_love_points INTEGER DEFAULT 0;

-- Backfill total_love_points based on current state (best effort)
-- We assume each token cost 10 points.
UPDATE couples 
SET total_love_points = COALESCE(action_points, 0) + (COALESCE(rain_check_tokens, 0) * 10);

-- Function to handle point awarding and token generation
CREATE OR REPLACE FUNCTION add_love_action_points(p_couple_id UUID, p_points INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_points INTEGER;
    v_tokens INTEGER;
    v_new_tokens INTEGER := 0;
    v_total_points INTEGER; -- Used for calculations of current partial points
    v_total_lifetime_points INTEGER;
BEGIN
    SELECT action_points, rain_check_tokens, total_love_points INTO v_current_points, v_tokens, v_total_lifetime_points
    FROM couples
    WHERE id = p_couple_id;

    -- Handle nulls
    IF v_current_points IS NULL THEN v_current_points := 0; END IF;
    IF v_tokens IS NULL THEN v_tokens := 0; END IF;
    IF v_total_lifetime_points IS NULL THEN v_total_lifetime_points := 0; END IF;

    -- Calculate temporary total for token logic (progress to next token)
    v_total_points := v_current_points + p_points;
    
    -- Case 1: Positive points (Adding points)
    IF p_points > 0 THEN
        -- Add to lifetime counter
        v_total_lifetime_points := v_total_lifetime_points + p_points;

        -- Calculate new tokens (10 points = 1 token)
        IF v_total_points >= 10 THEN
            v_new_tokens := v_total_points / 10;
            v_total_points := v_total_points % 10;
        END IF;
        
        v_tokens := v_tokens + v_new_tokens;
        
    -- Case 2: Negative points (Removing points) - e.g. undoing an action
    ELSE
        -- Reduce from lifetime counter (if we allow reducing lifetime score)
        v_total_lifetime_points := v_total_lifetime_points + p_points;
        IF v_total_lifetime_points < 0 THEN v_total_lifetime_points := 0; END IF;

        -- If points go below 0, try to use tokens to cover the debt
        WHILE v_total_points < 0 AND v_tokens > 0 LOOP
            v_tokens := v_tokens - 1;
            v_total_points := v_total_points + 10;
        END LOOP;
        
        -- If still below 0 (no tokens left), clamp to 0
        IF v_total_points < 0 THEN
            v_total_points := 0;
        END IF;
    END IF;

    UPDATE couples
    SET action_points = v_total_points, -- This is the 'progress to next token'
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

-- Function to check and update streak
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
    -- We check for answers created today for 'quiz' or 'draw' activities
    SELECT COUNT(DISTINCT user_id) INTO v_q_count
    FROM user_answers ua
    JOIN activities a ON ua.activity_id = a.id
    WHERE ua.couple_id = p_couple_id
    AND ua.created_at::DATE = v_today
    AND a.type IN ('quiz', 'draw');

    -- 2. Check if any challenge is completed today
    -- Check memories table for type 'challenge' created today
    SELECT COUNT(*) INTO v_c_count
    FROM memories
    WHERE couple_id = p_couple_id
    AND type = 'challenge'
    AND created_at::DATE = v_today;

    -- Requirements: Both answered (count=2) AND at least one challenge (count>=1)
    IF v_q_count >= 2 AND v_c_count >= 1 THEN
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

-- Function to restore streak
CREATE OR REPLACE FUNCTION restore_streak(p_couple_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tokens INTEGER;
    v_prev_streak INTEGER;
BEGIN
    SELECT rain_check_tokens, previous_streak INTO v_tokens, v_prev_streak
    FROM couples
    WHERE id = p_couple_id;

    IF v_tokens > 0 AND v_prev_streak > 0 THEN
        UPDATE couples
        SET rain_check_tokens = v_tokens - 1,
            current_streak = v_prev_streak,
            last_activity_date = CURRENT_DATE - 1 -- Set to yesterday so today's action can increment it
        WHERE id = p_couple_id;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- Function to check for broken streak (to be called on load)
CREATE OR REPLACE FUNCTION check_streak_broken(p_couple_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_last_activity_date DATE;
    v_current_streak INTEGER;
    v_yesterday DATE := CURRENT_DATE - 1;
    v_is_broken BOOLEAN := FALSE;
    v_previous_streak INTEGER;
BEGIN
    SELECT last_activity_date::DATE, current_streak, previous_streak INTO v_last_activity_date, v_current_streak, v_previous_streak
    FROM couples
    WHERE id = p_couple_id;

    IF v_current_streak IS NULL THEN v_current_streak := 0; END IF;

    -- If last activity was before yesterday, and streak > 0, it's broken.
    IF (v_last_activity_date IS NULL OR v_last_activity_date < v_yesterday) AND v_current_streak > 0 THEN
        -- Break the streak
        UPDATE couples
        SET previous_streak = v_current_streak,
            current_streak = 0
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
