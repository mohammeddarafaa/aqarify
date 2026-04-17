ALTER TABLE waiting_list
  ADD COLUMN IF NOT EXISTS preferred_type  TEXT,
  ADD COLUMN IF NOT EXISTS preferred_floor INTEGER,
  ADD COLUMN IF NOT EXISTS max_budget      NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS notes           TEXT;
