CREATE TABLE potential_customers (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  name                    TEXT NOT NULL,
  phone                   TEXT,
  email                   TEXT,
  source                  lead_source NOT NULL DEFAULT 'inquiry',
  source_reservation_id   UUID REFERENCES reservations(id) ON DELETE SET NULL,
  -- ["apartment","villa"]
  interested_unit_types   JSONB DEFAULT '[]',
  budget_min              NUMERIC(12, 2),
  budget_max              NUMERIC(12, 2),
  -- ["Cairo","Shorouk"]
  preferred_locations     JSONB DEFAULT '[]',
  negotiation_status      negotiation_status NOT NULL DEFAULT 'new',
  assigned_agent_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  notes                   TEXT,
  last_contact_at         TIMESTAMPTZ,
  next_followup_at        TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_potential_customers_tenant ON potential_customers(tenant_id);
CREATE INDEX idx_potential_customers_agent ON potential_customers(assigned_agent_id);
CREATE INDEX idx_potential_customers_status ON potential_customers(negotiation_status);

ALTER TABLE potential_customers ENABLE ROW LEVEL SECURITY;

-- Policies in 00015_create_rls_policies.sql
