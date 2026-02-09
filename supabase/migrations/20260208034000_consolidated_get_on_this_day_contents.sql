-- 20260208_03_consolidated_get_on_this_day_contents.sql
-- Consolidated "On This Day" throwback function
DROP FUNCTION IF EXISTS get_on_this_day_contents(uuid, int, int, text);
CREATE OR REPLACE FUNCTION get_on_this_day_contents(
    p_couple_id uuid,
    p_month int,
    p_day int,
    p_timezone text DEFAULT 'UTC'
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
    WITH all_memories AS (
        -- Photo memories from previous years on this day
        SELECT 
            m.id,
            m.type::text,
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
            AND EXTRACT(MONTH FROM m.created_at AT TIME ZONE p_timezone) = p_month
            AND EXTRACT(DAY FROM m.created_at AT TIME ZONE p_timezone) = p_day
            AND EXTRACT(YEAR FROM m.created_at AT TIME ZONE p_timezone) < EXTRACT(YEAR FROM NOW() AT TIME ZONE p_timezone)
        
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
            AND EXTRACT(MONTH FROM m.created_at AT TIME ZONE p_timezone) = p_month
            AND EXTRACT(DAY FROM m.created_at AT TIME ZONE p_timezone) = p_day
            AND EXTRACT(YEAR FROM m.created_at AT TIME ZONE p_timezone) < EXTRACT(YEAR FROM NOW() AT TIME ZONE p_timezone)
        
        UNION ALL
        
        -- Completed challenges
        SELECT 
            m.id,
            'challenge'::text as type,
            m.title,
            NULL::text as content,
            m.created_at,
            NULL::text[] as media_urls,
            NULL::text as location,
            m.uploader_id,
            jsonb_build_object(
                'activity_question', m.title,
                'answers', (
                    SELECT jsonb_agg(jsonb_build_object('user_id', ua.user_id, 'answer', ua.answer_text))
                    FROM user_answers ua
                    WHERE ua.activity_id = m.challenge_id::uuid AND ua.couple_id = p_couple_id
                )
            ) as extra_data
        FROM memories m
        WHERE m.couple_id = p_couple_id
            AND m.type = 'challenge'
            AND EXTRACT(MONTH FROM m.created_at AT TIME ZONE p_timezone) = p_month
            AND EXTRACT(DAY FROM m.created_at AT TIME ZONE p_timezone) = p_day
            AND EXTRACT(YEAR FROM m.created_at AT TIME ZONE p_timezone) < EXTRACT(YEAR FROM NOW() AT TIME ZONE p_timezone)
        
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
            NULL::jsonb as extra_data
        FROM completed_positions cp
        WHERE cp.couple_id = p_couple_id
            AND EXTRACT(MONTH FROM cp.completed_at AT TIME ZONE p_timezone) = p_month
            AND EXTRACT(DAY FROM cp.completed_at AT TIME ZONE p_timezone) = p_day
            AND EXTRACT(YEAR FROM cp.completed_at AT TIME ZONE p_timezone) < EXTRACT(YEAR FROM NOW() AT TIME ZONE p_timezone)
        
        UNION ALL
        
        -- Completed fantasies
        SELECT 
            f.id,
            'fantasy'::text as type,
            f.fantasy_text as title,
            NULL::text as content,
            f.completed_at as created_at,
            NULL::text[] as media_urls,
            NULL::text as location,
            f.requester_id as uploader_id,
            NULL::jsonb as extra_data
        FROM fantasy_bucket_list f
        WHERE f.couple_id = p_couple_id
            AND f.status = 'completed'
            AND f.completed_at IS NOT NULL
            AND EXTRACT(MONTH FROM f.completed_at AT TIME ZONE p_timezone) = p_month
            AND EXTRACT(DAY FROM f.completed_at AT TIME ZONE p_timezone) = p_day
            AND EXTRACT(YEAR FROM f.completed_at AT TIME ZONE p_timezone) < EXTRACT(YEAR FROM NOW() AT TIME ZONE p_timezone)
        
        UNION ALL
        
        -- Redeemed vouchers
        SELECT 
            c.id,
            'voucher'::text as type,
            c.title,
            c.description as content,
            c.redeemed_at as created_at,
            NULL::text[] as media_urls,
            NULL::text as location,
            c.gifted_by as uploader_id,
            jsonb_build_object('assigned_to', c.assigned_to) as extra_data
        FROM coupons c
        WHERE c.couple_id = p_couple_id
            AND c.status = 'redeemed'
            AND c.redeemed_at IS NOT NULL
            AND EXTRACT(MONTH FROM c.redeemed_at AT TIME ZONE p_timezone) = p_month
            AND EXTRACT(DAY FROM c.redeemed_at AT TIME ZONE p_timezone) = p_day
            AND EXTRACT(YEAR FROM c.redeemed_at AT TIME ZONE p_timezone) < EXTRACT(YEAR FROM NOW() AT TIME ZONE p_timezone)
        
        UNION ALL
        
        -- Sticky notes
        SELECT 
            m.id,
            'sticky_note'::text as type,
            NULL::text as title,
            m.caption as content,
            m.created_at,
            NULL::text[] as media_urls,
            NULL::text as location,
            m.uploader_id,
            NULL::jsonb as extra_data
        FROM memories m
        WHERE m.couple_id = p_couple_id
            AND m.type = 'sticky_note'
            AND EXTRACT(MONTH FROM m.created_at AT TIME ZONE p_timezone) = p_month
            AND EXTRACT(DAY FROM m.created_at AT TIME ZONE p_timezone) = p_day
            AND EXTRACT(YEAR FROM m.created_at AT TIME ZONE p_timezone) < EXTRACT(YEAR FROM NOW() AT TIME ZONE p_timezone)
        
        UNION ALL
        
        -- Past calendar events
        SELECT 
            e.id,
            'event'::text as type,
            e.title,
            e.description as content,
            e.event_date::timestamptz as created_at,
            NULL::text[] as media_urls,
            e.location,
            NULL::uuid as uploader_id,
            jsonb_build_object('event_color', e.color, 'category', e.category) as extra_data
        FROM calendar_events e
        WHERE e.couple_id = p_couple_id
            AND EXTRACT(MONTH FROM e.event_date::timestamptz AT TIME ZONE p_timezone) = p_month
            AND EXTRACT(DAY FROM e.event_date::timestamptz AT TIME ZONE p_timezone) = p_day
            AND EXTRACT(YEAR FROM e.event_date::timestamptz AT TIME ZONE p_timezone) < EXTRACT(YEAR FROM NOW() AT TIME ZONE p_timezone)
    )
    SELECT * FROM all_memories
    ORDER BY created_at DESC;
END;
$$;
