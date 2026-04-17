CREATE TABLE follow_ups (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  potential_customer_id UUID REFERENCES potential_customers(id) ON DELETE SET NULL,
  type                  followup_type NOT NULL DEFAULT 'call',
  scheduled_at          TIMESTAMPTZ NOT NULL,
  completed_at          TIMESTAMPTZ,
  notes                 TEXT,
  outcome               TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_followups_tenant ON follow_ups(tenant_id);
CREATE INDEX idx_followups_agent ON follow_ups(agent_id);
CREATE INDEX idx_followups_scheduled ON follow_ups(scheduled_at) WHERE completed_at IS NULL;

ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

-- Policies in 00015_create_rls_policies.sql
