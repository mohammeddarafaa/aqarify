import { supabaseAdmin } from "../config/supabase";

const INSTANCE_ID = process.env.CRON_INSTANCE_ID ?? process.env.HOSTNAME ?? "unknown";

export async function withCronLock(jobName: string, lockSeconds: number, run: () => Promise<void>): Promise<boolean> {
  const now = new Date();
  const lockUntil = new Date(now.getTime() + lockSeconds * 1000).toISOString();

  const { data: current } = await supabaseAdmin
    .from("cron_job_locks")
    .select("job_name, locked_until")
    .eq("job_name", jobName)
    .maybeSingle();

  if (current?.locked_until && new Date(current.locked_until).getTime() > now.getTime()) {
    return false;
  }

  const { error } = await supabaseAdmin
    .from("cron_job_locks")
    .upsert({
      job_name: jobName,
      locked_until: lockUntil,
      locked_by: INSTANCE_ID,
      updated_at: now.toISOString(),
    });

  if (error) return false;

  try {
    await run();
    return true;
  } finally {
    await supabaseAdmin
      .from("cron_job_locks")
      .update({ locked_until: new Date(0).toISOString(), updated_at: new Date().toISOString() })
      .eq("job_name", jobName)
      .eq("locked_by", INSTANCE_ID);
  }
}
