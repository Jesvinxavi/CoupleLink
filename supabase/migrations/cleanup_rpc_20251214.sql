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
  -- Thanks to ON DELETE CASCADE, this single line deletes memories, events, etc.
  IF current_couple_id IS NOT NULL AND current_couple_id <> archived_id THEN
      DELETE FROM public.couples WHERE id = current_couple_id;
  END IF;

END;
$$;
