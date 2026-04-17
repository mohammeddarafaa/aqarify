-- Platform-level payments for Aqarify SaaS subscriptions
-- Distinct from the per-tenant `payments` table (which tracks tenant customers'
-- reservation / installment payments on their own Paymob account).
-- Idempotent: safe if type/table already exist.

DO $$ BEGIN
  CREATE TYPE platform_payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS platform_payments (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_subscription_id UUID NOT NULL REFERENCES tenant_subscriptions(id) ON DELETE CASCADE,
  tenant_id              UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount_egp             NUMERIC(10,2) NOT NULL,
  currency               TEXT NOT NULL DEFAULT 'EGP',
  status                 platform_payment_status NOT NULL DEFAULT 'pending',
  paymob_order_id        TEXT,
  paymob_transaction_id  TEXT UNIQUE,
  hmac_verified_at       TIMESTAMPTZ,
  paid_at                TIMESTAMPTZ,
  raw_webhook            JSONB,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_pay_sub ON platform_payments(tenant_subscription_id);
CREATE INDEX IF NOT EXISTS idx_platform_pay_tenant ON platform_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_platform_pay_status ON platform_payments(status);

ALTER TABLE platform_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_pay_admin_read" ON platform_payments;
CREATE POLICY "platform_pay_admin_read" ON platform_payments
  FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id() AND has_role('admin', 'super_admin'));

DROP POLICY IF EXISTS "platform_pay_super_admin_all" ON platform_payments;
CREATE POLICY "platform_pay_super_admin_all" ON platform_payments
  FOR ALL TO authenticated
  USING (has_role('super_admin'));
