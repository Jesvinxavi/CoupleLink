-- Revert blocking check, allow users to join new space even if archived one exists.
-- We will handle the "Found Space" check on the Dashboard instead.

CREATE OR REPLACE FUNCTION public.join_couple(invite_code_input text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  couple_record record;
  current_user_id uuid;
begin
  current_user_id := auth.uid();
  
  -- Find the ACTIVE couple associated with this code
  select * into couple_record
  from couples
  where invite_code = invite_code_input;
  
  if not found then
    return json_build_object('success', false, 'message', 'Invalid or expired code');
  end if;
  
  if couple_record.user_two_id is not null then
    return json_build_object('success', false, 'message', 'This code has already been used');
  end if;
  
  if couple_record.user_one_id = current_user_id then
    return json_build_object('success', false, 'message', 'You cannot join your own space');
  end if;
  
  -- removed the archive check block here
  
  -- Proceed with Join
  update couples
  set user_two_id = current_user_id
  where id = couple_record.id;
  
  update profiles
  set couple_id = couple_record.id
  where id = current_user_id;
  
  return json_build_object('success', true, 'couple_id', couple_record.id);
end;
$function$
