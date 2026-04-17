ALTER TABLE tenant_subscriptions
  ADD COLUMN IF NOT EXISTS billing_currency TEXT NOT NULL DEFAULT 'EGP';
