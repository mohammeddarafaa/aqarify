-- Links a tenant to a plan, with billing period and status
-- When the active subscription expires, the tenant is flipped to 'read_only'
-- (see migration 00023) and writes are blocked by subscriptionGuard middleware.
-- Idempotent: safe if type/table/indexes already exist.

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'pending_payment',
    'active',
    'past_due',
    'expired',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id              UUID NOT NULL REFERENCES subscription_plans(id),
  status               subscription_status NOT NULL DEFAULT 'pending_payment',
  billing_cycle        billing_cycle NOT NULL DEFAULT 'monthly',
  amount_egp           NUMERIC(10,2) NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  paymob_order_id      TEXT,
  paymob_payment_key   TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_sub_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_sub_status ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tenant_sub_period_end ON tenant_subscriptions(current_period_end) WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS uniq_tenant_active_sub
  ON tenant_subscriptions(tenant_id)
  WHERE status IN ('active', 'past_due');

ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_sub_members_read" ON tenant_subscriptions;
CREATE POLICY "tenant_sub_members_read" ON tenant_subscriptions
  FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS "tenant_sub_admin_manage" ON tenant_subscriptions;
CREATE POLICY "tenant_sub_admin_manage" ON tenant_subscriptions
  FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id() AND has_role('admin', 'super_admin'));

DROP POLICY IF EXISTS "tenant_sub_super_admin_all" ON tenant_subscriptions;
CREATE POLICY "tenant_sub_super_admin_all" ON tenant_subscriptions
  FOR ALL TO authenticated
  USING (has_role('super_admin'));
