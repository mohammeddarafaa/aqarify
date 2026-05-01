ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS enabled_features JSONB NOT NULL DEFAULT '[]'::jsonb;
