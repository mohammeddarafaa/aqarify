CREATE TABLE waiting_list (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  unit_id             UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  customer_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position            INTEGER NOT NULL,
  status              waitlist_status NOT NULL DEFAULT 'active',
  -- {"sms":true,"email":true}
  notification_prefs  JSONB NOT NULL DEFAULT '{"sms":true,"email":true}',
  notified_at         TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (unit_id, customer_id)
);

CREATE INDEX idx_waitlist_tenant ON waiting_list(tenant_id);
CREATE INDEX idx_waitlist_unit ON waiting_list(unit_id);
CREATE INDEX idx_waitlist_customer ON waiting_list(customer_id);
CREATE INDEX idx_waitlist_status ON waiting_list(status);
CREATE INDEX idx_waitlist_expires ON waiting_list(expires_at) WHERE status = 'notified';

ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- Policies in 00015_create_rls_policies.sql
