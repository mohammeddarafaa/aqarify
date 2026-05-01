import cron from "node-cron";
import { supabaseAdmin } from "../config/supabase";
import { sendNotification } from "../services/notification.service";
import { createLeadFromExpiredWaitlist } from "../services/leadGeneration.service";
import { logger } from "../utils/logger";
import { withCronLock } from "./cronLock";

async function processExpiredWaitlistEntries() {
  const now = new Date().toISOString();

  // Find expired "notified" entries
  const { data: expired } = await supabaseAdmin.from("waiting_list")
    .select("*, units(id, status, unit_number), users!customer_id(id, full_name, phone, email)")
    .eq("status", "notified").lt("expires_at", now);

  for (const entry of expired ?? []) {
    // Mark as expired
    await supabaseAdmin.from("waiting_list").update({ status: "expired" }).eq("id", entry.id);

    // Create lead from expired waitlist
    await createLeadFromExpiredWaitlist(entry.id);

    const user = entry.users as { id: string; full_name: string; phone: string; email: string };

    // Notify expired user
    await sendNotification({
      tenantId: entry.tenant_id,
      userId: user.id,
      type: "waitlist_expired",
      title: "انتهى وقت الحجز",
      body: `للأسف، انتهى وقت حجزك لوحدة ${(entry.units as { unit_number: string })?.unit_number}. سيتم إخطار الشخص التالي في القائمة.`,
      phone: user.phone,
      email: user.email,
      channels: ["in_app", "sms"],
    });

    // Find next waiting person for this unit
    const { data: next } = await supabaseAdmin.from("waiting_list")
      .select("*, users!customer_id(id, full_name, phone, email)")
      .eq("unit_id", entry.unit_id).eq("tenant_id", entry.tenant_id)
      .eq("status", "waiting").order("position", { ascending: true }).limit(1).maybeSingle();

    if (next) {
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin.from("waiting_list")
        .update({ status: "notified", notified_at: now, expires_at: expires }).eq("id", next.id);

      const nextUser = next.users as { id: string; full_name: string; phone: string; email: string };
      await sendNotification({
        tenantId: next.tenant_id,
        userId: nextUser.id,
        type: "waitlist_notified",
        title: "🎉 الوحدة متاحة الآن!",
        body: `لديك 24 ساعة لحجز الوحدة. اضغط لإتمام الحجز الآن.`,
        phone: nextUser.phone,
        email: nextUser.email,
        channels: ["in_app", "sms", "email"],
      });
    } else {
      // No one else waiting — unit is free
      await supabaseAdmin.from("units")
        .update({ status: "available" }).eq("id", entry.unit_id);
    }
  }

  if ((expired ?? []).length > 0) {
    logger.info(`Processed ${(expired ?? []).length} expired waitlist entries`);
  }
}

export function startWaitlistTimerCron() {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    await withCronLock("waitlist_timer", 55, processExpiredWaitlistEntries);
  });
  logger.info("Waitlist timer cron scheduled (every minute)");
}
