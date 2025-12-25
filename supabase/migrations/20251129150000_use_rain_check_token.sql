-- Function to use a rain check token
CREATE OR REPLACE FUNCTION use_rain_check_token(p_couple_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tokens INTEGER;
BEGIN
    SELECT rain_check_tokens INTO v_tokens
    FROM couples
    WHERE id = p_couple_id;

    IF v_tokens IS NULL THEN v_tokens := 0; END IF;

    IF v_tokens > 0 THEN
        UPDATE couples
        SET rain_check_tokens = v_tokens - 1
        WHERE id = p_couple_id;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;
