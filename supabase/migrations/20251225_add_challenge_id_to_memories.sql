-- Migration to add challenge_id to memories table
-- This column will store the ID of the challenge to enable robust matching,
-- replacing the reliance on the 'title' column.

ALTER TABLE memories
ADD COLUMN challenge_id TEXT;

COMMENT ON COLUMN memories.challenge_id IS 'Stable ID of the challenge, used for streak matching.';

-- Index for performance on the new column since it will be used in joins
CREATE INDEX idx_memories_challenge_id ON memories(challenge_id);
