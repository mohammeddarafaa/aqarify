import { Router, type Request, type Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { confirmReservation } from "../services/reservation.service";
import { activateSubscription } from "../services/subscription.service";
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

export const webhookRoutes = Router();

webhookRoutes.post("/paymob/callback", async (req: Request, res: Response) => {
  try {
    const hmac = req.query.hmac as string;
    const payload = req.body?.obj ?? req.body;

    const orderId: string = String(payload.merchant_order_id ?? payload.order?.id ?? "");
    const txId = String(payload.id);
    const amountCents = Number(payload.amount_cents ?? 0);

    const { data: reservation } = await supabaseAdmin
      .from("reservations")
      .select("id, status, tenant_id")
      .eq("id", orderId)
      .maybeSingle();

    if (reservation) {
      const secret = await resolveTenantPaymobHmacSecret(reservation.tenant_id);
      if (!verifyPaymobHmac(payload, hmac, secret)) {
        logger.warn("Paymob HMAC mismatch — ignoring request");
        return res.status(200).json({ received: true });
      }

      if (!payload.success) return res.json({ received: true });

      if (reservation.status !== "pending") {
        logger.info(`Webhook skipped: reservation ${reservation.id} already ${reservation.status}`);
        return res.json({ received: true });
      }
      await confirmReservation(reservation.id, txId, amountCents / 100);
      logger.info(`Webhook confirmed reservation ${reservation.id}`);
      return res.json({ received: true });
    }

    const { data: installment } = await supabaseAdmin
      .from("payments")
      .select("id, status, tenant_id")
      .eq("id", orderId)
      .maybeSingle();

    if (installment) {
      const secret = await resolveTenantPaymobHmacSecret(installment.tenant_id);
      if (!verifyPaymobHmac(payload, hmac, secret)) {
        logger.warn("Paymob HMAC mismatch (installment) — ignoring request");
        return res.status(200).json({ received: true });
      }

      if (!payload.success) return res.json({ received: true });
    }

    if (installment && ["pending", "overdue"].includes(installment.status)) {
      const { data: updated } = await supabaseAdmin
        .from("payments")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          paymob_transaction_id: txId,
        })
        .eq("id", installment.id)
        .eq("status", installment.status)
        .select("id")
        .maybeSingle();

      if (updated) {
        logger.info(`Webhook confirmed installment payment ${installment.id}`);
      } else {
        logger.info(`Webhook skipped: installment ${installment.id} already updated`);
      }
      return res.json({ received: true });
    }

    return res.json({ received: true });
  } catch (err) {
    logger.error("Webhook error", err);
    return res.status(500).json({ error: "webhook failed" });
  }
});

webhookRoutes.post("/paymob/platform", async (req: Request, res: Response) => {
  try {
    const hmac = req.query.hmac as string;
    const secret = process.env.AQARIFY_PAYMOB_HMAC_SECRET ?? "";
    const payload = req.body?.obj ?? req.body;

    if (!verifyPaymobHmac(payload, hmac, secret)) {
      logger.warn("Platform Paymob HMAC mismatch — ignoring request");
      return res.status(200).json({ received: true });
    }

    if (!payload.success) {
      logger.info("Platform payment failed, tenant not activated");
      return res.json({ received: true });
    }

    const subscriptionId: string = String(
      payload.merchant_order_id ?? payload.order?.id ?? "",
    );
    const txId = String(payload.id);
    const amountEgp = Number(payload.amount_cents ?? 0) / 100;

    if (!subscriptionId) {
      logger.warn("Platform webhook missing merchant_order_id");
      return res.json({ received: true });
    }

    const { data: sub } = await supabaseAdmin
      .from("tenant_subscriptions")
      .select("id, status")
      .eq("id", subscriptionId)
      .maybeSingle();

    if (sub && sub.status !== "pending_payment") {
      logger.info(`Platform webhook skipped: subscription ${subscriptionId} already ${sub.status}`);
      return res.json({ received: true });
    }

    await activateSubscription(subscriptionId, txId, amountEgp);
    logger.info(`Platform webhook activated subscription ${subscriptionId}`);
    return res.json({ received: true });
  } catch (err) {
    logger.error("Platform webhook error", err);
    return res.status(500).json({ error: "platform webhook failed" });
  }
});
