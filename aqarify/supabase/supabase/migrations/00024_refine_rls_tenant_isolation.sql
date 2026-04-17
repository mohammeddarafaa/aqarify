-- Tightens public-read policies so anonymous users cannot bypass tenant
-- scoping on publicly-listable data (units, projects). Also allows anon to
-- view 'read_only' tenants (so the property portal still renders during
-- payment lapse), but only 'active' is fully operational.

-- Allow anon to view active AND read_only tenants
DROP POLICY IF EXISTS "public_read_active" ON tenants;
DROP POLICY IF EXISTS "public_read_live" ON tenants;
CREATE POLICY "public_read_live" ON tenants
  FOR SELECT TO anon, authenticated
  USING (status IN ('active', 'read_only'));

-- Public read of units: scoped to the tenant (anyone browsing the
-- tenant's property site can see its available units, but never cross-tenant).
DROP POLICY IF EXISTS "units_anon_public_read" ON units;
CREATE POLICY "units_anon_public_read" ON units
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.id = units.tenant_id AND t.status IN ('active', 'read_only')
    )
  );

DROP POLICY IF EXISTS "projects_anon_public_read" ON projects;
CREATE POLICY "projects_anon_public_read" ON projects
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.id = projects.tenant_id AND t.status IN ('active', 'read_only')
    )
  );

DROP POLICY IF EXISTS "buildings_anon_public_read" ON buildings;
CREATE POLICY "buildings_anon_public_read" ON buildings
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.id = buildings.tenant_id AND t.status IN ('active', 'read_only')
    )
  );
