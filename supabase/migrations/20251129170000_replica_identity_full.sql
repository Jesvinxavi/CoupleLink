-- Set REPLICA IDENTITY FULL on memories table to ensure DELETE events 
-- include all columns in the payload. This allows Supabase Realtime 
-- subscriptions to correctly filter DELETE events (e.g. by couple_id).

ALTER TABLE memories REPLICA IDENTITY FULL;
