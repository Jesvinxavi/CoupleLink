-- Refine check_archived_couple to return info if partner is already in an active space

CREATE OR REPLACE FUNCTION public.check_archived_couple(partner_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  partner_id uuid;
  archived_couple_id uuid;
  partner_active_couple_id uuid;
  photo_count bigint;
  journal_count bigint;
  history_start timestamptz;
  history_end timestamptz;
  duration_days int;
BEGIN
  current_user_id := auth.uid();
  
  -- Find partner ID from email - query auth.users, NOT profiles
  SELECT id INTO partner_id
  FROM auth.users
  WHERE email = partner_email
  LIMIT 1;
  
  IF partner_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- NEW: Check if partner is ALREADY in an active couple (based on their profile)
  SELECT couple_id INTO partner_active_couple_id
  FROM public.profiles
  WHERE id = partner_id;

  -- If profile has a couple_id, verify it's actually active
  IF partner_active_couple_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.couples WHERE id = partner_active_couple_id AND status = 'active') THEN
          partner_active_couple_id := NULL; -- It was a ghost link or archived
      END IF;
  END IF;

  -- Find an archived couple containing BOTH these users
  SELECT id, created_at, archived_at INTO archived_couple_id, history_start, history_end
  FROM public.couples
  WHERE ((user_one_id = current_user_id AND user_two_id = partner_id) OR (user_one_id = partner_id AND user_two_id = current_user_id))
  AND status = 'archived'
  ORDER BY archived_at DESC
  LIMIT 1;

  IF archived_couple_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Gather Stats
  SELECT count(*) INTO photo_count
  FROM public.memories
  WHERE couple_id = archived_couple_id 
  AND type = 'image';

  SELECT count(*) INTO journal_count
  FROM public.memories
  WHERE couple_id = archived_couple_id
  AND type = 'journal';

  IF history_end IS NOT NULL AND history_start IS NOT NULL THEN
     duration_days := EXTRACT(DAY FROM (history_end - history_start));
  ELSE
     duration_days := 0;
  END IF;

  RETURN json_build_object(
    'found', true,
    'couple_id', archived_couple_id,
    'partner_active_couple_id', partner_active_couple_id, -- Return this
    'stats', json_build_object(
      'photo_count', photo_count,
      'journal_count', journal_count,
      'duration_days', duration_days
    )
  );
END;
$$;
