-- Update unit status when reservation is confirmed
CREATE OR REPLACE FUNCTION update_unit_status_on_reservation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    UPDATE units SET status = 'reserved' WHERE id = NEW.unit_id;
  ELSIF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    UPDATE units SET status = 'available' WHERE id = NEW.unit_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_reservation_status_change
  AFTER UPDATE OF status ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_unit_status_on_reservation();

-- Log reservation changes to activity_logs
CREATE OR REPLACE FUNCTION log_reservation_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (tenant_id, user_id, action, entity_type, entity_id, details)
  VALUES (
    NEW.tenant_id,
    auth.uid(),
    TG_OP || '_RESERVATION',
    'reservation',
    NEW.id,
    jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'confirmation_number', NEW.confirmation_number
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_reservation_changes
  AFTER UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION log_reservation_activity();

-- Auto-update payment status to overdue
CREATE OR REPLACE FUNCTION mark_overdue_payments()
RETURNS VOID AS $$
  UPDATE payments
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
$$ LANGUAGE sql SECURITY DEFINER;
