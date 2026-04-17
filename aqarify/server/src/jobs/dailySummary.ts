import cron from "node-cron";
import { supabaseAdmin } from "../config/supabase";
import { sendNotification } from "../services/notification.service";
import { logger } from "../utils/logger";

async function sendDailySummaries() {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const { data: tenants } = await supabaseAdmin.from("tenants").select("id, name").eq("status", "active");

  for (const tenant of tenants ?? []) {
    const [reservations, payments, leads] = await Promise.all([
      supabaseAdmin.from("reservations")
        .select("status", { count: "exact" }).eq("tenant_id", tenant.id)
        .gte("created_at", `${yesterday}T00:00:00`).lte("created_at", `${yesterday}T23:59:59`),
      supabaseAdmin.from("payments")
        .select("amount").eq("tenant_id", tenant.id).eq("status", "paid")
        .gte("paid_at", `${yesterday}T00:00:00`).lte("paid_at", `${yesterday}T23:59:59`),
      supabaseAdmin.from("potential_customers")
        .select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id)
        .gte("created_at", `${yesterday}T00:00:00`).lte("created_at", `${yesterday}T23:59:59`),
    ]);

    const revenue = (payments.data ?? []).reduce((s, p) => s + p.amount, 0);
    const body = `أمس: ${reservations.count ?? 0} حجز جديد | ${revenue.toLocaleString("ar-EG")} ج.م إيرادات | ${leads.count ?? 0} عميل محتمل`;

    // Notify all managers
    const { data: managers } = await supabaseAdmin.from("users")
      .select("id, email").eq("tenant_id", tenant.id).in("role", ["manager", "admin"]);

    for (const manager of managers ?? []) {
      await sendNotification({
        tenantId: tenant.id,
        userId: manager.id,
        type: "daily_summary",
        title: `ملخص يوم ${yesterday}`,
        body,
        email: manager.email,
        channels: ["in_app", "email"],
      });
    }
  }

  logger.info(`Daily summary sent to ${(tenants ?? []).length} tenants`);
}

export function startDailySummaryCron() {
  // Run every day at 9 AM
  cron.schedule("0 9 * * *", async () => {
    logger.info("Running daily summary cron...");
    await sendDailySummaries();
  });
  logger.info("Daily summary cron scheduled (daily 9AM)");
}
