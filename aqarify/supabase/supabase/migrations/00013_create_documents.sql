CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reservation_id  UUID REFERENCES reservations(id) ON DELETE SET NULL,
  type            document_type NOT NULL,
  file_url        TEXT NOT NULL,
  status          document_status NOT NULL DEFAULT 'pending',
  reviewed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_reservation ON documents(reservation_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policies in 00015_create_rls_policies.sql
