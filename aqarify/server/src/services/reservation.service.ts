import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";
import { autoAssignAgent, createLeadFromCancelledReservation } from "./leadGeneration.service";
import { sendNotification } from "./notification.service";
import { generateReceiptPDF } from "./pdf.service";
import { emitDomainEvent } from "../events/domainEventBus";

export async function createReservation(params: {
  tenantId: string;
  unitId: string;
  customerId: string;
  totalPrice: number;
  reservationFee: number;
  paymentMethod: string;
  notes?: string;
}) {
  const { data: lockedUnit, error: lockError } = await supabaseAdmin
    .from("units")
    .update({ status: "reserved" })
    .eq("id", params.unitId)
    .eq("tenant_id", params.tenantId)
    .eq("status", "available")
    .select("id")
    .maybeSingle();

  if (lockError) throw lockError;
  if (!lockedUnit) {
    throw Object.assign(new Error("Unit not available"), { code: "UNIT_NOT_AVAILABLE" });
  }

  const { data, error } = await supabaseAdmin.from("reservations").insert({
    tenant_id: params.tenantId,
    unit_id: params.unitId,
    customer_id: params.customerId,
    status: "pending",
    total_price: params.totalPrice,
    reservation_fee_paid: 0,
    payment_method: params.paymentMethod,
    notes: params.notes,
  }).select().single();

  if (error) {
    await supabaseAdmin.from("units")
      .update({ status: "available" })
      .eq("id", params.unitId)
      .eq("tenant_id", params.tenantId)
      .eq("status", "reserved");
    throw error;
  }

  return data;
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
  await emitDomainEvent({
    tenantId: data?.tenant_id,
    eventType: "reservation.confirmed",
    aggregateType: "reservation",
    aggregateId: reservationId,
    payload: { reservation_id: reservationId, paymob_tx_id: paymobTxId, fee_paid: feePaid },
  });
  return data;
}

export async function cancelReservation(reservationId: string, tenantId: string, cancelledBy: string) {
  const { data } = await supabaseAdmin.from("reservations")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", reservationId).eq("tenant_id", tenantId)
    .select("customer_id, unit_id").single();

  if (data) {
    // Free the unit
    await supabaseAdmin.from("units")
      .update({ status: "available" }).eq("id", data.unit_id);

    // Auto-create lead from cancelled reservation
    await createLeadFromCancelledReservation(reservationId);

    // Notify first waitlist person
    const { data: nextWaiting } = await supabaseAdmin.from("waiting_list")
      .select("*, users!customer_id(id, full_name, phone, email)")
      .eq("unit_id", data.unit_id).eq("tenant_id", tenantId)
      .eq("status", "waiting").order("position", { ascending: true }).limit(1).maybeSingle();

    if (nextWaiting) {
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin.from("waiting_list")
        .update({ status: "notified", notified_at: new Date().toISOString(), expires_at: expires })
        .eq("id", nextWaiting.id);

      const user = nextWaiting.users as { id: string; full_name: string; phone: string; email: string };
      await sendNotification({
        tenantId,
        userId: user.id,
        type: "waitlist_notified",
        title: "🎉 الوحدة متاحة!",
        body: "لديك 24 ساعة لحجز الوحدة التي كنت في قائمة انتظارها!",
        phone: user.phone,
        email: user.email,
        channels: ["in_app", "sms", "email"],
      });
    }
  }

  logger.info(`Reservation ${reservationId} cancelled by ${cancelledBy}`);
  await emitDomainEvent({
    tenantId,
    eventType: "reservation.cancelled",
    aggregateType: "reservation",
    aggregateId: reservationId,
    payload: { reservation_id: reservationId, cancelled_by: cancelledBy },
  });
  return data;
}
