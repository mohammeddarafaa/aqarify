-- Per-tenant Paymob HMAC for transaction webhooks (encrypted at rest, like API key)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS paymob_hmac_secret_enc TEXT;

COMMENT ON COLUMN tenants.paymob_hmac_secret_enc IS 'AES-GCM encrypted Paymob HMAC secret for /webhooks/paymob/callback verification';
