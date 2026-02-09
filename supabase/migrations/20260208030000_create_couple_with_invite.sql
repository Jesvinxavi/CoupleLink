-- 20260208_03_create_couple_with_invite.sql
-- RPC to generate an invite code and create a couple
CREATE OR REPLACE FUNCTION public.create_couple_with_invite()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    v_couple_id UUID;
    v_invite_code TEXT;
BEGIN
    current_user_id := auth.uid();

    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    -- Prevent creating a new couple if user is already active in one
    IF EXISTS (
        SELECT 1
        FROM profiles p
        JOIN couples c ON p.couple_id = c.id
        WHERE p.id = current_user_id AND c.status = 'active'
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'User already in active couple');
    END IF;

    -- Generate a unique 6-char invite code
    LOOP
        v_invite_code := upper(substr(md5(random()::text), 1, 6));
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM couples WHERE lower(invite_code) = lower(v_invite_code)
        );
    END LOOP;

    INSERT INTO couples (invite_code, user_one_id)
    VALUES (v_invite_code, current_user_id)
    RETURNING id INTO v_couple_id;

    UPDATE profiles
    SET couple_id = v_couple_id
    WHERE id = current_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'couple_id', v_couple_id,
        'invite_code', v_invite_code
    );
END;
$$;
