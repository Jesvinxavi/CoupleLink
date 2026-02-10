-- Add missing tables to supabase_realtime publication
-- so NotificationListener receives postgres_changes events
ALTER PUBLICATION supabase_realtime ADD TABLE user_answers;
ALTER PUBLICATION supabase_realtime ADD TABLE fantasy_bucket_list;
ALTER PUBLICATION supabase_realtime ADD TABLE coupons;
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;
