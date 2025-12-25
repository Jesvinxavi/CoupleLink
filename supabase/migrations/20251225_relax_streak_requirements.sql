-- Relax streak requirements: OR instead of AND
-- Streak continues if: Both partners answer daily question OR at least one challenge is completed

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

    -- Requirements: Both answered (count=2) OR at least one challenge (count>=1)
    -- This is the CHANGE: AND -> OR
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
