-- 00064_followups_add_status.sql
ALTER TABLE follow_ups ADD COLUMN status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled'));
UPDATE follow_ups SET status = 'completed' WHERE completed_at IS NOT NULL;
