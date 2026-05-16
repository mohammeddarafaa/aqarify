import { onDomainEvent } from "./domainEventBus";
import { supabaseAdmin } from "../config/supabase";
import { sendNotification } from "../services/notification.service";
import { autoAssignAgent, createLeadFromCancelledReservation } from "../services/leadGeneration.service";
import { logger } from "../utils/logger";

let registered = false;

export function registerDomainHandlers() {
  if (registered) return;
  registered = true;

  // ─────────────────────────────────────────────────────────────────────────
  // reservation.confirmed
  // Triggered by: confirmReservation() after a successful Paymob webhook or
  // manual bank-transfer confirmation by an agent.
  //
  // Responsibilities:
  //  1. Auto-assign an agent if none is set (idempotent — autoAssignAgent
  //     skips when agent_id is already populated).
  //  2. Notify the assigned agent that a new deal landed on their queue.
  // ─────────────────────────────────────────────────────────────────────────
  onDomainEvent("reservation.confirmed", async (event) => {
    const reservationId = String(event.aggregate_id ?? event.payload?.reservation_id ?? "");
    const tenantId = event.tenant_id ?? String(event.payload?.tenant_id ?? "");
    if (!reservationId || !tenantId) return;

    logger.info(`[reservation.confirmed] reservationId=${reservationId}`);

    // 1 — ensure agent assignment
    await autoAssignAgent(tenantId, reservationId);

    // 2 — notify the now-assigned agent
    const { data: res } = await supabaseAdmin
      .from("reservations")
      .select("agent_id, customer_id, units(unit_number)")
      .eq("id", reservationId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!res?.agent_id) return;

    const { data: agent } = await supabaseAdmin
      .from("users")
      .select("id, full_name, phone, email")
      .eq("id", res.agent_id)
      .maybeSingle();

    if (!agent) return;

    const unitNumber = (res.units as { unit_number?: string } | null)?.unit_number ?? reservationId;

    await sendNotification({
      tenantId,
      userId: agent.id,
      type: "agent_assigned",
      title: "تم تعيينك لحجز جديد",
      body: `لديك حجز جديد مؤكّد للوحدة ${unitNumber}. يرجى التواصل مع العميل لإتمام الإجراءات.`,
      phone: agent.phone ?? undefined,
      email: agent.email ?? undefined,
      channels: ["in_app"],
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // reservation.cancelled
  // Triggered by: cancelReservation() from agent/manager routes.
  //
  // Responsibilities:
  //  1. Notify the customer their reservation was cancelled.
  //  2. Create a lead in potential_customers for sales follow-up.
  //  3. Notify the next person on the waitlist for this unit and open their
  //     24-hour reservation window.
  // ─────────────────────────────────────────────────────────────────────────
  onDomainEvent("reservation.cancelled", async (event) => {
    const reservationId = String(event.aggregate_id ?? event.payload?.reservation_id ?? "");
    const tenantId = event.tenant_id ?? String(event.payload?.tenant_id ?? "");
    if (!reservationId || !tenantId) return;

    logger.info(`[reservation.cancelled] reservationId=${reservationId}`);

    // 1 — fetch reservation + customer details
    const { data: res } = await supabaseAdmin
      .from("reservations")
      .select("customer_id, unit_id, units(unit_number), users!customer_id(full_name, phone, email)")
      .eq("id", reservationId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!res) return;

    const customer = res.users as { full_name?: string; phone?: string; email?: string } | null;
    const unitNumber = (res.units as { unit_number?: string } | null)?.unit_number ?? "";

    // 2 — notify customer
    if (res.customer_id) {
      await sendNotification({
        tenantId,
        userId: res.customer_id,
        type: "reservation_cancelled",
        title: "تم إلغاء حجزك",
        body: `نأسف لإخبارك أن حجزك للوحدة ${unitNumber} قد تم إلغاؤه. يمكنك تصفّح الوحدات المتاحة للحجز مجدداً.`,
        phone: customer?.phone ?? undefined,
        email: customer?.email ?? undefined,
        channels: ["in_app"],
      });
    }

    // 3 — upsert lead
    await createLeadFromCancelledReservation(reservationId);

    // 4 — notify next waitlist entry for this unit
    if (!res.unit_id) return;

    const { data: nextWaiting } = await supabaseAdmin
      .from("waiting_list")
      .select("id, customer_id, users!customer_id(full_name, phone, email)")
      .eq("unit_id", res.unit_id)
      .eq("tenant_id", tenantId)
      .eq("status", "waiting")
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!nextWaiting) return;

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from("waiting_list")
      .update({ status: "notified", expires_at: expiresAt })
      .eq("id", nextWaiting.id)
      .eq("tenant_id", tenantId);

    const waitlistUser = nextWaiting.users as { full_name?: string; phone?: string; email?: string } | null;

    await sendNotification({
      tenantId,
      userId: nextWaiting.customer_id,
      type: "waitlist_notified",
      title: "الوحدة التي تنتظرها أصبحت متاحة!",
      body: `أصبحت الوحدة ${unitNumber} متاحة للحجز. لديك 24 ساعة لإتمام الحجز قبل انتقال الدور للتالي.`,
      phone: waitlistUser?.phone ?? undefined,
      email: waitlistUser?.email ?? undefined,
      channels: ["in_app"],
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // waitlist.notified
  // Stub — SMS/email hooks go here post-launch (Releans / Resend).
  // In-app notification is already sent by the reservation.cancelled handler
  // above; this event is a hook for external channels.
  // ─────────────────────────────────────────────────────────────────────────
  onDomainEvent("waitlist.notified", async (event) => {
    logger.info(
      `[waitlist.notified] waitlistId=${event.aggregate_id} — external channels stub`,
    );
    // TODO post-launch: trigger SMS via Releans, email via Resend
  });
}
