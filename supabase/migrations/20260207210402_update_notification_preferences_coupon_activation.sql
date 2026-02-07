-- Add coupon_activation to notification_preferences for existing users
-- This ensures they have the setting toggle available in the UI

UPDATE public.profiles
SET notification_preferences = jsonb_set(
    COALESCE(notification_preferences, '{
      "master_toggle": true,
      "sections": {"challenges_streak": true, "sexploration_fun": true, "dates_reminders": true},
      "types": {
        "daily_question": true, "challenge_completion": true, "streak_expiry": true,
        "daily_expiry": true, "weekly_expiry": true, "monthly_expiry": true,
        "new_sticky_note": true, "new_journal_post": true, "fantasies": true,
        "coupons": true, "calendar_events": true, "partner_birthday": true,
        "my_birthday": true, "anniversary": true
      }
    }'::jsonb),
    '{types,coupon_activation}',
    'true'::jsonb
)
WHERE notification_preferences IS NULL 
   OR NOT (notification_preferences->'types' ? 'coupon_activation');
