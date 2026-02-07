-- Migration: Force Voucher Throwbacks (Testing)
-- Forces return of 'voucher' type memories (from coupons table)

CREATE OR REPLACE FUNCTION get_random_throwback(
    p_couple_id uuid,
    p_seed float8,
    p_exclude_date date DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    type text,
    title text,
    content text,
    created_at timestamptz,
    media_urls text[],
    location text,
    uploader_id uuid,
    extra_data jsonb
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_random_index integer;
    v_count integer;
BEGIN
    -- 1. Get count of available coupons (active or redeemed)
    SELECT count(*)
    INTO v_count
    FROM coupons c
    WHERE c.couple_id = p_couple_id;

    -- 2. If no coupons, return nothing
    IF v_count = 0 THEN
        RETURN;
    END IF;

    -- 3. Calculate random offset
    v_random_index := floor(p_seed * v_count)::integer;

    -- 4. Return random coupon as throwback
    RETURN QUERY
    SELECT
        c.id,
        'voucher'::text as type,
        c.title,
        c.description as content,
        c.created_at, -- Use created_at as it's always present
        NULL::text[] as media_urls,
        NULL::text as location,
        c.gifted_by as uploader_id, -- Gifted by is kind of like uploader
        jsonb_build_object(
            'assigned_to', c.assigned_to, -- Required for "Redeemed by" matching
            'status', c.status
        ) as extra_data
    FROM coupons c
    WHERE c.couple_id = p_couple_id
    LIMIT 1
    OFFSET v_random_index;

END;
$$;
