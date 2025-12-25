-- 1. Check if the current couple (user + partner) has an older archived space
CREATE OR REPLACE FUNCTION public.check_existing_archive_for_pair()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  current_couple_id uuid;
  partner_id uuid;
  archived_couple_record record;
  photo_count bigint;
  journal_count bigint;
  history_start timestamptz;
  history_end timestamptz;
  duration_days int;
BEGIN
  current_user_id := auth.uid();
  
  -- Get current couple ID
  SELECT couple_id INTO current_couple_id
  FROM public.profiles
  WHERE id = current_user_id;

  IF current_couple_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Identify Partner ID from the current couple
  SELECT 
    CASE 
      WHEN user_one_id = current_user_id THEN user_two_id 
      ELSE user_one_id 
    END INTO partner_id
  FROM public.couples
  WHERE id = current_couple_id;

  IF partner_id IS NULL THEN
     RETURN NULL; -- Still single or partner hasn't fully joined yet?
  END IF;

  -- Search for an ARCHIVED couple between these two specific users
  -- Explicitly exclude the current_couple_id (though status='active' vs 'archived' handles that)
  SELECT * INTO archived_couple_record
  FROM public.couples
  WHERE ((user_one_id = current_user_id AND user_two_id = partner_id) 
      OR (user_one_id = partner_id AND user_two_id = current_user_id))
  AND status = 'archived'
  ORDER BY archived_at DESC
  LIMIT 1;

  IF archived_couple_record IS NULL THEN
    RETURN NULL;
  END IF;

  -- Found one! Gather stats
  SELECT count(*) INTO photo_count FROM public.memories WHERE couple_id = archived_couple_record.id AND type = 'image';
  SELECT count(*) INTO journal_count FROM public.memories WHERE couple_id = archived_couple_record.id AND type = 'journal';

  history_start := archived_couple_record.created_at;
  history_end := archived_couple_record.archived_at;
  
  IF history_end IS NOT NULL AND history_start IS NOT NULL THEN
     duration_days := EXTRACT(DAY FROM (history_end - history_start));
  ELSE
     duration_days := 0;
  END IF;

  RETURN json_build_object(
    'found', true,
    'archived_couple_id', archived_couple_record.id,
    'archived_at', archived_couple_record.archived_at,
    'stats', json_build_object(
      'photo_count', photo_count,
      'journal_count', journal_count,
      'duration_days', duration_days
    )
  );
END;
$$;

-- 2. Restore archived space and delete the current temporary one
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
BEGIN
  current_user_id := auth.uid();
  
  -- Validation: Ensure user owns the archived couple
  SELECT user_one_id, user_two_id INTO target_user_one, target_user_two
  FROM public.couples
  WHERE id = archived_id AND (user_one_id = current_user_id OR user_two_id = current_user_id);
  
  IF target_user_one IS NULL THEN
    RAISE EXCEPTION 'Access Denied or Invalid Archive ID';
  END IF;

  -- Get current active couple to delete
  SELECT couple_id INTO current_couple_id
  FROM public.profiles
  WHERE id = current_user_id;

  -- 1. Update Profiles to point to Archived Couple FIRST 
  -- (so they don't get orphaned when we delete the active one)
  UPDATE public.profiles
  SET couple_id = archived_id
  WHERE id IN (target_user_one, target_user_two);

  -- 2. Restore the Archived Couple
  UPDATE public.couples
  SET status = 'active', 
      archived_at = NULL
  WHERE id = archived_id;

  -- 3. Delete the "Temporary" Active Couple if it exists
  IF current_couple_id IS NOT NULL AND current_couple_id <> archived_id THEN
      -- Optional: Hard delete or Archive? User said "permanently deleted".
      -- Let's Hard Delete to keep it clean, as it was just a shell.
      DELETE FROM public.couples WHERE id = current_couple_id;
  END IF;

END;
$$;
