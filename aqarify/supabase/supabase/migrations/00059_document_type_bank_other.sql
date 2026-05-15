-- Align DB document_type with API/UI (bank receipts + misc uploads)
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'bank_receipt';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'other';
