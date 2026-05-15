-- Wizard progress + completion (tenant is already active after platform billing; onboarding completes first-run setup)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS onboarding_progress JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.tenants.onboarding_progress IS 'Steps completed in admin onboarding wizard (company, branding, payments, etc.).';
COMMENT ON COLUMN public.tenants.onboarding_completed_at IS 'When first-run onboarding finished; NULL means wizard still due.';

-- Workspaces that already existed before this migration are considered onboarded.
UPDATE public.tenants SET onboarding_completed_at = now() WHERE onboarding_completed_at IS NULL;
