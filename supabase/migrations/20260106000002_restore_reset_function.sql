-- Restore reset_challenge_cycle function
-- This function was reported missing by the frontend
DROP FUNCTION IF EXISTS reset_challenge_cycle(UUID, TEXT);
CREATE OR REPLACE FUNCTION reset_challenge_cycle(couple_id_input UUID, frequency_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Store reset timestamp in couples.challenge_resets
    -- This marks the point after which new challenge instances are tracked
    -- All existing history is preserved for stats
    UPDATE couples
    SET challenge_resets = COALESCE(challenge_resets, '{}'::jsonb) || 
        jsonb_build_object(frequency_input, NOW()::TEXT)
    WHERE id = couple_id_input;

    RETURN jsonb_build_object('success', true, 'message', 'Challenge cycle reset for ' || frequency_input);
END;
$$;
