-- 20251230_02_rls_policies.sql
-- Consolidates Row Level Security policies.

-- 1. SEX COUNTER
ALTER TABLE sex_counter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their couple's sex count"
ON sex_counter FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM couples
        WHERE id = sex_counter.couple_id
        AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
);

CREATE POLICY "Users can update their couple's sex count"
ON sex_counter FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM couples
        WHERE id = sex_counter.couple_id
        AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
);

CREATE POLICY "Users can insert their couple's sex count"
ON sex_counter FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM couples
        WHERE id = sex_counter.couple_id
        AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
);

-- 2. COMPLETED POSITIONS
ALTER TABLE completed_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their couple's positions"
ON completed_positions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM couples
        WHERE id = completed_positions.couple_id
        AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
);

CREATE POLICY "Users can insert positions"
ON completed_positions FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM couples
        WHERE id = completed_positions.couple_id
        AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
);

CREATE POLICY "Users can update positions"
ON completed_positions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM couples
        WHERE id = completed_positions.couple_id
        AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
);


-- 3. USER DATES
ALTER TABLE user_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their couple's dates"
ON user_dates FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM couples
        WHERE id = user_dates.couple_id
        AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
);

CREATE POLICY "Users can manage their couple's dates"
ON user_dates FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM couples
        WHERE id = user_dates.couple_id
        AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
);


-- 4. FANTASY BUCKET LIST
ALTER TABLE fantasy_bucket_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their couple's fantasy list"
ON fantasy_bucket_list FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM couples
        WHERE id = fantasy_bucket_list.couple_id
        AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
);

CREATE POLICY "Users can insert into fantasy list"
ON fantasy_bucket_list FOR INSERT
WITH CHECK (
    auth.uid() = requester_id AND
    EXISTS (
        SELECT 1 FROM couples
        WHERE id = fantasy_bucket_list.couple_id
        AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
);

CREATE POLICY "Users can update fantasy list"
ON fantasy_bucket_list FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM couples
        WHERE id = fantasy_bucket_list.couple_id
        AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
);

-- 5. COUPONS & TEMPLATES
ALTER TABLE coupon_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for templates" ON coupon_templates FOR SELECT USING (true);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Uses FIXED Policy to prevent recursion
CREATE POLICY "Users can view their couple's coupons"
ON coupons FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM couples c
        WHERE c.id = coupons.couple_id
        AND (c.user_one_id = auth.uid() OR c.user_two_id = auth.uid())
    )
);

CREATE POLICY "Users can insert coupons"
ON coupons FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM couples c
        WHERE c.id = coupons.couple_id
        AND (c.user_one_id = auth.uid() OR c.user_two_id = auth.uid())
    )
);

CREATE POLICY "Users can update their coupons"
ON coupons FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM couples c
        WHERE c.id = coupons.couple_id
        AND (c.user_one_id = auth.uid() OR c.user_two_id = auth.uid())
    )
);
