import cron from "node-cron";
import { supabaseAdmin } from "../config/supabase";
import { sendNotification } from "../services/notification.service";
import { logger } from "../utils/logger";

async function runSubscriptionExpiry() {
  const now = new Date().toISOString();

  // Find subscriptions whose period has ended
  const { data: expired } = await supabaseAdmin
    .from("tenant_subscriptions")
    .select("id, tenant_id, cancel_at_period_end")
    .eq("status", "active")
    .lt("current_period_end", now);

  if (!expired?.length) {
    logger.info("Subscription expiry cron: no lapses");
    return;
  }

  for (const sub of expired) {
    const newStatus = sub.cancel_at_period_end ? "cancelled" : "expired";

    await supabaseAdmin
      .from("tenant_subscriptions")
      .update({ status: newStatus, updated_at: now })
      .eq("id", sub.id);

    await supabaseAdmin
      .from("tenants")
      .update({ status: "read_only" })
      .eq("id", sub.tenant_id);

    const { data: admins } = await supabaseAdmin
      .from("users")
      .select("id, email, phone")
      .eq("tenant_id", sub.tenant_id)
      .in("role", ["admin", "super_admin"]);

    for (const admin of admins ?? []) {
      await sendNotification({
        tenantId: sub.tenant_id,
        userId: admin.id,
        type: "subscription_expired",
        title: "Subscription expired",
        body: "Your Aqarify subscription has lapsed. Your portal is now in read-only mode. Please renew to continue.",
        email: admin.email,
        phone: admin.phone,
        channels: ["in_app", "email"],
      });
    }

    logger.info(`Flipped tenant ${sub.tenant_id} to read_only (sub ${sub.id} -> ${newStatus})`);
  }
}

export function startSubscriptionExpiryCron() {
  cron.schedule("0 3 * * *", async () => {
    logger.info("Running subscription expiry cron...");
    await runSubscriptionExpiry();
  });
  logger.info("Subscription expiry cron scheduled (daily 3AM)");
}
