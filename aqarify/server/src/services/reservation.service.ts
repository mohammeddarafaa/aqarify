import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";
import { logActivity } from "./activityLog.service";
import { autoAssignAgent, createLeadFromCancelledReservation } from "./leadGeneration.service";
import { sendNotification } from "./notification.service";
import { generateReceiptPDF } from "./pdf.service";
import { emitDomainEvent } from "../events/domainEventBus";

// ─── T1-A: Atomic reservation via Postgres RPC ───────────────────────────────
// Replaces the two-step application-layer check + update that had a race
// condition.  The Postgres function `reserve_unit` (migration 00062) performs
// UPDATE units WHERE status = 'available' + INSERT reservations atomically.
// Two concurrent callers will result in exactly one success.
// ─────────────────────────────────────────────────────────────────────────────
export async function createReservation(params: {
  tenantId: string;
  unitId: string;
  customerId: string;
  totalPrice: number;
  reservationFee: number;
  paymentMethod: string;
  notes?: string;
}) {
  const { data, error } = await supabaseAdmin.rpc("reserve_unit", {
    p_tenant_id: params.tenantId,
    p_unit_id: params.unitId,
    p_customer_id: params.customerId,
    p_total_price: params.totalPrice,
    p_reservation_fee: params.reservationFee,
    p_payment_method: params.paymentMethod,
    p_notes: params.notes ?? null,
  });

  if (error) throw error;

  const result = Array.isArray(data) ? data[0] : data;

  if (!result?.success) {
    throw Object.assign(new Error("Unit not available"), { code: "UNIT_NOT_AVAILABLE" });
  }

  // Fetch the full reservation row so callers get the same shape as before
  const { data: reservation, error: fetchErr } = await supabaseAdmin
    .from("reservations")
    .select("*")
    .eq("id", result.reservation_id)
    .single();

  if (fetchErr || !reservation) throw fetchErr ?? new Error("Reservation not found after creation");

  return reservation;
}

export async function confirmReservation(reservationId: string, paymobTxId: string, feePaid: number) {
  const { count: existingPayments } = await supabaseAdmin
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("reservation_id", reservationId);

  const { data, error } = await supabaseAdmin
    .from("reservations")
    .update({
      status: "confirmed",
      paymob_transaction_id: paymobTxId,
      reservation_fee_paid: feePaid,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", reservationId)
    .eq("status", "pending")
    .select("*, units(price, down_payment_pct, installment_months, unit_number), users!customer_id(full_name, phone, email)")
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const { data: alreadyConfirmed, error: fetchErr } = await supabaseAdmin
      .from("reservations")
      .select("*, units(price, down_payment_pct, installment_months, unit_number), users!customer_id(full_name, phone, email)")
      .eq("id", reservationId)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!alreadyConfirmed) throw new Error("Reservation not found");
    logger.info(`Reservation ${reservationId} confirmation skipped (already processed)`);
    return alreadyConfirmed;
  }

  if (data) {
    const unit = (data as { units: { price: number; down_payment_pct: number; installment_months: number; unit_number: string } }).units;
    const customer = (data as { users: { full_name: string; phone: string; email: string } }).users;
    const downPayment = (unit.price * (unit.down_payment_pct ?? 10)) / 100;
    const remaining = unit.price - downPayment;
    const months = unit.installment_months ?? 48;
    const monthly = remaining / months;
    const today = new Date();

    const installments = Array.from({ length: months }, (_, i) => {
      const due = new Date(today);
      due.setMonth(due.getMonth() + i + 1);
      return {
        tenant_id: data.tenant_id, reservation_id: reservationId,
        customer_id: data.customer_id, type: "installment" as const,
        amount: monthly, due_date: due.toISOString().split("T")[0], status: "pending" as const,
      };
    });

    if ((existingPayments ?? 0) === 0) {
      await supabaseAdmin.from("payments").insert([
        {
          tenant_id: data.tenant_id, reservation_id: reservationId,
          customer_id: data.customer_id, type: "reservation_fee",
          amount: feePaid, due_date: today.toISOString().split("T")[0],
          status: "paid", paid_at: today.toISOString(),
        },
        {
          tenant_id: data.tenant_id, reservation_id: reservationId,
          customer_id: data.customer_id, type: "down_payment",
          amount: downPayment, due_date: today.toISOString().split("T")[0], status: "pending",
        },
        ...installments,
      ]);
    } else {
      logger.info(`Skipping payment schedule generation for ${reservationId}; payments already exist`);
    }

    // Auto-assign agent
    await autoAssignAgent(data.tenant_id, reservationId);

    // Send confirmation notification
    if (customer) {
      await sendNotification({
        tenantId: data.tenant_id,
        userId: data.customer_id,
        type: "reservation_confirmed",
        title: "تم تأكيد الحجز!",
        body: `تم تأكيد حجزك للوحدة ${unit.unit_number}. رقم التأكيد: ${data.confirmation_number ?? reservationId}`,
        phone: customer.phone,
        email: customer.email,
        channels: ["in_app", "sms", "email"],
      });
    }

    // Generate receipt PDF async
    if (customer) {
      const { data: tenant } = await supabaseAdmin.from("tenants")
        .select("name").eq("id", data.tenant_id).single();
      generateReceiptPDF({
        confirmationNumber: data.confirmation_number ?? reservationId,
        tenantName: tenant?.name ?? "Aqarify",
        customerName: customer.full_name,
        unitNumber: unit.unit_number,
        totalPrice: unit.price,
        amountPaid: feePaid,
        paymentType: "Reservation Fee",
        paymentMethod: data.payment_method ?? "card",
        transactionId: paymobTxId,
        date: new Date().toLocaleDateString("ar-EG"),
      }, data.tenant_id, reservationId).then(async (receiptStoragePath) => {
        if (receiptStoragePath) {
          await supabaseAdmin.from("reservations")
            .update({ receipt_url: receiptStoragePath } as object).eq("id", reservationId);
        }
      });
    }
  }

  logger.info(`Reservation ${reservationId} confirmed`);
  await logActivity({
    tenantId: data!.tenant_id as string,
    userId: null,
    action: "reservation.confirmed",
    entityType: "reservation",
    entityId: reservationId,
    details: { source: "payment", paymob_transaction_id: paymobTxId, reservation_fee_paid: feePaid },
  });
  await emitDomainEvent({
    tenantId: data?.tenant_id,
    eventType: "reservation.confirmed",
    aggregateType: "reservation",
    aggregateId: reservationId,
    payload: { reservation_id: reservationId, paymob_tx_id: paymobTxId, fee_paid: feePaid },
  });
  return data;
}

