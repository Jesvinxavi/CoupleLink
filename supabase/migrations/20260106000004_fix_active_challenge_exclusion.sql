-- Fix get_active_challenge to NOT exclude history from the CURRENT period
-- This ensures that if a user skips or completes a challenge today, it remains the "active" challenge
-- returned by the API, allowing the frontend to display the correct "Skipped" or "Completed" state
-- instead of immediately rotating to a new, mismatched challenge.

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
    v_reset_time TIMESTAMP;
    v_current_period_start TIMESTAMP;
    v_seen_before BOOLEAN := FALSE;
    v_challenge_id UUID;
BEGIN
    -- Get Spicy Mode and Reset Time settings
    SELECT spicy_mode, 
           COALESCE((challenge_resets->>frequency_input)::TIMESTAMP, '1970-01-01'::TIMESTAMP)
    INTO v_spicy_mode, v_reset_time 
    FROM couples WHERE id = couple_id_input;
    IF v_spicy_mode IS NULL THEN v_spicy_mode := FALSE; END IF;
    IF v_reset_time IS NULL THEN v_reset_time := '1970-01-01'::TIMESTAMP; END IF;

    -- Calculate date factor and current period start
    IF frequency_input = 'daily' THEN
        v_date_factor := (EXTRACT(YEAR FROM CURRENT_DATE) * 1000 + EXTRACT(DOY FROM CURRENT_DATE))::INTEGER;
        v_current_period_start := CURRENT_DATE::TIMESTAMP;
    ELSIF frequency_input = 'weekly' THEN
        v_date_factor := (EXTRACT(ISOYEAR FROM CURRENT_DATE) * 100 + EXTRACT(WEEK FROM CURRENT_DATE))::INTEGER;
        v_current_period_start := date_trunc('week', CURRENT_DATE);
    ELSIF frequency_input = 'monthly' THEN
        v_date_factor := (EXTRACT(YEAR FROM CURRENT_DATE) * 100 + EXTRACT(MONTH FROM CURRENT_DATE))::INTEGER;
        v_current_period_start := date_trunc('month', CURRENT_DATE);
    ELSE
        -- Fallback
        v_date_factor := (EXTRACT(YEAR FROM CURRENT_DATE) * 1000 + EXTRACT(DOY FROM CURRENT_DATE))::INTEGER;
        v_current_period_start := CURRENT_DATE::TIMESTAMP;
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
                v_spicy_prob := 0.12;
            ELSIF frequency_input = 'weekly' THEN
                v_spicy_prob := 0.15;
            ELSIF frequency_input = 'monthly' THEN
                v_spicy_prob := 0.0;
            END IF;

            IF v_roll < v_spicy_prob THEN
                v_is_spicy := TRUE;
            ELSE
                IF v_spicy_prob > 0 THEN
                    v_roll := (v_roll - v_spicy_prob) / (1.0 - v_spicy_prob);
                END IF;
            END IF;
        END;
    END IF;

    -- Standard bucket logic
    IF NOT v_is_spicy THEN
        IF frequency_input = 'daily' THEN
            IF v_roll < 0.20 THEN v_is_competition := TRUE; ELSE v_is_competition := FALSE; END IF;
        ELSIF frequency_input = 'weekly' THEN
            IF v_roll < 0.20 THEN
                v_is_online_game := TRUE; v_is_competition := TRUE;
            ELSIF v_roll < 0.53 THEN
                v_is_competition := TRUE;
            ELSE
                v_is_competition := FALSE;
            END IF;
        ELSIF frequency_input = 'monthly' THEN
            IF v_roll < 0.33 THEN v_is_competition := TRUE; ELSE v_is_competition := FALSE; END IF;
        END IF;
    END IF;

    -- MAIN QUERY: Count matching challenges
    SELECT COUNT(*) INTO v_count 
    FROM activities 
    WHERE type = 'challenge' 
    AND content->>'frequency' = frequency_input
    AND id NOT IN (
        SELECT activity_id FROM challenge_history 
        WHERE couple_id = couple_id_input 
        AND challenge_type = frequency_input 
        AND activity_id IS NOT NULL
        AND shown_at > v_reset_time
        -- CRITICAL CHANGE: Only exclude challenges from PAST periods.
        -- If shown_at is >= start of current period, we KEEP it in the pool
        -- so it remains the active challenge even if completed/shown/skipped.
        AND shown_at < v_current_period_start
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
    -- Bucket Filters
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
    
    -- Fallback 1: Try without bucket filters (but still strict history exclusion)
    IF v_count = 0 THEN
        SELECT COUNT(*) INTO v_count 
        FROM activities 
        WHERE type = 'challenge' 
        AND content->>'frequency' = frequency_input
        AND id NOT IN (
            SELECT activity_id FROM challenge_history 
            WHERE couple_id = couple_id_input 
            AND challenge_type = frequency_input 
            AND activity_id IS NOT NULL
            AND shown_at > v_reset_time
            AND shown_at < v_current_period_start -- CRITICAL CHANGE
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
        AND (v_spicy_mode = TRUE OR (content->>'isSpicy')::BOOLEAN IS NOT TRUE);
        
        IF v_count > 0 THEN
            v_is_spicy := FALSE; 
            v_is_competition := NULL; 
            v_is_online_game := FALSE;
        END IF;
    END IF;

    -- All Explored check
    IF v_count = 0 THEN
        RETURN jsonb_build_object(
            'success', true, 
            'data', NULL,
            'seenBefore', false,
            'allExhausted', true
        );
    END IF;

    -- Deterministic selection
    v_offset := v_seed % v_count;
    
    SELECT jsonb_build_object(
        'id', id,
        'category', category,
        'type', content->>'frequency',
        'content', content
    )
    INTO v_activity_data
    FROM activities
    WHERE type = 'challenge'
    AND content->>'frequency' = frequency_input
    AND id NOT IN (
        SELECT activity_id FROM challenge_history 
        WHERE couple_id = couple_id_input 
        AND challenge_type = frequency_input 
        AND activity_id IS NOT NULL
        AND shown_at > v_reset_time
        AND shown_at < v_current_period_start -- CRITICAL CHANGE
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

    -- Check if this challenge was seen before (by this couple, ever)
    IF v_activity_data IS NOT NULL THEN
        v_challenge_id := (v_activity_data->>'id')::UUID;
        SELECT EXISTS (
            SELECT 1 FROM challenge_history 
            WHERE couple_id = couple_id_input 
            AND activity_id = v_challenge_id
        ) INTO v_seen_before;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'data', v_activity_data,
        'seenBefore', v_seen_before,
        'allExhausted', false
    );
END;
$$;
