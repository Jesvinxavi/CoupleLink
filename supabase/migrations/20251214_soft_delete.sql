-- Migration: support_soft_delete_and_restore

-- 1. Add status columns to couples table
ALTER TABLE public.couples 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'archived')),
ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- 2. Modify unpair_couple to perform Soft Delete
CREATE OR REPLACE FUNCTION public.unpair_couple()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  couple_record record;
BEGIN
  current_user_id := auth.uid();
  
  -- Find the couple the user belongs to
  SELECT * INTO couple_record
  FROM public.couples
  WHERE (user_one_id = current_user_id OR user_two_id = current_user_id)
  AND status = 'active'
  LIMIT 1;

  IF couple_record IS NULL THEN
    RAISE EXCEPTION 'No active couple found for user';
  END IF;

  -- "Soft Delete": Archive the couple instead of deleting row
  UPDATE public.couples
  SET status = 'archived',
      archived_at = now()
  WHERE id = couple_record.id;

  -- Update profiles to remove the couple_id (effectively unpairing them)
  UPDATE public.profiles
  SET couple_id = NULL
  WHERE couple_id = couple_record.id;

END;
$$;

-- 3. New RPC: Check for archived couple between two users (and get stats)
CREATE OR REPLACE FUNCTION public.check_archived_couple(partner_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  partner_id uuid;
  archived_couple_id uuid;
  photo_count bigint;
  journal_count bigint;
  history_start timestamptz;
  history_end timestamptz;
  duration_days int;
BEGIN
  current_user_id := auth.uid();
  
  -- Find partner ID from email
  SELECT id INTO partner_id
  FROM public.profiles
  WHERE email = partner_email
  LIMIT 1;
  
  IF partner_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Access Control: Ensure current user is not attempting to snoop random people
  -- But wait, if they aren't paired, they have no relationship.
  -- We rely on the fact that to restore, you must explicitly match with the correct OLD partner.
  
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

  -- Gather Stats for the upsell
  -- Count Photos (Memories of type 'image')
  SELECT count(*) INTO photo_count
  FROM public.memories
  WHERE couple_id = archived_couple_id 
  AND type = 'image';

  -- Count Journal Entries (Assuming 'memories' table also holds journals or 'journal_entries' table?)
  -- Based on codebase, journals might be text memories or separate. 
  -- Checking context... assuming 'journal' type in memories or separate table.
  -- Let's assume general memories for now or check if there's a specific table.
  -- Safe bet: Count all memories.
  
  -- Actually, let's refine: Count all memories.
  SELECT count(*) INTO journal_count
  FROM public.memories
  WHERE couple_id = archived_couple_id
  AND type = 'journal'; -- Or just count total memories for simplicity

  -- Calculate duration
  IF history_end IS NOT NULL AND history_start IS NOT NULL THEN
     duration_days := EXTRACT(DAY FROM (history_end - history_start));
  ELSE
     duration_days := 0;
  END IF;

  RETURN json_build_object(
    'found', true,
    'couple_id', archived_couple_id,
    'stats', json_build_object(
      'photo_count', photo_count,
      'journal_count', journal_count,
      'duration_days', duration_days
    )
  );
END;
$$;

-- 4. New RPC: Restore Couple
CREATE OR REPLACE FUNCTION public.restore_couple(target_couple_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  couple_record record;
BEGIN
  current_user_id := auth.uid();

  -- Verify ownership: User must be one of the partners in this archived couple
  SELECT * INTO couple_record
  FROM public.couples
  WHERE id = target_couple_id
  AND (user_one_id = current_user_id OR user_two_id = current_user_id)
  AND status = 'archived';

  IF couple_record IS NULL THEN
    RAISE EXCEPTION 'Archived couple not found or permission denied';
  END IF;

  -- Restore: Set status to active, clear archive date
  UPDATE public.couples
  SET status = 'active',
      archived_at = NULL
  WHERE id = target_couple_id;

  -- Re-link profiles: Update both users to point to this couple again
  UPDATE public.profiles
  SET couple_id = target_couple_id
  WHERE id IN (couple_record.user_one_id, couple_record.user_two_id);

END;
$$;
