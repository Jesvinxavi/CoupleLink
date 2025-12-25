CREATE OR REPLACE FUNCTION unskip_challenge(p_couple_id UUID, p_title TEXT, p_type TEXT, p_start_date TIMESTAMP WITH TIME ZONE, p_end_date TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- WORKAROUND: Update the record first to trigger a Realtime UPDATE event
    -- This ensures the partner client receives an event with the couple_id (since DELETE events might lack it without REPLICA IDENTITY FULL)
    UPDATE memories
    SET created_at = created_at -- No-op update just to touch the record
    WHERE couple_id = p_couple_id
    AND type = 'challenge'
    AND title = p_title
    AND (metadata->>'skipped')::boolean = true
    AND (metadata->>'challenge_type') = p_type
    AND created_at >= p_start_date
    AND created_at <= p_end_date;

    -- Delete the skipped memory for this couple, title, and type within the date range
    -- We check for metadata->>'skipped' = 'true' to ensure we only delete skipped records
    WITH deleted AS (
        DELETE FROM memories
        WHERE couple_id = p_couple_id
        AND type = 'challenge'
        AND title = p_title
        AND (metadata->>'skipped')::boolean = true
        AND (metadata->>'challenge_type') = p_type
        AND created_at >= p_start_date
        AND created_at <= p_end_date
        RETURNING *
    )
    SELECT COUNT(*) INTO v_deleted_count FROM deleted;

    -- If we deleted something, refund the token
    IF v_deleted_count > 0 THEN
        UPDATE couples
        SET rain_check_tokens = rain_check_tokens + 1
        WHERE id = p_couple_id;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;
