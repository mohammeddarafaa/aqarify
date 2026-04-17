-- Additional performance indexes beyond per-table indexes

-- Full-text search on units
CREATE INDEX idx_units_fts ON units
  USING gin(to_tsvector('arabic', unit_number || ' ' || COALESCE(type, '') || ' ' || COALESCE(view_type, '')));

-- Composite for waitlist cascade query
CREATE INDEX idx_waitlist_cascade ON waiting_list(unit_id, position)
  WHERE status = 'active';

-- Reservation confirmation lookup
CREATE UNIQUE INDEX idx_reservations_confirmation ON reservations(confirmation_number);

-- Potential customers next followup scheduling
CREATE INDEX idx_leads_next_followup ON potential_customers(next_followup_at)
  WHERE negotiation_status NOT IN ('accepted', 'rejected', 'lost');

-- Notifications unread per user
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- Activity logs per entity
CREATE INDEX idx_activity_entity_time ON activity_logs(entity_type, entity_id, created_at DESC);

-- Payments due soon (for cron reminders)
CREATE INDEX idx_payments_upcoming ON payments(due_date, tenant_id)
  WHERE status = 'pending';
