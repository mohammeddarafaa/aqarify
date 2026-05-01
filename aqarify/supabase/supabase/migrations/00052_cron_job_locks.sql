CREATE TABLE IF NOT EXISTS cron_job_locks (
  job_name TEXT PRIMARY KEY,
  locked_until TIMESTAMPTZ NOT NULL,
  locked_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
