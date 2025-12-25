-- Trigger function to check agreement and award points
CREATE OR REPLACE FUNCTION check_and_award_competition_points()
RETURNS TRIGGER AS $$
DECLARE
    partner_mem RECORD;
    my_selection TEXT;
    partner_selection TEXT;
    winner_id UUID;
    points_to_award INTEGER;
BEGIN
    -- Exit if not checks
    IF NEW.type <> 'challenge' OR 
       (NEW.metadata->>'is_competition')::BOOLEAN IS NOT TRUE OR
       (NEW.metadata->>'points_awarded')::BOOLEAN IS TRUE OR
       NEW.metadata->>'winner_selection' IS NULL THEN
        RETURN NEW;
    END IF;

    -- Find partner memory
    SELECT * INTO partner_mem
    FROM memories
    WHERE couple_id = NEW.couple_id
      AND title = NEW.title
      AND type = 'challenge'
      AND uploader_id != NEW.uploader_id
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Check if partner already handled it
    IF (partner_mem.metadata->>'points_awarded')::BOOLEAN IS TRUE THEN
        RETURN NEW; -- Already done
    END IF;

    partner_selection := partner_mem.metadata->>'winner_selection';
    my_selection := NEW.metadata->>'winner_selection';

    IF partner_selection IS NULL THEN
        RETURN NEW; -- Partner hasn't selected yet
    END IF;

    winner_id := NULL;
    points_to_award := 0;

    -- Determine Outcome
    -- My 'me' means I think I won. Partner's 'partner' means they think I won.
    IF my_selection = 'me' AND partner_selection = 'partner' THEN
        winner_id := NEW.uploader_id;
        points_to_award := 3;
    ELSIF my_selection = 'partner' AND partner_selection = 'me' THEN
        winner_id := partner_mem.uploader_id;
        points_to_award := 3;
    ELSIF my_selection = 'tie' AND partner_selection = 'tie' THEN
        points_to_award := 1; -- For BOTH
        winner_id := NULL; -- Tie flag
    ELSE
        RETURN NEW; -- Disagreement
    END IF;

    -- Award Points
    IF winner_id IS NOT NULL THEN
        UPDATE profiles SET competition_points = COALESCE(competition_points, 0) + points_to_award WHERE id = winner_id;
    ELSE
        -- TIE: Update both
        UPDATE profiles SET competition_points = COALESCE(competition_points, 0) + points_to_award WHERE id IN (NEW.uploader_id, partner_mem.uploader_id);
    END IF;

    -- Mark Partner Memory as awarded
    -- We disable the trigger temporarily for this update to avoid recursion loop if logic was different, 
    -- but our early exit condition (points_awarded check) handles it safely.
    UPDATE memories 
    SET metadata = jsonb_set(metadata, '{points_awarded}', 'true'::jsonb)
    WHERE id = partner_mem.id;

    -- Mark My Memory (NEW)
    NEW.metadata := jsonb_set(NEW.metadata, '{points_awarded}', 'true'::jsonb);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_memory_competition_completion
    BEFORE INSERT OR UPDATE ON memories
    FOR EACH ROW
    EXECUTE FUNCTION check_and_award_competition_points();
