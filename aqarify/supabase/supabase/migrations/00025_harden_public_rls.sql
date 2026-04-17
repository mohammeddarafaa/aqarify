-- Harden public tenant visibility and remove overlapping anon policies that
-- unintentionally widened data exposure.

-- tenants: anon can read only public/live tenants; authenticated access should
-- go through member/super_admin policies from 00015.
DROP POLICY IF EXISTS "public_read_live" ON tenants;
CREATE POLICY "public_read_live" ON tenants
  FOR SELECT TO anon
  USING (status IN ('active', 'read_only'));

-- units: keep anon visibility limited to available inventory only.
DROP POLICY IF EXISTS "public_read_available" ON units;
DROP POLICY IF EXISTS "units_anon_public_read" ON units;
CREATE POLICY "units_anon_public_read" ON units
  FOR SELECT TO anon
  USING (
    status = 'available'
    AND EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.id = units.tenant_id
        AND t.status IN ('active', 'read_only')
    )
  );

-- projects/buildings: keep one policy only to avoid permissive overlap.
DROP POLICY IF EXISTS "public_read_projects" ON projects;
DROP POLICY IF EXISTS "projects_anon_public_read" ON projects;
CREATE POLICY "projects_anon_public_read" ON projects
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.id = projects.tenant_id
        AND t.status IN ('active', 'read_only')
    )
  );

DROP POLICY IF EXISTS "public_read_buildings" ON buildings;
DROP POLICY IF EXISTS "buildings_anon_public_read" ON buildings;
CREATE POLICY "buildings_anon_public_read" ON buildings
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.id = buildings.tenant_id
        AND t.status IN ('active', 'read_only')
    )
  );
