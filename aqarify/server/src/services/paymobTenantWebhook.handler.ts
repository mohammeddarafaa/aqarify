import type { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { confirmReservation } from "./reservation.service";
import { logActivity } from "./activityLog.service";
import { verifyPaymobHmac, decrypt } from "../utils/hmac";
import { logger } from "../utils/logger";

async function resolveTenantPaymobHmacSecret(tenantId: string): Promise<string> {
  const envFallback = process.env.PAYMOB_HMAC_SECRET ?? "";
  const { data: tenant } = await supabaseAdmin
    .from("tenants")
    .select("paymob_hmac_secret_enc")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant?.paymob_hmac_secret_enc) return envFallback;
  try {
    return decrypt(tenant.paymob_hmac_secret_enc);
  } catch (err) {
    logger.warn("Failed to decrypt tenant Paymob HMAC; falling back to env", err);
    return envFallback;
  }
}

/**
 * Paymob tenant webhook: reservations + installment payments.
 * Mounted at POST /webhooks/paymob/callback — swap PSP by adding sibling routes that delegate here or to other handlers.
 */
export async function handlePaymobTenantCallback(req: Request, res: Response): Promise<void> {
  const hmac = String((req.query as { hmac?: string }).hmac ?? "");
  const payload = (req.body as { obj?: Record<string, unknown> })?.obj ?? (req.body as Record<string, unknown>);
  const orderId = String(payload.merchant_order_id ?? (payload.order as { id?: string })?.id ?? "");
  const txId = String(payload.id ?? "");
  const success = Boolean(payload.success);

  if (!orderId || !txId) {
    logger.warn("Paymob webhook missing merchant_order_id or transaction id");
    res.json({ received: true });
    return;
  }

  const eventKey = `paymob:${txId}:${orderId}:${success}`;
  const amountCents = Number(payload.amount_cents ?? 0);

  const { data: reservation } = await supabaseAdmin
    .from("reservations")
    .select("id, status, tenant_id")
    .eq("id", orderId)
    .maybeSingle();

  if (reservation) {
    const secret = await resolveTenantPaymobHmacSecret(reservation.tenant_id);
    if (!secret || !verifyPaymobHmac(payload as Record<string, unknown>, hmac, secret)) {
      logger.warn("Paymob HMAC mismatch — ignoring reservation callback");
      res.json({ received: true });
      return;
    }

    const { error: eventErr } = await supabaseAdmin.from("webhook_events").insert({
      provider: "paymob",
      event_key: eventKey,
      tenant_id: reservation.tenant_id,
      payload,
    });
    if (eventErr && eventErr.code === "23505") {
      logger.info(`Duplicate Paymob webhook ignored: ${eventKey}`);
      res.json({ received: true });
      return;
    }
    if (eventErr) {
      logger.error("webhook_events insert failed", eventErr);
      res.status(500).json({ error: "webhook failed" });
      return;
    }

    if (!success) {
      res.json({ received: true });
      return;
    }

    if (reservation.status !== "pending") {
      logger.info(`Webhook skipped: reservation ${reservation.id} already ${reservation.status}`);
      res.json({ received: true });
      return;
    }

    await confirmReservation(reservation.id, txId, amountCents / 100);
    logger.info(`Webhook confirmed reservation ${reservation.id}`);
    res.json({ received: true });
    return;
  }

  const { data: installment } = await supabaseAdmin
    .from("payments")
    .select("id, status, tenant_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!installment) {
    res.json({ received: true });
    return;
  }

  const secret = await resolveTenantPaymobHmacSecret(installment.tenant_id);
  if (!secret || !verifyPaymobHmac(payload as Record<string, unknown>, hmac, secret)) {
    logger.warn("Paymob HMAC mismatch — ignoring installment callback");
    res.json({ received: true });
    return;
  }

  const { error: eventErr } = await supabaseAdmin.from("webhook_events").insert({
    provider: "paymob",
    event_key: eventKey,
    tenant_id: installment.tenant_id,
    payload,
  });
  if (eventErr && eventErr.code === "23505") {
    logger.info(`Duplicate Paymob webhook ignored: ${eventKey}`);
    res.json({ received: true });
    return;
  }
  if (eventErr) {
    logger.error("webhook_events insert failed", eventErr);
    res.status(500).json({ error: "webhook failed" });
    return;
  }

  if (!success) {
    res.json({ received: true });
    return;
  }

  if (!["pending", "overdue"].includes(installment.status)) {
    logger.info(`Webhook skipped: installment ${installment.id} already ${installment.status}`);
    res.json({ received: true });
    return;
  }

  const { data: updated } = await supabaseAdmin
    .from("payments")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      paymob_transaction_id: txId,
    })
    .eq("id", installment.id)
    .in("status", ["pending", "overdue"])
    .select("id")
    .maybeSingle();

  if (updated) {
    logger.info(`Webhook confirmed installment payment ${installment.id}`);
    await logActivity({
      tenantId: installment.tenant_id,
      userId: null,
      action: "payment.paid",
      entityType: "payment",
      entityId: installment.id,
      details: { source: "paymob_webhook", transaction_id: txId },
    });
  } else {
    logger.info(`Webhook no-op: installment ${installment.id} concurrently updated`);
  }

  res.json({ received: true });
}
