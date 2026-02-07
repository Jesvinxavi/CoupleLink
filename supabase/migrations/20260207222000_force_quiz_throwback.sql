-- Migration: Force Question (Quiz) Throwbacks (Testing)
-- Includes Quiz activities that have answers from both partners

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
            (
                SELECT array_agg(DISTINCT url)
                FROM (
                    SELECT unnest(COALESCE(m.media_urls, CASE WHEN m.media_url IS NOT NULL THEN ARRAY[m.media_url] ELSE ARRAY[]::text[] END)) as url
                    UNION ALL
                    SELECT pm.media_url as url
                    FROM memories pm
                    WHERE pm.couple_id = p_couple_id
                    AND pm.type = 'challenge'
                    AND pm.uploader_id != m.uploader_id
                    AND pm.media_url IS NOT NULL
                    AND (
                        (m.challenge_id IS NOT NULL AND pm.challenge_id = m.challenge_id)
                        OR
                        (m.challenge_id IS NULL AND pm.title = m.title AND ABS(EXTRACT(EPOCH FROM (pm.created_at - m.created_at))) < 86400 * 7)
                    )
                ) media_collection
                WHERE url IS NOT NULL
            ) as media_urls,
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
                'partner_completed', true
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
        -- Fantasy Bucket List (Completed)
        SELECT 
            fbl.id,
            'fantasy'::text as type,
            fbl.fantasy_text as title,
            NULL::text as content,
            fbl.created_at,
            NULL::text[] as media_urls,
            NULL::text as location,
            fbl.requester_id as uploader_id,
            jsonb_build_object(
                'status', fbl.status
            ) as extra_data
        FROM fantasy_bucket_list fbl
        WHERE fbl.couple_id = p_couple_id
            AND fbl.status = 'completed'
            AND (p_exclude_date IS NULL OR DATE(fbl.created_at) != p_exclude_date)

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

        UNION ALL
        -- Quizzes (Daily Questions)
        SELECT 
            a.id,
            'quiz'::text as type,
            a.content->>'question' as title,
            NULL::text as content,
            MAX(ua.created_at) as created_at,
            NULL::text[] as media_urls,
            NULL::text as location,
            NULL::uuid as uploader_id,
            jsonb_build_object(
                'answers', jsonb_agg(jsonb_build_object('user_id', ua.user_id, 'answer', ua.answer_text))
            ) as extra_data
        FROM activities a
        JOIN user_answers ua ON ua.activity_id = a.id
        WHERE ua.couple_id = p_couple_id
            AND a.type = 'quiz'
            AND (p_exclude_date IS NULL OR DATE(ua.created_at) != p_exclude_date)
        GROUP BY a.id, a.content
        HAVING COUNT(DISTINCT ua.user_id) >= 2
    ),
    all_memories AS (
        SELECT * FROM all_memories_raw
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
