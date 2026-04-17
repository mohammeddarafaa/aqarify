CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  custom_domain TEXT UNIQUE,
  logo_url    TEXT,
  favicon_url TEXT,
  -- {"primary_color":"#2563eb","secondary_color":"#64748b","accent_color":"#f59e0b","font_family":"Cairo"}
  theme_config JSONB NOT NULL DEFAULT '{"primary_color":"#2563eb","secondary_color":"#64748b","accent_color":"#f59e0b","font_family":"Cairo"}',
  -- {"filters":[],"has_search":true,"has_map_view":true,"has_clear_button":true}
  filter_schema JSONB NOT NULL DEFAULT '{"filters":[],"has_search":true,"has_map_view":true,"has_clear_button":true}',
  paymob_integration_id TEXT,
  paymob_api_key_enc TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  address TEXT,
  status tenant_status NOT NULL DEFAULT 'trial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Public: read active tenants by slug (no user reference needed)
CREATE POLICY "public_read_active" ON tenants
  FOR SELECT TO anon
  USING (status = 'active');

-- Policies referencing users table are in 00015_create_rls_policies.sql
