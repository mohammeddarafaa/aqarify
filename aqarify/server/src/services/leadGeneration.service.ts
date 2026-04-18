import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";

export async function createLeadFromCancelledReservation(reservationId: string): Promise<void> {
  try {
    const { data: res } = await supabaseAdmin.from("reservations")
      .select("*, users!customer_id(full_name, phone, email), units(type, price)")
      .eq("id", reservationId).single();

    if (!res) return;

    const existing = await supabaseAdmin.from("potential_customers")
      .select("id").eq("source_reservation_id", reservationId).maybeSingle();
    if (existing.data) return; // Already exists

    const customer = res.users as { full_name: string; phone: string; email: string };
    const unit = res.units as { type: string; price: number };

    await supabaseAdmin.from("potential_customers").insert({
      tenant_id: res.tenant_id,
      customer_id: res.customer_id,
      name: customer.full_name,
      phone: customer.phone,
      email: customer.email,
      source: "reservation_cancelled",
      source_reservation_id: reservationId,
      interested_unit_types: [unit.type],
      budget_min: Math.round(unit.price * 0.85),
      budget_max: Math.round(unit.price * 1.15),
      negotiation_status: "new",
    });

    logger.info(`Lead created from cancelled reservation ${reservationId}`);
  } catch (err) {
    logger.error("Lead from reservation error", err);
  }
}

export async function createLeadFromExpiredWaitlist(waitlistId: string): Promise<void> {
  try {
    const { data: entry } = await supabaseAdmin.from("waiting_list")
      .select("*, users!customer_id(full_name, phone, email), units(type, price)")
      .eq("id", waitlistId).single();

    if (!entry) return;

    const existing = await supabaseAdmin.from("potential_customers")
      .select("id").eq("customer_id", entry.customer_id).eq("source", "waitlist_expired").maybeSingle();
    if (existing.data) return;

    const customer = entry.users as { full_name: string; phone: string; email: string };
    const unit = entry.units as { type: string; price: number } | null;

    await supabaseAdmin.from("potential_customers").insert({
      tenant_id: entry.tenant_id,
      customer_id: entry.customer_id,
      name: customer.full_name,
      phone: customer.phone,
      email: customer.email,
      source: "waitlist_expired",
      source_waitlist_id: waitlistId,
      interested_unit_types: unit ? [unit.type] : [],
      budget_min: unit ? Math.round(unit.price * 0.8) : null,
      budget_max: unit ? Math.round(unit.price * 1.2) : null,
      negotiation_status: "new",
    });

    logger.info(`Lead created from expired waitlist ${waitlistId}`);
  } catch (err) {
    logger.error("Lead from waitlist error", err);
  }
}

export async function autoAssignAgent(tenantId: string, reservationId: string): Promise<void> {
  try {
    const { data: agents } = await supabaseAdmin.from("users")
      .select("id").eq("tenant_id", tenantId).eq("role", "agent").eq("is_active", true);

    if (!agents || agents.length === 0) return;

    // Count current assignments to find least-loaded agent
    const counts = await Promise.all(agents.map(async (a) => {
      const { count } = await supabaseAdmin.from("reservations")
        .select("*", { count: "exact", head: true })
        .eq("agent_id", a.id).eq("tenant_id", tenantId).in("status", ["confirmed", "pending"]);
      return { id: a.id, count: count ?? 0 };
    }));

    counts.sort((a, b) => a.count - b.count);
    const assignedAgent = counts[0];

    await supabaseAdmin.from("reservations")
      .update({ agent_id: assignedAgent.id }).eq("id", reservationId);

    logger.info(`Assigned agent ${assignedAgent.id} to reservation ${reservationId}`);
  } catch (err) {
    logger.error("Auto-assign agent error", err);
  }
}
