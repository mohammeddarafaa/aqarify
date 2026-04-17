-- All cross-table RLS policies consolidated here (after all tables exist)

-- Helper functions
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_role(VARIADIC roles user_role[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = ANY(roles));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- TENANTS
-- ============================================================
CREATE POLICY "tenants_super_admin_all" ON tenants
  FOR ALL TO authenticated
  USING (has_role('super_admin'));

CREATE POLICY "tenants_members_read" ON tenants
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND tenant_id = tenants.id));

-- ============================================================
-- USERS
-- ============================================================
CREATE POLICY "users_own_profile" ON users
  FOR ALL TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_tenant_managers_read" ON users
  FOR SELECT TO authenticated
  USING (
    tenant_id = current_tenant_id()
    AND has_role('manager', 'admin', 'super_admin')
  );

CREATE POLICY "users_super_admin_all" ON users
  FOR ALL TO authenticated
  USING (has_role('super_admin'));

-- ============================================================
-- PROJECTS & BUILDINGS
-- ============================================================
CREATE POLICY "projects_tenant_members_read" ON projects
  FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id());

CREATE POLICY "projects_managers_manage" ON projects
  FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id() AND has_role('manager', 'admin', 'super_admin'));

CREATE POLICY "buildings_tenant_members_read" ON buildings
  FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id());

CREATE POLICY "buildings_managers_manage" ON buildings
  FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id() AND has_role('manager', 'admin', 'super_admin'));

-- ============================================================
-- UNITS
-- ============================================================
CREATE POLICY "units_tenant_members_read" ON units
  FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id());

CREATE POLICY "units_managers_manage" ON units
  FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id() AND has_role('manager', 'admin', 'super_admin'));

-- ============================================================
-- RESERVATIONS
-- ============================================================
CREATE POLICY "reservations_customer_own" ON reservations
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "reservations_agent_read" ON reservations
  FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id() AND has_role('agent', 'manager', 'admin', 'super_admin'));

CREATE POLICY "reservations_customer_create" ON reservations
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid() AND tenant_id = current_tenant_id());

CREATE POLICY "reservations_managers_manage" ON reservations
  FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id() AND has_role('manager', 'admin', 'super_admin'));

-- ============================================================
-- WAITING LIST
-- ============================================================
CREATE POLICY "waitlist_customer_own" ON waiting_list
  FOR ALL TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "waitlist_managers_manage" ON waiting_list
  FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id() AND has_role('manager', 'admin', 'super_admin'));

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE POLICY "payments_customer_own" ON payments
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "payments_agent_read" ON payments
  FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id() AND has_role('agent', 'manager', 'admin', 'super_admin'));

CREATE POLICY "payments_managers_manage" ON payments
  FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id() AND has_role('manager', 'admin', 'super_admin'));

-- ============================================================
-- POTENTIAL CUSTOMERS
-- ============================================================
CREATE POLICY "leads_agent_own" ON potential_customers
  FOR ALL TO authenticated
  USING (assigned_agent_id = auth.uid() OR (tenant_id = current_tenant_id() AND has_role('manager', 'admin', 'super_admin')));

-- ============================================================
-- NEGOTIATIONS
-- ============================================================
CREATE POLICY "negotiations_agent_tenant" ON negotiations
  FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id() AND has_role('agent', 'manager', 'admin', 'super_admin'));

-- ============================================================
-- FOLLOW UPS
-- ============================================================
CREATE POLICY "followups_agent_own" ON follow_ups
  FOR ALL TO authenticated
  USING (agent_id = auth.uid() OR (tenant_id = current_tenant_id() AND has_role('manager', 'admin', 'super_admin')));

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE POLICY "notifications_user_own" ON notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_managers_read" ON notifications
  FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id() AND has_role('manager', 'admin', 'super_admin'));

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE POLICY "documents_customer_own" ON documents
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "documents_agent_read" ON documents
  FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id() AND has_role('agent', 'manager', 'admin', 'super_admin'));

CREATE POLICY "documents_agent_review" ON documents
  FOR UPDATE TO authenticated
  USING (tenant_id = current_tenant_id() AND has_role('agent', 'manager', 'admin', 'super_admin'));

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
CREATE POLICY "logs_managers_read" ON activity_logs
  FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id() AND has_role('manager', 'admin', 'super_admin'));

CREATE POLICY "logs_system_insert" ON activity_logs
  FOR INSERT TO service_role
  WITH CHECK (true);
