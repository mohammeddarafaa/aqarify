CREATE TABLE payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reservation_id        UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  customer_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  type                  payment_type NOT NULL,
  amount                NUMERIC(12, 2) NOT NULL,
  due_date              DATE NOT NULL,
  status                payment_status NOT NULL DEFAULT 'pending',
  paymob_transaction_id TEXT,
  paid_at               TIMESTAMPTZ,
  receipt_url           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_reservation ON payments(reservation_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date) WHERE status IN ('pending', 'overdue');

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies in 00015_create_rls_policies.sql
