-- Strict Streak Logic: Both partners must complete a challenge to continue the streak.
-- The streak counts on the day the SECOND partner completes the challenge.

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

    -- 2. Check if a challenge was "completed" today (meaning both partners have done it)
    -- We look for any challenge memory created TODAY where the PARTNER also has a memory for the same challenge title.
    -- This handles the case where Partner A did it days ago, and Partner B does it today -> counts for today.
    SELECT COUNT(*) INTO v_c_count
    FROM memories m
    WHERE m.couple_id = p_couple_id
    AND m.type = 'challenge'
    AND m.created_at::DATE = v_today
    AND EXISTS (
        SELECT 1 FROM memories partner_m
        WHERE partner_m.couple_id = m.couple_id
        AND partner_m.type = 'challenge'
        AND partner_m.title = m.title
        AND partner_m.uploader_id != m.uploader_id
    );

    -- Requirements: Both answered daily question (count=2) OR Both completed a challenge (v_c_count >= 1)
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
