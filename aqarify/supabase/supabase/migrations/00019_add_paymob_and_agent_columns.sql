-- Add Paymob columns to tenants
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS paymob_api_key_enc TEXT,
  ADD COLUMN IF NOT EXISTS paymob_integration_id TEXT,
  ADD COLUMN IF NOT EXISTS paymob_iframe_id TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS address TEXT;

-- Add is_active to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add agent_id to reservations
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
