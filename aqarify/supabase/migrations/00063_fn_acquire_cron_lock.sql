-- 00063_fn_acquire_cron_lock.sql
-- Atomic cron lock RPC
CREATE OR REPLACE FUNCTION public.acquire_cron_lock(
  p_job_name    TEXT,
  p_lock_seconds INT,
  p_instance_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
BEGIN
  INSERT INTO cron_job_locks (job_name, locked_until, locked_by, updated_at)
  VALUES (p_job_name, v_now + (p_lock_seconds || ' seconds')::interval, p_instance_id, v_now)
  ON CONFLICT (job_name) DO UPDATE
    SET locked_until = v_now + (p_lock_seconds || ' seconds')::interval,
        locked_by    = p_instance_id,
        updated_at   = v_now
    WHERE cron_job_locks.locked_until < v_now;

  RETURN FOUND;
END;
$$;
