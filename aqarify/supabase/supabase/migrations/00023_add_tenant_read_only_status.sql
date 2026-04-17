-- Extend tenant_status with 'read_only' (subscription expired)
-- and 'pending_signup' (tenant row exists but hasn't paid yet).
--
-- read_only behaviour:
--   - Public pages still render (customers can still see the portal)
--   - All write operations are blocked by subscriptionGuard middleware
--   - An in-app banner informs visitors the portal is paused
--
-- pending_signup behaviour:
--   - Tenant is not resolvable via /tenants/by-slug (filtered to 'active' only)
--   - Becomes 'active' after Paymob webhook confirms initial payment

ALTER TYPE tenant_status ADD VALUE IF NOT EXISTS 'read_only';
ALTER TYPE tenant_status ADD VALUE IF NOT EXISTS 'pending_signup';
