-- Aqarify SaaS subscription plans (Starter / Growth / Pro)
-- Prices are in EGP. Paid monthly or yearly via Paymob (master account).
-- Idempotent: safe if types/tables already exist (e.g. remote partially migrated).

DO $$ BEGIN
  CREATE TYPE plan_tier AS ENUM ('starter', 'growth', 'pro');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS subscription_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            plan_tier NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT,
  price_egp_monthly  NUMERIC(10,2) NOT NULL,
  price_egp_yearly   NUMERIC(10,2) NOT NULL,
  max_units       INTEGER NOT NULL,
  max_users       INTEGER NOT NULL,
  max_projects    INTEGER NOT NULL,
  -- Feature flags e.g. {"custom_domain": true, "white_label": false, "api_access": true}
  features        JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
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
