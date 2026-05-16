-- T1-A: Atomic unit reservation function
-- Performs UPDATE + INSERT in a single DB round-trip so concurrent callers
-- cannot both pass the availability check.  Returns success flag + new reservation id.

CREATE OR REPLACE FUNCTION reserve_unit(
  p_tenant_id       UUID,
  p_unit_id         UUID,
  p_customer_id     UUID,
  p_total_price     NUMERIC,
  p_reservation_fee NUMERIC,
  p_payment_method  TEXT,
  p_notes           TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, reservation_id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated   INT;
  v_res_id    UUID;
BEGIN
  -- Atomically claim the unit; fails gracefully if already reserved/sold
  UPDATE units
  SET    status     = 'reserved',
         updated_at = NOW()
  WHERE  id        = p_unit_id
    AND  tenant_id = p_tenant_id
    AND  status    = 'available';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN QUERY SELECT FALSE, NULL::UUID;
    RETURN;
  END IF;

  -- Unit is ours; insert the reservation row
  INSERT INTO reservations (
    tenant_id, unit_id, customer_id, status,
    total_price, reservation_fee_paid, payment_method, notes
  ) VALUES (
    p_tenant_id, p_unit_id, p_customer_id, 'pending',
    p_total_price, 0, p_payment_method, p_notes
  )
  RETURNING id INTO v_res_id;

  RETURN QUERY SELECT TRUE, v_res_id;
END;
$$;
