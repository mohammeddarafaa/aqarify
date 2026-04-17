-- Enums for the Aqarify platform
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'manager', 'agent', 'customer');
CREATE TYPE unit_status AS ENUM ('available', 'reserved', 'sold');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'expired');
CREATE TYPE payment_type AS ENUM ('reservation_fee', 'down_payment', 'installment');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'failed');
CREATE TYPE waitlist_status AS ENUM ('active', 'notified', 'converted', 'expired', 'removed');
CREATE TYPE document_type AS ENUM ('national_id', 'proof_of_address', 'contract', 'receipt');
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE notification_channel AS ENUM ('sms', 'email', 'push', 'in_app');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'read');
CREATE TYPE negotiation_status AS ENUM ('new', 'contacted', 'negotiating', 'offer_made', 'accepted', 'rejected', 'lost');
CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'countered');
CREATE TYPE followup_type AS ENUM ('call', 'visit', 'message', 'email');
CREATE TYPE lead_source AS ENUM ('reservation_cancelled', 'waitlist_expired', 'inquiry', 'referral');
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'trial');
