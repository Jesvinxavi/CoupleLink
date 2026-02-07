-- Migration: Fix Challenge Media URLs in Throwback
-- 1. Updates challenge query block to fetch media_urls instead of returning NULL
-- 2. Maintains 'challenge' type filter to allow user to continue testing (will be reverted later)

DROP FUNCTION IF EXISTS get_random_throwback(uuid, float8, date);

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
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH all_memories_raw AS (
        -- Photo memories
        SELECT 
            m.id,
            m.type::text as type,
            m.title,
            m.caption as content,
            m.created_at,
            COALESCE(m.media_urls, CASE WHEN m.media_url IS NOT NULL THEN ARRAY[m.media_url] ELSE NULL END) as media_urls,
            m.location,
            m.uploader_id,
            NULL::jsonb as extra_data
        FROM memories m
        WHERE m.couple_id = p_couple_id
            AND m.type = 'photo'
            AND (p_exclude_date IS NULL OR DATE(m.created_at) != p_exclude_date)
        
        UNION ALL
        
        -- Journal memories
        SELECT 
            m.id,
            'journal'::text as type,
            m.title,
            m.caption as content,
            m.created_at,
            COALESCE(m.media_urls, CASE WHEN m.media_url IS NOT NULL THEN ARRAY[m.media_url] ELSE NULL END) as media_urls,
            m.location,
            m.uploader_id,
            NULL::jsonb as extra_data
        FROM memories m
        WHERE m.couple_id = p_couple_id
            AND m.type = 'journal'
            AND (p_exclude_date IS NULL OR DATE(m.created_at) != p_exclude_date)
        
        UNION ALL
        
        -- Completed challenges
        SELECT 
            m.id,
            'challenge'::text as type,
            m.title,
            m.caption as content,
            m.created_at,
            -- CHANGED: Fetch media_urls for challenges
            COALESCE(m.media_urls, CASE WHEN m.media_url IS NOT NULL THEN ARRAY[m.media_url] ELSE NULL END) as media_urls,
            NULL::text as location,
            m.uploader_id,
            jsonb_build_object(
                'activity_question', m.title,
                'answers', (
                    SELECT jsonb_agg(jsonb_build_object('user_id', ua.user_id, 'answer', ua.answer_text))
                    FROM user_answers ua
                    LEFT JOIN activities a ON ua.activity_id = a.id
                    WHERE ua.couple_id = p_couple_id
                    AND (
                        (m.challenge_id IS NOT NULL AND ua.activity_id = m.challenge_id::uuid)
                        OR
                        (m.challenge_id IS NULL AND a.type = 'challenge' AND (a.content->>'title') = m.title)
                    )
                ),
                'challenge_type', m.metadata->>'challenge_type',
                'is_competition', (m.metadata->>'isCompetition')::boolean,
                'partner_completed', (
                    EXISTS (
                        SELECT 1 FROM memories pm
                        WHERE pm.couple_id = p_couple_id
                        AND pm.type = 'challenge'
                        AND pm.uploader_id != m.uploader_id -- Partner's upload
                        AND (
                            -- Match by explicit ID if available
                            (m.challenge_id IS NOT NULL AND pm.challenge_id = m.challenge_id)
                            OR
                            -- Fallback: Match by Title and timeframe (approximate)
                            (m.challenge_id IS NULL AND pm.title = m.title AND ABS(EXTRACT(EPOCH FROM (pm.created_at - m.created_at))) < 86400 * 7) -- Within 7 days
                        )
                    )
                )
            ) as extra_data
        FROM memories m
        WHERE m.couple_id = p_couple_id
            AND m.type = 'challenge'
            AND (p_exclude_date IS NULL OR DATE(m.created_at) != p_exclude_date)
        
        UNION ALL
        
        -- Completed positions
        SELECT 
            cp.id,
            'position'::text as type,
            cp.position_id as title,
            NULL::text as content,
            cp.completed_at as created_at,
            NULL::text[] as media_urls,
            NULL::text as location,
            NULL::uuid as uploader_id,
            jsonb_build_object(
                'title', cp.position_id
            ) as extra_data
        FROM completed_positions cp
        WHERE cp.couple_id = p_couple_id
            AND (p_exclude_date IS NULL OR DATE(cp.completed_at) != p_exclude_date)

        UNION ALL

        -- Vouchers
        SELECT 
            m.id,
            'voucher'::text as type,
            m.title,
            m.caption as content,
            m.created_at,
            NULL::text[] as media_urls,
            NULL::text as location,
            m.uploader_id,
            jsonb_build_object(
                'assigned_to', (m.metadata->>'assigned_to')::uuid,
                'redeemed_at', (m.metadata->>'redeemed_at')::timestamptz
            ) as extra_data
        FROM memories m
        WHERE m.couple_id = p_couple_id
            AND m.type = 'voucher'
            AND (p_exclude_date IS NULL OR DATE(m.created_at) != p_exclude_date)

        UNION ALL

        -- Sticky Notes
        SELECT 
            m.id,
            'sticky_note'::text as type,
            m.title,
            m.caption as content,
            m.created_at,
            NULL::text[] as media_urls,
            NULL::text as location,
            m.uploader_id,
            NULL::jsonb as extra_data
        FROM memories m
        WHERE m.couple_id = p_couple_id
            AND m.type = 'sticky_note'
            AND (p_exclude_date IS NULL OR DATE(m.created_at) != p_exclude_date)

        UNION ALL

        -- Events
        SELECT 
            m.id,
            'event'::text as type,
            m.title,
            m.caption as content,
            m.created_at,
            NULL::text[] as media_urls,
            m.location,
            m.uploader_id,
            jsonb_build_object(
                'event_color', m.metadata->>'event_color',
                'category', m.metadata->>'category'
            ) as extra_data
        FROM memories m
        WHERE m.couple_id = p_couple_id
            AND m.type = 'event'
            AND (p_exclude_date IS NULL OR DATE(m.created_at) != p_exclude_date)
    ),
    all_memories AS (
        SELECT * FROM all_memories_raw amr WHERE amr.type = 'challenge'
    ),
    numbered_items AS (
        SELECT 
            am.*, 
            ROW_NUMBER() OVER (ORDER BY am.created_at DESC) as rn,
            COUNT(*) OVER () as total_count 
        FROM all_memories am
    )
    SELECT 
        ni.id,
        ni.type,
        ni.title,
        ni.content,
        ni.created_at,
        ni.media_urls,
        ni.location,
        ni.uploader_id,
        ni.extra_data
    FROM numbered_items ni
    WHERE ni.total_count > 0 
    AND ni.rn = (floor(p_seed * ni.total_count)::int + 1);
END;
$$;
