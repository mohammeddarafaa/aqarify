CREATE POLICY "units_customer_own_reserved" ON units
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.unit_id = units.id
        AND r.customer_id = auth.uid()
        AND r.status IN ('pending', 'confirmed')
    )
  );
