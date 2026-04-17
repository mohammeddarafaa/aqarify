-- Waitlist / reservation enum values used by app code
ALTER TYPE waitlist_status ADD VALUE IF NOT EXISTS 'waiting';
ALTER TYPE waitlist_status ADD VALUE IF NOT EXISTS 'cancelled';

ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'rejected';

-- NOTE: Cannot UPDATE to new enum values in the same transaction as ADD VALUE (PostgreSQL 55P04).
-- See 00033_waitlist_migrate_active_to_waiting.sql

ALTER TYPE followup_type ADD VALUE IF NOT EXISTS 'whatsapp';
ALTER TYPE followup_type ADD VALUE IF NOT EXISTS 'other';

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS receipt_url TEXT;

ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'scheduled';
