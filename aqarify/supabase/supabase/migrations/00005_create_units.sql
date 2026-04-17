CREATE TABLE units (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  building_id         UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_number         TEXT NOT NULL,
  floor               INTEGER NOT NULL DEFAULT 0,
  type                TEXT NOT NULL DEFAULT 'apartment',
  bedrooms            INTEGER NOT NULL DEFAULT 1,
  bathrooms           INTEGER NOT NULL DEFAULT 1,
  balconies           INTEGER NOT NULL DEFAULT 0,
  size_sqm            NUMERIC(8, 2) NOT NULL,
  view_type           TEXT,
  finishing           TEXT,
  has_garden          BOOLEAN NOT NULL DEFAULT false,
  garden_size         NUMERIC(8, 2),
  price               NUMERIC(12, 2) NOT NULL,
  reservation_fee     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  down_payment_pct    NUMERIC(5, 2) NOT NULL DEFAULT 10,
  installment_months  INTEGER NOT NULL DEFAULT 60,
  status              unit_status NOT NULL DEFAULT 'available',
  -- ["url1","url2"]
  gallery             JSONB DEFAULT '[]',
  floor_plan_url      TEXT,
  virtual_tour_url    TEXT,
  -- {"direction":"north","garden_type":"private"}
  custom_attributes   JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_units_tenant ON units(tenant_id);
CREATE INDEX idx_units_project ON units(project_id);
CREATE INDEX idx_units_building ON units(building_id);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_units_price ON units(price);
CREATE INDEX idx_units_bedrooms ON units(bedrooms);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- Public: read available units from active tenants
CREATE POLICY "public_read_available" ON units
  FOR SELECT TO anon
  USING (
    status = 'available'
    AND EXISTS (SELECT 1 FROM tenants WHERE id = units.tenant_id AND status = 'active')
  );

-- Policies referencing users table are in 00015_create_rls_policies.sql
