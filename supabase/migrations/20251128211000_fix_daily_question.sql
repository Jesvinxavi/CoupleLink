-- Add spicy_mode column to couples table
ALTER TABLE couples 
ADD COLUMN IF NOT EXISTS spicy_mode BOOLEAN DEFAULT FALSE;

-- Fix get_daily_question to be deterministic based on date and couple_id
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

    -- Count available questions, excluding spicy if mode is off
    SELECT COUNT(*) INTO v_count 
    FROM activities 
    WHERE type = 'quiz'
    AND (v_spicy_mode = TRUE OR (content->>'isSpicy')::BOOLEAN IS NOT TRUE);
    
    IF v_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'No questions found');
    END IF;

    -- Generate a deterministic offset based on date and couple_id.
    -- This ensures the same question is returned for the same couple on the same day.
    -- ABS(hashtext(couple_id) + date_integer) % count
    v_seed := ABS(hashtext(couple_id_input::TEXT) + (EXTRACT(YEAR FROM CURRENT_DATE) * 1000 + EXTRACT(DOY FROM CURRENT_DATE))::INTEGER);
    v_offset := v_seed % v_count;
    
    -- Select the question
    -- We select specific columns to return as JSON
    SELECT jsonb_build_object(
        'id', id,
        'category', category,
        'type', type,
        'content', content
    )
    INTO v_activity_data
    FROM activities
    WHERE type = 'quiz'
    AND (v_spicy_mode = TRUE OR (content->>'isSpicy')::BOOLEAN IS NOT TRUE)
    ORDER BY id -- Crucial for deterministic offset
    LIMIT 1 OFFSET v_offset;

    RETURN jsonb_build_object(
        'success', true,
        'data', v_activity_data
    );
END;
$$;

-- Ensure RLS policies for user_answers are correct
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (if any)
DROP POLICY IF EXISTS "Users can view their couple's answers" ON user_answers;
DROP POLICY IF EXISTS "Users can insert their own answers" ON user_answers;
DROP POLICY IF EXISTS "Users can update their own answers" ON user_answers;

-- Create policies
CREATE POLICY "Users can view their couple's answers"
ON user_answers FOR SELECT
USING (
    auth.uid() IN (
        SELECT user_one_id FROM couples WHERE id = couple_id
        UNION
        SELECT user_two_id FROM couples WHERE id = couple_id
    )
);

CREATE POLICY "Users can insert their own answers"
ON user_answers FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND
    (
        auth.uid() IN (
            SELECT user_one_id FROM couples WHERE id = couple_id
            UNION
            SELECT user_two_id FROM couples WHERE id = couple_id
        )
    )
);

CREATE POLICY "Users can update their own answers"
ON user_answers FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
