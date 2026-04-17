ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS payment_gateway TEXT NOT NULL DEFAULT 'paymob';

COMMENT ON COLUMN tenants.payment_gateway IS 'paymob | cmi | konnect | efawateer | manual — non-paymob routes use manual/bank until integrated.';
