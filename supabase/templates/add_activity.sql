-- Template: Add New Activities Safely
-- Use this pattern to add new questions/challenges without deleting existing ones.

-- 1. Insert Daily Questions (example)
-- We use a CTE or explicit IF NOT EXISTS check to avoid duplicates if possible,
-- OR just rely on unique content. Since we lack a unique constraint on JSON content,
-- we perform a "soft check" based on the activity title/question text in the JSON key.

DO $$
DECLARE
    v_new_activity_id UUID;
BEGIN
    -- EXAMPLE 1: Adding a new Quiz Question
    -- Check if it exists by looking for the specific question text inside the JSONB
    IF NOT EXISTS (
        SELECT 1 FROM public.activities
        WHERE category = 'fun'
        AND type = 'quiz'
        AND content->>'question' = 'What is your favorite color?'
    ) THEN
        INSERT INTO public.activities (category, type, content)
        VALUES ('fun', 'quiz', '{"question": "What is your favorite color?", "options": ["Red", "Blue", "Green"]}')
        RETURNING id INTO v_new_activity_id;

        RAISE NOTICE 'Inserted new quiz question: %', v_new_activity_id;
    ELSE
        RAISE NOTICE 'Skipping duplicate quiz: What is your favorite color?';
    END IF;

    -- EXAMPLE 2: Adding a new Challenge
    IF NOT EXISTS (
        SELECT 1 FROM public.activities
        WHERE category = 'romantic'
        AND type = 'challenge'
        AND content->>'title' = 'Midnight Walk'
    ) THEN
        INSERT INTO public.activities (category, type, content)
        VALUES ('romantic', 'challenge', '{"frequency": "weekly", "title": "Midnight Walk", "description": "Take a walk at midnight.", "durationMinutes": 30, "isCompetition": false}');
        
        RAISE NOTICE 'Inserted new challenge: Midnight Walk';
    END IF;

END $$;
