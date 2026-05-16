-- 00061_fix_missing_enum_values.sql
-- Add missing enum values used by application code
BEGIN;

-- Add values to waitlist_status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'waitlist_status' AND e.enumlabel = 'waiting') THEN
    ALTER TYPE waitlist_status ADD VALUE 'waiting';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'waitlist_status' AND e.enumlabel = 'cancelled') THEN
    ALTER TYPE waitlist_status ADD VALUE 'cancelled';
  END IF;
EXCEPTION WHEN undefined_function THEN
  -- If enum doesn't exist, skip — migration assumes enum exists in prior migrations
  RAISE NOTICE 'waitlist_status enum not found; skipping value additions';
END$$;

-- Add value to reservation_status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'reservation_status' AND e.enumlabel = 'rejected') THEN
    ALTER TYPE reservation_status ADD VALUE 'rejected';
  END IF;
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'reservation_status enum not found; skipping value additions';
END$$;

COMMIT;
