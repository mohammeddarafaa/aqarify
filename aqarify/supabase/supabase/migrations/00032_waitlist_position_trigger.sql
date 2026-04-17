-- Atomic position: max among non-final rows per unit + tenant
CREATE OR REPLACE FUNCTION auto_position_waitlist()
RETURNS TRIGGER AS $$
BEGIN
  NEW.position := COALESCE(
    (
      SELECT MAX(position)
      FROM waiting_list
      WHERE unit_id = NEW.unit_id
        AND tenant_id = NEW.tenant_id
        AND status NOT IN ('cancelled', 'expired', 'removed', 'converted')
    ),
    0
  ) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_waitlist_position ON waiting_list;
CREATE TRIGGER set_waitlist_position
  BEFORE INSERT ON waiting_list
  FOR EACH ROW EXECUTE FUNCTION auto_position_waitlist();
