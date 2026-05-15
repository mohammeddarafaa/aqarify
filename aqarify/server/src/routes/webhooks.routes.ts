import { Router, type Request, type Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { activateSubscription } from "../services/subscription.service";
import { verifyPaymobHmac } from "../utils/hmac";
import { logger } from "../utils/logger";
import { handlePaymobTenantCallback } from "../services/paymobTenantWebhook.handler";

export const webhookRoutes = Router();

/**
 * Paymob tenant webhook — delegates to {@link handlePaymobTenantCallback}.
 * Other PSPs: add routes like `/webhooks/konnect/callback` with their own handlers.
 */
webhookRoutes.post("/paymob/callback", async (req: Request, res: Response) => {
  try {
    await handlePaymobTenantCallback(req, res);
  } catch (err) {
    logger.error("Webhook error", err);
    if (!res.headersSent) res.status(500).json({ error: "webhook failed" });
  }
});

webhookRoutes.post("/paymob/platform", async (req: Request, res: Response) => {
  try {
    const hmac = String((req.query as { hmac?: string }).hmac ?? "");
    const secret = process.env.AQARIFY_PAYMOB_HMAC_SECRET ?? "";
    const payload = (req.body as { obj?: Record<string, unknown> })?.obj ?? (req.body as Record<string, unknown>);

    if (!secret || !verifyPaymobHmac(payload as Record<string, unknown>, hmac, secret)) {
      logger.warn("Platform Paymob HMAC mismatch — ignoring request");
      return res.status(200).json({ received: true });
    }

    if (!payload.success) {
      logger.info("Platform payment failed, tenant not activated");
      return res.json({ received: true });
    }

    const subscriptionId: string = String(
      payload.merchant_order_id ?? (payload.order as { id?: string })?.id ?? "",
    );
    const txId = String(payload.id ?? "");
    const amountEgp = Number(payload.amount_cents ?? 0) / 100;
    const eventKey = `platform:${txId}:${subscriptionId}:${String(payload.success ?? false)}`;

    const { error: eventErr } = await supabaseAdmin.from("webhook_events").insert({
      provider: "paymob_platform",
      event_key: eventKey,
      payload,
    });
    if (eventErr && eventErr.code === "23505") {
      logger.info(`Duplicate platform webhook ignored: ${eventKey}`);
      return res.json({ received: true });
    }
    if (eventErr) {
      logger.error("Platform webhook_events insert", eventErr);
      return res.status(500).json({ error: "platform webhook failed" });
    }

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
