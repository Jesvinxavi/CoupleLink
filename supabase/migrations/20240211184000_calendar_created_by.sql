ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
