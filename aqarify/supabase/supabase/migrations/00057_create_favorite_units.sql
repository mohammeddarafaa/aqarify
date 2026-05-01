CREATE TABLE favorite_units (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id     UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id, unit_id)
);

CREATE INDEX idx_favorite_units_user ON favorite_units(user_id, created_at DESC);
CREATE INDEX idx_favorite_units_tenant ON favorite_units(tenant_id);
CREATE INDEX idx_favorite_units_unit ON favorite_units(unit_id);

ALTER TABLE favorite_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorite_units_owner_read" ON favorite_units
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND tenant_id = current_tenant_id());

CREATE POLICY "favorite_units_owner_insert" ON favorite_units
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND tenant_id = current_tenant_id());

CREATE POLICY "favorite_units_owner_delete" ON favorite_units
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND tenant_id = current_tenant_id());
