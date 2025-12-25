-- 1. Add created_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'couples' AND column_name = 'created_at') THEN
        ALTER TABLE public.couples ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 2. Update the RPC to use the new column
CREATE OR REPLACE FUNCTION public.check_existing_archive_for_pair()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id uuid;
  v_current_couple_id uuid;
  v_current_couple_created_at timestamptz;
  v_partner_id uuid;
  
  v_archived_couple_id uuid;
  v_archived_at timestamptz;
  v_anniversary_date date;
  
  v_photo_count bigint;
  v_journal_count bigint;
  v_duration_days int;
BEGIN
  v_current_user_id := auth.uid();
  
  -- 1. Find current user's active couple
  SELECT couple_id INTO v_current_couple_id 
  FROM public.profiles 
  WHERE id = v_current_user_id;

  IF v_current_couple_id IS NULL THEN RETURN NULL; END IF;

  -- 2. Find partner and creation date of CURRENT space
  SELECT c.created_at, 
         CASE WHEN c.user_one_id = v_current_user_id THEN c.user_two_id ELSE c.user_one_id END
  INTO v_current_couple_created_at, v_partner_id
  FROM public.couples c
  WHERE c.id = v_current_couple_id;

  IF v_partner_id IS NULL THEN RETURN NULL; END IF;

  -- 3. REUNION TIMER CHECK
  -- If this "new" space is older than 7 days, we do NOT offer restore.
  -- Note: If created_at is NULL (legacy), we treat it as old, or if defaulted to now(), it's new.
  -- Since we just added the column with DEFAULT now(), legacy rows are technically "new" today.
  -- This is a one-time side effect acceptable for the feature.
  IF v_current_couple_created_at < (now() - interval '7 days') THEN
    RETURN NULL;
  END IF;

  -- 4. Find an archived couple containing BOTH these users
  SELECT c.id, c.archived_at, c.anniversary_date
  INTO v_archived_couple_id, v_archived_at, v_anniversary_date
  FROM public.couples c
  WHERE ((c.user_one_id = v_current_user_id AND c.user_two_id = v_partner_id) 
      OR (c.user_one_id = v_partner_id AND c.user_two_id = v_current_user_id))
  AND c.status = 'archived'
  ORDER BY c.archived_at DESC
  LIMIT 1;

  IF v_archived_couple_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 5. Gather Stats
  SELECT count(*) INTO v_photo_count 
  FROM public.memories m
  WHERE m.couple_id = v_archived_couple_id 
  AND m.type = 'image';

  SELECT count(*) INTO v_journal_count 
  FROM public.memories m
  WHERE m.couple_id = v_archived_couple_id 
  AND m.type = 'journal';
  
  -- Calculate Duration
  IF v_archived_at IS NOT NULL AND v_anniversary_date IS NOT NULL THEN
     v_duration_days := (date(v_archived_at) - v_anniversary_date);
     IF v_duration_days < 0 THEN v_duration_days := 0; END IF;
  ELSE
     v_duration_days := 0;
  END IF;

  RETURN json_build_object(
    'found', true,
    'archived_couple_id', v_archived_couple_id,
    'archived_at', v_archived_at,
    'stats', json_build_object(
      'photo_count', v_photo_count,
      'journal_count', v_journal_count,
      'duration_days', v_duration_days
    )
  );
END;
$$;
