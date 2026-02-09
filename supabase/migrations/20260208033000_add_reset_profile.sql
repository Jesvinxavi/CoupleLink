-- 20260208_03_add_reset_profile.sql
-- Wipes user-owned data for account deletion flow
CREATE OR REPLACE FUNCTION public.reset_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();

    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Clean up user-owned records
    DELETE FROM push_subscriptions WHERE user_id = current_user_id;
    DELETE FROM push_notification_logs WHERE user_id = current_user_id;
    DELETE FROM user_answers WHERE user_id = current_user_id;
    DELETE FROM memories WHERE uploader_id = current_user_id;

    -- Finally remove the profile record
    DELETE FROM profiles WHERE id = current_user_id;
END;
$$;
