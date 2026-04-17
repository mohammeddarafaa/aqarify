CREATE TABLE negotiations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  potential_customer_id UUID NOT NULL REFERENCES potential_customers(id) ON DELETE CASCADE,
  unit_id               UUID REFERENCES units(id) ON DELETE SET NULL,
  offered_price         NUMERIC(12, 2) NOT NULL,
  counter_price         NUMERIC(12, 2),
  discount_pct          NUMERIC(5, 2) DEFAULT 0,
  special_terms         TEXT,
  status                offer_status NOT NULL DEFAULT 'pending',
  created_by            UUID NOT NULL REFERENCES users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_negotiations_tenant ON negotiations(tenant_id);
CREATE INDEX idx_negotiations_lead ON negotiations(potential_customer_id);

ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;

-- Policies in 00015_create_rls_policies.sql
