-- Sex counter table
CREATE TABLE sex_counter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(couple_id)
);

-- Completed positions table
CREATE TABLE completed_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  position_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(couple_id, position_id)
);

-- Enable RLS
ALTER TABLE sex_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sex_counter
CREATE POLICY "Couples can view their sex counter"
ON sex_counter FOR SELECT
USING (couple_id IN (SELECT id FROM couples WHERE user_one_id = auth.uid() OR user_two_id = auth.uid()));

CREATE POLICY "Couples can insert their sex counter"
ON sex_counter FOR INSERT
WITH CHECK (couple_id IN (SELECT id FROM couples WHERE user_one_id = auth.uid() OR user_two_id = auth.uid()));

CREATE POLICY "Couples can update their sex counter"
ON sex_counter FOR UPDATE
USING (couple_id IN (SELECT id FROM couples WHERE user_one_id = auth.uid() OR user_two_id = auth.uid()));

CREATE POLICY "Couples can delete their sex counter"
ON sex_counter FOR DELETE
USING (couple_id IN (SELECT id FROM couples WHERE user_one_id = auth.uid() OR user_two_id = auth.uid()));

-- RLS Policies for completed_positions
CREATE POLICY "Couples can view their completed positions"
ON completed_positions FOR SELECT
USING (couple_id IN (SELECT id FROM couples WHERE user_one_id = auth.uid() OR user_two_id = auth.uid()));

CREATE POLICY "Couples can insert their completed positions"
ON completed_positions FOR INSERT
WITH CHECK (couple_id IN (SELECT id FROM couples WHERE user_one_id = auth.uid() OR user_two_id = auth.uid()));

CREATE POLICY "Couples can update their completed positions"
ON completed_positions FOR UPDATE
USING (couple_id IN (SELECT id FROM couples WHERE user_one_id = auth.uid() OR user_two_id = auth.uid()));

CREATE POLICY "Couples can delete their completed positions"
ON completed_positions FOR DELETE
USING (couple_id IN (SELECT id FROM couples WHERE user_one_id = auth.uid() OR user_two_id = auth.uid()));
