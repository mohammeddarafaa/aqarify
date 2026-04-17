CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE SET NULL,
  role        user_role NOT NULL DEFAULT 'customer',
  full_name   TEXT NOT NULL,
  phone       TEXT,
  email       TEXT NOT NULL,
  national_id TEXT,
  avatar_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY "own_profile" ON users
  FOR ALL TO authenticated
  USING (id = auth.uid());

-- Managers and admins can read users in their tenant
CREATE POLICY "tenant_managers_read" ON users
  FOR SELECT TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid()
      AND u.role IN ('manager', 'admin', 'super_admin')
    )
  );

-- Super admins can read all
CREATE POLICY "super_admin_all" ON users
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Trigger to auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
