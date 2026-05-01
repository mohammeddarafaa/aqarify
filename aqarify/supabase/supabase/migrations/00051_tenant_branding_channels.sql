ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email_from_address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email_from_name TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS sms_sender_name TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS notification_templates JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS receipt_footer_text TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS receipt_primary_color TEXT;
