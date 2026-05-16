-- 00062_fn_reserve_unit.sql
-- Atomic reservation RPC: reserves a unit and inserts a reservation row in one atomic operation
CREATE OR REPLACE FUNCTION public.reserve_unit(
  p_tenant_id     UUID,
  p_unit_id       UUID,
  p_customer_id   UUID,
  p_total_price   NUMERIC,
  p_reservation_fee NUMERIC,
  p_payment_method TEXT,
  p_notes         TEXT DEFAULT NULL
)
RETURNS TABLE (
  reservation_id  UUID,
  confirmation_no TEXT,
  success         BOOLEAN,
  error_code      TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reservation_id UUID;
  v_confirmation TEXT;
BEGIN
  -- Attempt to atomically flip unit status from 'available' to 'reserved'
  UPDATE public.units
    SET status = 'reserved'
  WHERE id = p_unit_id
    AND tenant_id = p_tenant_id
    AND status = 'available'
  RETURNING id INTO v_reservation_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, FALSE, 'UNIT_NOT_AVAILABLE';
    RETURN;
  END IF;

  -- Generate a lightweight confirmation string
  v_confirmation := 'RES-' || upper(substr(p_unit_id::text, 1, 6));

  INSERT INTO public.reservations (
    tenant_id, unit_id, customer_id, confirmation_number,
    status, total_price, reservation_fee_paid, payment_method, notes, created_at
  ) VALUES (
    p_tenant_id, p_unit_id, p_customer_id, v_confirmation,
    'pending', p_total_price, 0, p_payment_method, p_notes, now()
  )
  RETURNING id INTO v_reservation_id;

  RETURN QUERY SELECT v_reservation_id, v_confirmation, TRUE, NULL::TEXT;
END;
$$;
