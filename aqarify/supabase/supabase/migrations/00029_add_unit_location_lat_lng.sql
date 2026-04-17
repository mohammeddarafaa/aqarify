-- Optional per-unit map coordinates (fallback: omit from map or use project center in app)
ALTER TABLE units
  ADD COLUMN IF NOT EXISTS location_lat NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS location_lng NUMERIC(10, 7);
