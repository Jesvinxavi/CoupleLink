-- Notification Preferences & Timezone Columns
-- Add notification_preferences JSONB column and timezone to profiles table

-- Add notification_preferences column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "master_toggle": true,
  "sections": {
    "challenges_streak": true,
    "sexploration_fun": true,
    "dates_reminders": true
  },
  "types": {
    "daily_question": true,
    "challenge_completion": true,
    "streak_expiry": true,
    "daily_expiry": true,
    "weekly_expiry": true,
    "monthly_expiry": true,
    "new_sticky_note": true,
    "new_journal_post": true,
    "fantasies": true,
    "coupons": true,
    "calendar_events": true,
    "partner_birthday": true,
    "my_birthday": true,
    "anniversary": true
  }
}'::jsonb;

-- Add timezone column for local-time notifications (birthdays/anniversaries)
-- Updated from browser on each app load, Edge Function uses last recorded value
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Function to initialize preferences for existing users (run once)
CREATE OR REPLACE FUNCTION initialize_notification_preferences()
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET notification_preferences = '{
      "master_toggle": true,
      "sections": {"challenges_streak": true, "sexploration_fun": true, "dates_reminders": true},
      "types": {
        "daily_question": true, "challenge_completion": true, "streak_expiry": true,
        "daily_expiry": true, "weekly_expiry": true, "monthly_expiry": true,
        "new_sticky_note": true, "new_journal_post": true, "fantasies": true,
        "coupons": true, "calendar_events": true, "partner_birthday": true,
        "my_birthday": true, "anniversary": true
      }
    }'::jsonb
    WHERE notification_preferences IS NULL;

    UPDATE public.profiles SET timezone = 'UTC' WHERE timezone IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Execute the initialization function
SELECT initialize_notification_preferences();

-- Push Notification Logs Table (for error logging and debugging)
CREATE TABLE IF NOT EXISTS public.push_notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notification_type TEXT NOT NULL,
    status TEXT NOT NULL, -- 'sent', 'failed', 'skipped'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_push_notification_logs_user_id ON public.push_notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_push_notification_logs_created_at ON public.push_notification_logs(created_at DESC);

-- RLS for logs
ALTER TABLE public.push_notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs
CREATE POLICY "Users can view own notification logs"
    ON public.push_notification_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Service role needs full access for Edge Functions
CREATE POLICY "Service role full access logs"
    ON public.push_notification_logs FOR ALL
    USING (auth.role() = 'service_role');
