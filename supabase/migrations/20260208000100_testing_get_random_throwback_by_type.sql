-- ============================================================================
-- FORCE CATEGORY TESTING MIGRATION: get_random_throwback_by_type
-- ============================================================================
-- FOR DEVELOPMENT/TESTING USE ONLY
--
-- This migration creates a helper function to test specific throwback types.
-- It allows forcing a specific category to be returned for UI testing purposes.
--
-- Usage:
--   SELECT * FROM get_random_throwback_by_type(
--     'your-couple-id',
--     0.5,
--     'challenge'  -- or 'photo', 'position', 'fantasy', 'voucher', 'quiz', etc.
--   );
--
-- CONSOLIDATED FROM:
-- - 20260207194000_force_challenge_throwback.sql
-- - 20260207201000_force_lego_challenge_debug.sql
-- - 20260207203000_force_testy_memory_debug.sql
-- - 20260207204000_force_position_throwback.sql
-- - 20260207213000_force_fantasy_throwback.sql
-- - 20260207214500_force_voucher_throwback.sql
-- - 20260207220000_force_photo_throwback.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION get_random_throwback_by_type(
    p_couple_id uuid,
    p_seed float8,
    p_force_type text,
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
        -- ================================================================
        -- PHOTO MEMORIES
        -- ================================================================
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
        
        -- ================================================================
        -- JOURNAL MEMORIES
        -- ================================================================
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
        
        -- ================================================================
        -- CHALLENGE MEMORIES
        -- ================================================================
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
                'partner_completed', (
                    EXISTS (
                        SELECT 1 FROM memories pm
                        WHERE pm.couple_id = p_couple_id
                        AND pm.type = 'challenge'
                        AND pm.uploader_id != m.uploader_id
                        AND (
                            (m.challenge_id IS NOT NULL AND pm.challenge_id = m.challenge_id)
                            OR
                            (m.challenge_id IS NULL AND pm.title = m.title AND ABS(EXTRACT(EPOCH FROM (pm.created_at - m.created_at))) < 86400 * 7)
                        )
                    )
                )
            ) as extra_data
        FROM memories m
        WHERE m.couple_id = p_couple_id
            AND m.type = 'challenge'
            AND (p_exclude_date IS NULL OR DATE(m.created_at) != p_exclude_date)
        
        UNION ALL
        
        -- ================================================================
        -- COMPLETED POSITIONS
        -- ================================================================
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

        -- ================================================================
        -- FANTASY BUCKET LIST
        -- ================================================================
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

        -- ================================================================
        -- VOUCHERS (from coupons table for testing, memories for production)
        -- ================================================================
        SELECT 
            c.id,
            'voucher'::text as type,
            c.title,
            c.description as content,
            c.created_at,
            NULL::text[] as media_urls,
            NULL::text as location,
            c.gifted_by as uploader_id,
            jsonb_build_object(
                'assigned_to', c.assigned_to,
                'status', c.status
            ) as extra_data
        FROM coupons c
        WHERE c.couple_id = p_couple_id
            AND (p_exclude_date IS NULL OR DATE(c.created_at) != p_exclude_date)

        UNION ALL

        -- ================================================================
        -- STICKY NOTES
        -- ================================================================
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

        -- ================================================================
        -- EVENTS
        -- ================================================================
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

        -- ================================================================
        -- QUIZZES / DAILY QUESTIONS
        -- ================================================================
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
    -- Filter by type
    filtered_memories AS (
        SELECT * FROM all_memories_raw amr 
        WHERE amr.type = p_force_type
    ),
    numbered_items AS (
        SELECT 
            fm.*, 
            ROW_NUMBER() OVER (ORDER BY fm.created_at DESC) as rn,
            COUNT(*) OVER () as total_count 
        FROM filtered_memories fm
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

-- ============================================================================
-- USAGE EXAMPLES (Run in Supabase SQL Editor)
-- ============================================================================
-- Test photo throwback:
-- SELECT * FROM get_random_throwback_by_type('your-couple-id', 0.5, 'photo');
--
-- Test challenge throwback:
-- SELECT * FROM get_random_throwback_by_type('your-couple-id', 0.5, 'challenge');
--
-- Test position throwback:
-- SELECT * FROM get_random_throwback_by_type('your-couple-id', 0.5, 'position');
--
-- Test fantasy throwback:
-- SELECT * FROM get_random_throwback_by_type('your-couple-id', 0.5, 'fantasy');
--
-- Test voucher throwback:
-- SELECT * FROM get_random_throwback_by_type('your-couple-id', 0.5, 'voucher');
--
-- Test quiz/question throwback:
-- SELECT * FROM get_random_throwback_by_type('your-couple-id', 0.5, 'quiz');
-- ============================================================================
