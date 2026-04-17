-- Auto-assign waitlist position
CREATE OR REPLACE FUNCTION auto_position_waitlist()
RETURNS TRIGGER AS $$
DECLARE
  next_pos INTEGER;
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1
  INTO next_pos
  FROM waiting_list
  WHERE unit_id = NEW.unit_id AND status IN ('active', 'notified');

  NEW.position := next_pos;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_waitlist_position
  BEFORE INSERT ON waiting_list
  FOR EACH ROW EXECUTE FUNCTION auto_position_waitlist();

-- Generate unique confirmation number
CREATE OR REPLACE FUNCTION generate_confirmation_number()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'AQ-';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate confirmation number on reservation
CREATE OR REPLACE FUNCTION set_confirmation_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_number IS NULL OR NEW.confirmation_number = '' THEN
    LOOP
      NEW.confirmation_number := generate_confirmation_number();
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM reservations WHERE confirmation_number = NEW.confirmation_number
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_confirmation_number
  BEFORE INSERT ON reservations
  FOR EACH ROW EXECUTE FUNCTION set_confirmation_number();
