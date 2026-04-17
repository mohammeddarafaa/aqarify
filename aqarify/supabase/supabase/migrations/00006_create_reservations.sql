CREATE TABLE reservations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  unit_id               UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  customer_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  agent_id              UUID REFERENCES users(id) ON DELETE SET NULL,
  confirmation_number   TEXT UNIQUE NOT NULL DEFAULT '',
  status                reservation_status NOT NULL DEFAULT 'pending',
  total_price           NUMERIC(12, 2) NOT NULL,
  reservation_fee_paid  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method        TEXT,
  paymob_transaction_id TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at          TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ
);

CREATE INDEX idx_reservations_tenant ON reservations(tenant_id);
CREATE INDEX idx_reservations_customer ON reservations(customer_id);
CREATE INDEX idx_reservations_unit ON reservations(unit_id);
CREATE INDEX idx_reservations_agent ON reservations(agent_id);
CREATE INDEX idx_reservations_status ON reservations(status);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Policies in 00015_create_rls_policies.sql
