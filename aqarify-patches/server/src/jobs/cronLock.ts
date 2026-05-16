import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";

const INSTANCE_ID =
  process.env.CRON_INSTANCE_ID ?? process.env.HOSTNAME ?? `pid-${process.pid}`;

/**
 * Acquires a distributed cron lock via an atomic Postgres RPC
 * (`acquire_cron_lock` — see migration 00063).
 *
 * The RPC does INSERT … ON CONFLICT DO UPDATE WHERE locked_until < NOW(),
 * which is a single atomic statement.  Two replicas racing simultaneously
 * will result in exactly one winner and one loser — no TOCTOU race.
 *
 * Returns `true` if `run` was executed, `false` if the lock was held elsewhere.
 */
export async function withCronLock(
  jobName: string,
  lockSeconds: number,
  run: () => Promise<void>,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("acquire_cron_lock", {
    p_job_name: jobName,
    p_lock_seconds: lockSeconds,
    p_instance_id: INSTANCE_ID,
  });

  if (error) {
    logger.error(`withCronLock: RPC error for ${jobName}`, error);
    return false;
  }

  if (!data) {
    // Another instance holds the lock
    return false;
  }

  try {
    await run();
    return true;
  } catch (err) {
    logger.error(`withCronLock: job ${jobName} threw`, err);
    return false;
  } finally {
    // Release early so the next window starts fresh
    await supabaseAdmin
      .from("cron_job_locks")
      .update({
        locked_until: new Date(0).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("job_name", jobName)
      .eq("locked_by", INSTANCE_ID);
  }
}
