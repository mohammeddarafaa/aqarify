import { Router, type Request, type Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { confirmReservation } from "../services/reservation.service";
import { activateSubscription } from "../services/subscription.service";
import { verifyPaymobHmac } from "../utils/hmac";
import { logger } from "../utils/logger";

export const webhookRoutes = Router();

webhookRoutes.post("/paymob/callback", async (req: Request, res: Response) => {
  try {
    const hmac = req.query.hmac as string;
    const secret = process.env.PAYMOB_HMAC_SECRET ?? "";
    const payload = req.body?.obj ?? req.body;

    if (!verifyPaymobHmac(payload, hmac, secret)) {
      logger.warn("Paymob HMAC mismatch");
      return res.status(401).json({ error: "invalid hmac" });
    }

    if (!payload.success) return res.json({ received: true });

    const orderId: string = String(payload.merchant_order_id ?? payload.order?.id ?? "");
    const txId = String(payload.id);
    const amountCents = Number(payload.amount_cents ?? 0);

    // Find reservation by ID
    const { data: reservation } = await supabaseAdmin.from("reservations")
      .select("id, status").eq("id", orderId).single();

    if (!reservation || reservation.status !== "pending") {
      return res.json({ received: true });
    }

    await confirmReservation(reservation.id, txId, amountCents / 100);
    logger.info(`Webhook confirmed reservation ${reservation.id}`);
    return res.json({ received: true });
  } catch (err) {
    logger.error("Webhook error", err);
    return res.status(500).json({ error: "webhook failed" });
  }
});

// Aqarify SaaS subscription webhook (separate Paymob account)
webhookRoutes.post("/paymob/platform", async (req: Request, res: Response) => {
  try {
    const hmac = req.query.hmac as string;
    const secret = process.env.AQARIFY_PAYMOB_HMAC_SECRET ?? "";
    const payload = req.body?.obj ?? req.body;

    if (!verifyPaymobHmac(payload, hmac, secret)) {
      logger.warn("Platform Paymob HMAC mismatch");
      return res.status(401).json({ error: "invalid hmac" });
    }

    if (!payload.success) {
      logger.info("Platform payment failed, tenant not activated");
      return res.json({ received: true });
    }

    const subscriptionId: string = String(
      payload.merchant_order_id ?? payload.order?.id ?? ""
    );
    const txId = String(payload.id);
    const amountEgp = Number(payload.amount_cents ?? 0) / 100;

    if (!subscriptionId) {
      logger.warn("Platform webhook missing merchant_order_id");
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
