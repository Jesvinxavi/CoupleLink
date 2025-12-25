-- check_archived_couple fix
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
  history_start date; -- changed to date for anniversary
  history_end timestamptz;
  duration_days int;
BEGIN
  current_user_id := auth.uid();
  
  -- Find partner ID from email - query auth.users
  SELECT id INTO partner_id
  FROM auth.users
  WHERE email = partner_email
  LIMIT 1;
  
  IF partner_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check if partner is ALREADY in an active couple
  SELECT couple_id INTO partner_active_couple_id
  FROM public.profiles
  WHERE id = partner_id;

  IF partner_active_couple_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.couples WHERE id = partner_active_couple_id AND status = 'active') THEN
          partner_active_couple_id := NULL; 
      END IF;
  END IF;

  -- Find archived couple - use anniversary_date
  SELECT id, anniversary_date, archived_at INTO archived_couple_id, history_start, history_end
  FROM public.couples
  WHERE ((user_one_id = current_user_id AND user_two_id = partner_id) OR (user_one_id = partner_id AND user_two_id = current_user_id))
  AND status = 'archived'
  ORDER BY archived_at DESC
  LIMIT 1;

  IF archived_couple_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Gather Stats
  SELECT count(*) INTO photo_count FROM public.memories WHERE couple_id = archived_couple_id AND type = 'image';
  SELECT count(*) INTO journal_count FROM public.memories WHERE couple_id = archived_couple_id AND type = 'journal';

  IF history_end IS NOT NULL AND history_start IS NOT NULL THEN
     -- Cast to date for rough diff
     duration_days := (date(history_end) - history_start);
     IF duration_days < 0 THEN duration_days := 0; END IF;
  ELSE
     duration_days := 0;
  END IF;

  RETURN json_build_object(
    'found', true,
    'couple_id', archived_couple_id,
    'partner_active_couple_id', partner_active_couple_id,
    'stats', json_build_object(
      'photo_count', photo_count,
      'journal_count', journal_count,
      'duration_days', duration_days
    )
  );
END;
$$;


-- check_existing_archive_for_pair fix
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
  history_start date; -- changed
  history_end timestamptz;
  duration_days int;
BEGIN
  current_user_id := auth.uid();
  
  SELECT couple_id INTO current_couple_id FROM public.profiles WHERE id = current_user_id;

  IF current_couple_id IS NULL THEN RETURN NULL; END IF;

  SELECT 
    CASE WHEN user_one_id = current_user_id THEN user_two_id ELSE user_one_id END INTO partner_id
  FROM public.couples
  WHERE id = current_couple_id;

  IF partner_id IS NULL THEN RETURN NULL; END IF;

  -- Get record
  SELECT * INTO archived_couple_record
  FROM public.couples
  WHERE ((user_one_id = current_user_id AND user_two_id = partner_id) 
      OR (user_one_id = partner_id AND user_two_id = current_user_id))
  AND status = 'archived'
  ORDER BY archived_at DESC
  LIMIT 1;

  IF archived_couple_record IS NULL THEN RETURN NULL; END IF;

  -- Stats
  SELECT count(*) INTO photo_count FROM public.memories WHERE couple_id = archived_couple_record.id AND type = 'image';
  SELECT count(*) INTO journal_count FROM public.memories WHERE couple_id = archived_couple_record.id AND type = 'journal';

  history_start := archived_couple_record.anniversary_date;
  history_end := archived_couple_record.archived_at;
  
  IF history_end IS NOT NULL AND history_start IS NOT NULL THEN
     duration_days := (date(history_end) - history_start);
     IF duration_days < 0 THEN duration_days := 0; END IF;
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
