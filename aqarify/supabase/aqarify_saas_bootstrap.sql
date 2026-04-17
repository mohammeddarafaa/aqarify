-- =============================================================
-- AQARIFY SAAS BOOTSTRAP
-- =============================================================
-- Paste this whole file into the Supabase SQL Editor and run it
-- once to apply migrations 00020–00024 and seed the 3 SaaS plans.
--
-- Safe to re-run: every block is IF NOT EXISTS / ON CONFLICT.
-- Requires the base schema (migrations 00001–00019) to be in place.
-- =============================================================

-- -------------------------------------------------------------
-- 1) Subscription plan enums (00020)
-- -------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE plan_tier AS ENUM ('starter', 'growth', 'pro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -------------------------------------------------------------
-- 2) subscription_plans table + RLS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code               plan_tier NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  description        TEXT,
  price_egp_monthly  NUMERIC(10,2) NOT NULL,
  price_egp_yearly   NUMERIC(10,2) NOT NULL,
  max_units          INTEGER NOT NULL,
  max_users          INTEGER NOT NULL,
  max_projects       INTEGER NOT NULL,
  features           JSONB NOT NULL DEFAULT '{}',
  is_active          BOOLEAN NOT NULL DEFAULT true,
  sort_order         INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans_public_read" ON subscription_plans;
CREATE POLICY "plans_public_read" ON subscription_plans
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "plans_super_admin_all" ON subscription_plans;
CREATE POLICY "plans_super_admin_all" ON subscription_plans
  FOR ALL TO authenticated
  USING (has_role('super_admin'));

-- -------------------------------------------------------------
-- 3) tenant_subscriptions (00021)
-- -------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'pending_payment', 'active', 'past_due', 'expired', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
CREATE INDEX IF NOT EXISTS idx_tenant_sub_period_end
  ON tenant_subscriptions(current_period_end) WHERE status = 'active';
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

-- -------------------------------------------------------------
-- 4) platform_payments (00022)
-- -------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE platform_payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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

-- -------------------------------------------------------------
-- 5) Extend tenant_status with read_only + pending_signup (00023)
-- -------------------------------------------------------------
-- NOTE: ALTER TYPE ... ADD VALUE cannot be used in the same transaction
-- it was added in. Supabase SQL Editor wraps everything in one transaction,
-- so the policies in section 6 compare status::text (not the enum literal)
-- to avoid needing the new values parsed at policy-creation time.
ALTER TYPE tenant_status ADD VALUE IF NOT EXISTS 'read_only';
ALTER TYPE tenant_status ADD VALUE IF NOT EXISTS 'pending_signup';

-- -------------------------------------------------------------
-- 6) Tightened public-read policies (00024)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "public_read_active" ON tenants;
DROP POLICY IF EXISTS "public_read_live" ON tenants;
CREATE POLICY "public_read_live" ON tenants
  FOR SELECT TO anon
  USING (status::text IN ('active', 'read_only'));

DROP POLICY IF EXISTS "public_read_available" ON units;
DROP POLICY IF EXISTS "units_anon_public_read" ON units;
CREATE POLICY "units_anon_public_read" ON units
  FOR SELECT TO anon
  USING (
    status = 'available'
    AND EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.id = units.tenant_id AND t.status::text IN ('active', 'read_only')
    )
  );

DROP POLICY IF EXISTS "public_read_projects" ON projects;
DROP POLICY IF EXISTS "projects_anon_public_read" ON projects;
CREATE POLICY "projects_anon_public_read" ON projects
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM tenants t
    WHERE t.id = projects.tenant_id AND t.status::text IN ('active', 'read_only')
  ));

DROP POLICY IF EXISTS "public_read_buildings" ON buildings;
DROP POLICY IF EXISTS "buildings_anon_public_read" ON buildings;
CREATE POLICY "buildings_anon_public_read" ON buildings
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM tenants t
    WHERE t.id = buildings.tenant_id AND t.status::text IN ('active', 'read_only')
  ));

-- -------------------------------------------------------------
-- 7) Seed the 3 public plans (idempotent)
-- -------------------------------------------------------------
INSERT INTO subscription_plans
  (id, code, name, description, price_egp_monthly, price_egp_yearly, max_units, max_users, max_projects, features, sort_order)
VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'starter', 'Starter',
   'For a single project getting started with online sales.',
    2500.00, 25000.00, 50, 3, 1,
   '{"custom_domain": false, "white_label": false, "api_access": false, "priority_support": false, "reports": true, "map_view": true}'::jsonb, 1),
  ('00000000-0000-0000-0000-0000000000a2', 'growth', 'Growth',
   'For developers with multiple projects and a sales team.',
    6500.00, 65000.00, 500, 15, 5,
   '{"custom_domain": true, "white_label": false, "api_access": true, "priority_support": true, "reports": true, "map_view": true}'::jsonb, 2),
  ('00000000-0000-0000-0000-0000000000a3', 'pro', 'Pro',
   'Unlimited units, white-label, and an API for your stack.',
   14000.00, 140000.00, 99999, 99999, 99999,
   '{"custom_domain": true, "white_label": true, "api_access": true, "priority_support": true, "reports": true, "map_view": true}'::jsonb, 3)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_egp_monthly = EXCLUDED.price_egp_monthly,
  price_egp_yearly = EXCLUDED.price_egp_yearly,
  max_units = EXCLUDED.max_units,
  max_users = EXCLUDED.max_users,
  max_projects = EXCLUDED.max_projects,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

-- Done. Reload the marketing site — /api/v1/plans will now return the 3 plans,
-- and POST /api/v1/signup will stop returning 404 PLAN_NOT_FOUND.
