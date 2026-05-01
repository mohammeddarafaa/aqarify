CREATE TABLE IF NOT EXISTS domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  aggregate_type TEXT,
  aggregate_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_domain_events_pending ON domain_events(status, created_at);
CREATE INDEX IF NOT EXISTS idx_domain_events_tenant ON domain_events(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tenant_plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plugin_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, plugin_key)
);

CREATE INDEX IF NOT EXISTS idx_tenant_plugins_enabled ON tenant_plugins(tenant_id, is_enabled);

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS default_locale TEXT NOT NULL DEFAULT 'ar-EG',
  ADD COLUMN IF NOT EXISTS default_timezone TEXT NOT NULL DEFAULT 'Africa/Cairo',
  ADD COLUMN IF NOT EXISTS fallback_currency TEXT NOT NULL DEFAULT 'EGP';
