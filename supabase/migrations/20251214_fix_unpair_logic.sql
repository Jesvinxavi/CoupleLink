-- Fix: Nuclear Unpair
-- loops through ALL active couples involving the user and archives them.
-- This ensures that even if the partner is linked to a 'ghost' couple ID (different from the user's current profile link),
-- that ghost couple is also archived and the partner is unpaired.

CREATE OR REPLACE FUNCTION public.unpair_couple()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  couple_record record;
  found_any boolean := false;
BEGIN
  current_user_id := auth.uid();
  
  -- Iterate over ANY active couple where this user is a member
  FOR couple_record IN 
    SELECT * 
    FROM public.couples 
    WHERE (user_one_id = current_user_id OR user_two_id = current_user_id) 
    AND status = 'active'
  LOOP
    found_any := true;
    
    -- 1. Archive the couple
    UPDATE public.couples
    SET status = 'archived',
        archived_at = now()
    WHERE id = couple_record.id;

    -- 2. Clean up profiles for BOTH users in this couple
    UPDATE public.profiles
    SET couple_id = NULL
    WHERE couple_id = couple_record.id;
    
  END LOOP;

  -- Safety check: If no active couples were found, try to clean the profile anyway
  -- just in case the profile points to a non-existent or already archived couple
  IF NOT found_any THEN
      UPDATE public.profiles
      SET couple_id = NULL
      WHERE id = current_user_id;
  END IF;

END;
$$;