export async function cancelReservation(
  reservationId: string,
  tenantId: string,
  reason?: string,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("reservations")
    .update({ status: "cancelled", ...(reason ? { notes: reason } : {}) })
    .eq("id", reservationId)
    .eq("tenant_id", tenantId)
    .in("status", ["pending", "confirmed"])
    .select("unit_id, customer_id, users!customer_id(full_name, phone, email)")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw Object.assign(new Error("Reservation not found or already terminal"), { status: 404 });

  // Free up the unit
  await supabaseAdmin
    .from("units")
    .update({ status: "available" })
    .eq("id", data.unit_id)
    .eq("tenant_id", tenantId);

  await logActivity({
    tenantId,
    userId: null,
    action: "reservation.cancelled",
    entityType: "reservation",
    entityId: reservationId,
    details: { reason },
  });

  await emitDomainEvent({
    tenantId,
    eventType: "reservation.cancelled",
    aggregateType: "reservation",
    aggregateId: reservationId,
    payload: { reservation_id: reservationId, unit_id: data.unit_id, reason },
  });
}

/**
 * Confirmed reservations should always have a payment schedule. If status was
 * set to `confirmed` without running `confirmReservation` (seed, SQL, legacy
 * path), inserts the same rows so customers see مدفوعاتي.
 */
export async function backfillMissingPaymentSchedulesForCustomer(
  customerId: string,
  tenantId: string,
): Promise<void> {
  const { data: reservations, error: listErr } = await supabaseAdmin
    .from("reservations")
    .select("id")
    .eq("customer_id", customerId)
    .eq("tenant_id", tenantId)
    .eq("status", "confirmed");

  if (listErr || !reservations?.length) return;

  for (const row of reservations) {
    await ensurePaymentScheduleForReservationIfMissing(row.id);
  }
}

async function ensurePaymentScheduleForReservationIfMissing(reservationId: string): Promise<void> {
  const { count, error: countErr } = await supabaseAdmin
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("reservation_id", reservationId);

  if (countErr) return;
  if ((count ?? 0) > 0) return;

  const { data: res, error: fetchErr } = await supabaseAdmin
    .from("reservations")
    .select("*, units(price, down_payment_pct, installment_months, unit_number)")
    .eq("id", reservationId)
    .maybeSingle();

  if (fetchErr || !res) return;

  const unit = res.units as { price: number; down_payment_pct: number; installment_months: number; unit_number: string };
  const downPayment = (unit.price * (unit.down_payment_pct ?? 10)) / 100;
  const remaining = unit.price - downPayment;
  const months = unit.installment_months ?? 48;
  const monthly = remaining / months;
  const today = new Date();

  await supabaseAdmin.from("payments").insert([
    {
      tenant_id: res.tenant_id, reservation_id: reservationId,
      customer_id: res.customer_id, type: "down_payment",
      amount: downPayment, due_date: today.toISOString().split("T")[0], status: "pending",
    },
    ...Array.from({ length: months }, (_, i) => {
      const due = new Date(today);
      due.setMonth(due.getMonth() + i + 1);
      return {
        tenant_id: res.tenant_id, reservation_id: reservationId,
        customer_id: res.customer_id, type: "installment" as const,
        amount: monthly, due_date: due.toISOString().split("T")[0], status: "pending" as const,
      };
    }),
  ]);
}
