-- T2-C: Atomic cron lock via INSERT … ON CONFLICT DO UPDATE
-- Returns TRUE if the calling instance acquired the lock, FALSE otherwise.
-- Replaces the read-then-write pattern in cronLock.ts which had a TOCTOU race.

CREATE OR REPLACE FUNCTION acquire_cron_lock(
  p_job_name    TEXT,
  p_lock_seconds INT,
  p_instance_id TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_acquired BOOLEAN := FALSE;
  v_lock_until TIMESTAMPTZ := NOW() + (p_lock_seconds || ' seconds')::INTERVAL;
BEGIN
  INSERT INTO cron_job_locks (job_name, locked_until, locked_by, updated_at)
  VALUES (p_job_name, v_lock_until, p_instance_id, NOW())
  ON CONFLICT (job_name) DO UPDATE
    SET locked_until = v_lock_until,
        locked_by    = p_instance_id,
        updated_at   = NOW()
    WHERE cron_job_locks.locked_until < NOW(); -- only steal when expired

  -- FOUND is TRUE only when the ON CONFLICT branch ran (i.e. we won the lock)
  -- or when the INSERT ran (no prior row)
  GET DIAGNOSTICS v_acquired = ROW_COUNT;
  RETURN v_acquired > 0;
END;
$$;
