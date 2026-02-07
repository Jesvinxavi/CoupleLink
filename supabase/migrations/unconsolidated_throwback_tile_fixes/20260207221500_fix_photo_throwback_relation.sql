-- Migration: Fix Missing Relation Error (Force Photo Throwback)
-- Rewrite RPC to use `memories` table directly instead of `all_memories_raw` view

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
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.type,
        m.title,
        m.caption as content, -- Use caption as content for photos
        m.created_at,
        -- Coalesce media_urls: if array is null/empty, try to use single media_url as an array
        CASE
            WHEN m.media_urls IS NOT NULL AND array_length(m.media_urls, 1) > 0 THEN m.media_urls
            WHEN m.media_url IS NOT NULL THEN ARRAY[m.media_url]
            ELSE NULL::text[]
        END as media_urls,
        m.location,
        m.uploader_id,
        m.metadata as extra_data -- Use metadata as extra_data
    FROM
        memories m
    WHERE
        m.couple_id = p_couple_id
        AND m.type = 'photo'
        AND (p_exclude_date IS NULL OR m.created_at::date <> p_exclude_date::date)
    ORDER BY
        random()
    LIMIT 1;
END;
$$;
