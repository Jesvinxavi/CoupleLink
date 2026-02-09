-- Fix: Combine profile updates into single statement to prevent race condition
-- The partner's realtime subscription must receive couple_id AND last_seen_rain_check_tokens atomically

-- 1. Update restore_archived_and_delete_current (Dashboard modal restore)
CREATE OR REPLACE FUNCTION public.restore_archived_and_delete_current(archived_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  current_couple_id uuid;
  target_user_one uuid;
  target_user_two uuid;
  v_rain_check_tokens integer;
BEGIN
  current_user_id := auth.uid();
  
  -- Validation
  SELECT user_one_id, user_two_id INTO target_user_one, target_user_two
  FROM public.couples
  WHERE id = archived_id AND (user_one_id = current_user_id OR user_two_id = current_user_id);
  
  IF target_user_one IS NULL THEN RAISE EXCEPTION 'Access Denied'; END IF;

  -- Get current active couple
  SELECT couple_id INTO current_couple_id FROM public.profiles WHERE id = current_user_id;

  -- Pre-fetch the archived couple's rain_check_tokens
  SELECT COALESCE(rain_check_tokens, 0) INTO v_rain_check_tokens
  FROM public.couples WHERE id = archived_id;

  -- 1. Point Profiles to Archive AND sync rain check baseline in ONE update
  UPDATE public.profiles 
  SET couple_id = archived_id,
      last_seen_rain_check_tokens = v_rain_check_tokens
  WHERE id IN (target_user_one, target_user_two);

  -- 2. Restore Archive
  UPDATE public.couples SET status = 'active', archived_at = NULL WHERE id = archived_id;

  -- 3. Delete Temp
  IF current_couple_id IS NOT NULL AND current_couple_id <> archived_id THEN
      IF EXISTS (SELECT 1 FROM public.couples WHERE id = current_couple_id AND status = 'active') THEN
          DELETE FROM public.couples WHERE id = current_couple_id;
      END IF;
  END IF;
END;
$$;

-- 2. Update restore_couple (Restore Space page restore)
CREATE OR REPLACE FUNCTION restore_couple(target_couple_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    current_user_id uuid;
    couple_record record;
    v_rain_check_tokens integer;
BEGIN
    current_user_id := auth.uid();

    SELECT * INTO couple_record FROM couples
    WHERE id = target_couple_id
      AND (user_one_id = current_user_id OR user_two_id = current_user_id)
      AND status = 'archived';

    IF couple_record IS NULL THEN
        RAISE EXCEPTION 'Archived couple not found or permission denied';
    END IF;

    -- Pre-fetch the archived couple's rain_check_tokens
    SELECT COALESCE(rain_check_tokens, 0) INTO v_rain_check_tokens
    FROM couples WHERE id = target_couple_id;

    UPDATE couples SET status = 'active', archived_at = NULL
    WHERE id = target_couple_id;

    -- Set couple_id AND sync rain check baseline in ONE update
    UPDATE profiles 
    SET couple_id = target_couple_id,
        last_seen_rain_check_tokens = v_rain_check_tokens
    WHERE id IN (couple_record.user_one_id, couple_record.user_two_id);
END;
$$;
