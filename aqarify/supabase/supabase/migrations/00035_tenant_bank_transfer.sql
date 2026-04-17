-- Optional bank transfer instructions shown to customers after choosing bank transfer
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS bank_account_holder TEXT;

COMMENT ON COLUMN tenants.bank_name IS 'Bank name for customer wire transfers';
COMMENT ON COLUMN tenants.bank_account_number IS 'Account or IBAN for transfers';
COMMENT ON COLUMN tenants.bank_account_holder IS 'Beneficiary name as on bank records';
