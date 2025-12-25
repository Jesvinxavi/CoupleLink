-- Fantasy bucket list table
CREATE TABLE fantasy_bucket_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fantasy_text TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE fantasy_bucket_list ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Couples can view their fantasies"
ON fantasy_bucket_list FOR SELECT
USING (couple_id IN (SELECT id FROM couples WHERE user_one_id = auth.uid() OR user_two_id = auth.uid()));

CREATE POLICY "Couples can insert their fantasies"
ON fantasy_bucket_list FOR INSERT
WITH CHECK (couple_id IN (SELECT id FROM couples WHERE user_one_id = auth.uid() OR user_two_id = auth.uid()));

CREATE POLICY "Couples can update their fantasies"
ON fantasy_bucket_list FOR UPDATE
USING (couple_id IN (SELECT id FROM couples WHERE user_one_id = auth.uid() OR user_two_id = auth.uid()));

CREATE POLICY "Couples can delete their fantasies"
ON fantasy_bucket_list FOR DELETE
USING (couple_id IN (SELECT id FROM couples WHERE user_one_id = auth.uid() OR user_two_id = auth.uid()));
