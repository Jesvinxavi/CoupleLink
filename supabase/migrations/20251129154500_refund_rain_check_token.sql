CREATE OR REPLACE FUNCTION refund_rain_check_token(p_couple_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE couples
    SET rain_check_tokens = rain_check_tokens + 1
    WHERE id = p_couple_id;
    RETURN TRUE;
END;
$$;
