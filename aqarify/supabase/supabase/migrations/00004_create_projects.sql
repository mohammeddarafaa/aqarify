CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  location_lat  NUMERIC(10, 7),
  location_lng  NUMERIC(10, 7),
  address       TEXT,
  total_units   INTEGER DEFAULT 0,
  -- [{"icon":"wifi","label":"High Speed Internet"}]
  amenities     JSONB DEFAULT '[]',
  cover_image_url TEXT,
  -- ["url1","url2"]
  gallery       JSONB DEFAULT '[]',
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE buildings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  number        TEXT,
  total_floors  INTEGER DEFAULT 0,
  total_units   INTEGER DEFAULT 0,
  location_lat  NUMERIC(10, 7),
  location_lng  NUMERIC(10, 7),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_tenant ON projects(tenant_id);
CREATE INDEX idx_buildings_tenant ON buildings(tenant_id);
CREATE INDEX idx_buildings_project ON buildings(project_id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

-- Public: anyone can read projects from active tenants
CREATE POLICY "public_read_projects" ON projects
  FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM tenants WHERE id = projects.tenant_id AND status = 'active'));

CREATE POLICY "public_read_buildings" ON buildings
  FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM tenants WHERE id = buildings.tenant_id AND status = 'active'));

-- Policies referencing users table are in 00015_create_rls_policies.sql
