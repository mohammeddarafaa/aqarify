import cron from "node-cron";
import { supabaseAdmin } from "../config/supabase";
import { sendNotification } from "../services/notification.service";
import { logger } from "../utils/logger";
import { withCronLock } from "./cronLock";

async function runPaymentReminders() {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const scenarios = [
    { due_date: in7Days, label: "7 days before", title: "تذكير بموعد دفع قادم", body: (amount: number, date: string) => `لديك دفعة بقيمة ${amount.toLocaleString("ar-EG")} ج.م مستحقة في ${date}` },
    { due_date: tomorrow, label: "1 day before", title: "غداً موعد دفع", body: (amount: number, date: string) => `تذكير: لديك دفعة بقيمة ${amount.toLocaleString("ar-EG")} ج.م مستحقة غداً ${date}` },
    { due_date: today, label: "due today", title: "دفعة مستحقة اليوم", body: (amount: number) => `دفعتك بقيمة ${amount.toLocaleString("ar-EG")} ج.م مستحقة اليوم. يرجى السداد الآن.` },
    { due_date: yesterday, label: "1 day overdue", title: "دفعة متأخرة!", body: (amount: number) => `دفعتك بقيمة ${amount.toLocaleString("ar-EG")} ج.م متأخرة. يرجى التواصل معنا.`, markOverdue: true },
  ];

  for (const scenario of scenarios) {
    const { data: payments } = await supabaseAdmin.from("payments")
      .select("*, users!customer_id(id, full_name, phone, email)")
      .eq("due_date", scenario.due_date).eq("status", "pending");

    if (!payments?.length) continue;

    if (scenario.markOverdue) {
      const ids = payments.map((p) => p.id);
      await supabaseAdmin.from("payments").update({ status: "overdue" }).in("id", ids);
    }

    for (const payment of payments) {
      const user = payment.users as { id: string; full_name: string; phone: string; email: string };
      await sendNotification({
        tenantId: payment.tenant_id,
        userId: user.id,
        type: scenario.markOverdue ? "payment_overdue" : "payment_due",
        title: scenario.title,
        body: scenario.body(payment.amount, payment.due_date),
        phone: user.phone,
        email: user.email,
        channels: ["in_app", "sms", "email"],
      });
    }

    logger.info(`Payment reminders sent (${scenario.label}): ${payments.length} payments`);
  }
}

export function startPaymentReminderCron() {
  // Run every day at 9 AM
  cron.schedule("0 9 * * *", async () => {
    logger.info("Running payment reminder cron...");
    await withCronLock("payment_reminders", 20 * 60, runPaymentReminders);
  });
  logger.info("Payment reminder cron scheduled (daily 9AM)");
}
