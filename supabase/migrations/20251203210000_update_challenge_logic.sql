-- Update get_active_challenge to support probability-based selection including spicy mode
CREATE OR REPLACE FUNCTION get_active_challenge(
    couple_id_input UUID,
    frequency_input TEXT
)
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

    -- Calculate date factor
    IF frequency_input = 'daily' THEN
        v_date_factor := (EXTRACT(YEAR FROM CURRENT_DATE) * 1000 + EXTRACT(DOY FROM CURRENT_DATE))::INTEGER;
    ELSIF frequency_input = 'weekly' THEN
        v_date_factor := (EXTRACT(ISOYEAR FROM CURRENT_DATE) * 100 + EXTRACT(WEEK FROM CURRENT_DATE))::INTEGER;
    ELSIF frequency_input = 'monthly' THEN
        v_date_factor := (EXTRACT(YEAR FROM CURRENT_DATE) * 100 + EXTRACT(MONTH FROM CURRENT_DATE))::INTEGER;
    ELSE
        v_date_factor := (EXTRACT(YEAR FROM CURRENT_DATE) * 1000 + EXTRACT(DOY FROM CURRENT_DATE))::INTEGER;
    END IF;

    v_seed := ABS(hashtext(couple_id_input::TEXT || frequency_input || v_date_factor::TEXT));
    v_roll := (v_seed % 1000) / 1000.0;

    -- Bucket Logic
    v_is_competition := NULL;
    v_is_online_game := FALSE;
    v_is_spicy := FALSE;

    IF v_spicy_mode THEN
        -- Spicy Mode ON: Different probabilities based on frequency
        DECLARE
            v_spicy_prob DOUBLE PRECISION := 0.0;
        BEGIN
            IF frequency_input = 'daily' THEN
                v_spicy_prob := 0.12;
            ELSIF frequency_input = 'weekly' THEN
                v_spicy_prob := 0.15;
            ELSIF frequency_input = 'monthly' THEN
                v_spicy_prob := 0.0; -- No spicy monthly challenges
            END IF;

            IF v_roll < v_spicy_prob THEN
                v_is_spicy := TRUE;
            ELSE
                -- Rescale roll for remaining percentage into 0-1 range for standard buckets
                IF v_spicy_prob > 0 THEN
                    v_roll := (v_roll - v_spicy_prob) / (1.0 - v_spicy_prob);
                END IF;
            END IF;
        END;
    END IF;

    -- If NOT spicy selected (or spicy off), use standard buckets
    IF NOT v_is_spicy THEN
        IF frequency_input = 'daily' THEN
            -- Daily: 20% Competitive
            IF v_roll < 0.20 THEN v_is_competition := TRUE; ELSE v_is_competition := FALSE; END IF;
        ELSIF frequency_input = 'weekly' THEN
            -- Weekly: 20% Online, 33% Comp
            IF v_roll < 0.20 THEN
                v_is_online_game := TRUE; v_is_competition := TRUE;
            ELSIF v_roll < 0.53 THEN
                v_is_competition := TRUE;
            ELSE
                v_is_competition := FALSE;
            END IF;
        ELSIF frequency_input = 'monthly' THEN
            -- Monthly: 33% Comp
            IF v_roll < 0.33 THEN v_is_competition := TRUE; ELSE v_is_competition := FALSE; END IF;
        END IF;
    END IF;

    -- Query
    SELECT COUNT(*) INTO v_count 
    FROM activities 
    WHERE type = 'challenge' 
    AND content->>'frequency' = frequency_input
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
    -- Other filters (only apply if NOT spicy bucket, to avoid over-constraining)
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

    -- Fallback: If no challenge found in specific bucket
    IF v_count = 0 THEN
         SELECT COUNT(*) INTO v_count 
         FROM activities 
         WHERE type = 'challenge' 
         AND content->>'frequency' = frequency_input
         -- Ensure we NEVER show spicy if mode is off
         AND (v_spicy_mode = TRUE OR (content->>'isSpicy')::BOOLEAN IS NOT TRUE);
         
         -- Reset strict filters (except spicy safety)
         v_is_spicy := FALSE; 
         v_is_competition := NULL; 
         v_is_online_game := FALSE;
    END IF;

    IF v_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'No challenges found');
    END IF;

    v_offset := v_seed % v_count;
    
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
    AND (
        (v_spicy_mode = FALSE AND (content->>'isSpicy')::BOOLEAN IS NOT TRUE)
        OR
        (v_spicy_mode = TRUE AND v_is_spicy = TRUE AND (content->>'isSpicy')::BOOLEAN = TRUE)
        OR
        (v_spicy_mode = TRUE AND v_is_spicy = FALSE AND (content->>'isSpicy')::BOOLEAN IS NOT TRUE)
        OR 
        -- Fallback case where v_is_spicy=FALSE (reset) but we allow anything valid
        (v_spicy_mode = TRUE AND v_is_competition IS NULL AND v_is_online_game = FALSE) 
    )
    AND (
        v_is_spicy = TRUE -- Skip sub-filters if spicy
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
