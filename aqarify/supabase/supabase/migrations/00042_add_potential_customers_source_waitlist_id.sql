ALTER TABLE potential_customers
  ADD COLUMN IF NOT EXISTS source_waitlist_id UUID REFERENCES waiting_list(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pot_cust_waitlist ON potential_customers(source_waitlist_id);
