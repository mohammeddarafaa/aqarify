import axios from "axios";
import { logger } from "../utils/logger";

const BASE = process.env.PAYMOB_BASE_URL ?? "https://accept.paymob.com/api";

/** Where the browser goes after Paymob finishes the card flow (success or decline). */
function platformPostCheckoutRedirectUrl(subscriptionId: string): string {
  const template = process.env.AQARIFY_PAYMOB_REDIRECT_URL;
  if (template?.trim()) {
    return template.replace(/\{subscription_id\}/g, subscriptionId);
  }
  const appUrl = (
    process.env.AQARIFY_APP_URL ??
    process.env.CLIENT_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${appUrl}/signup/complete?subscription_id=${encodeURIComponent(subscriptionId)}`;
}

export interface PlatformPaymentResult {
  paymentKey: string;
  paymobOrderId: string;
  iframeUrl: string;
  devBypass?: boolean;
}

// When true, signup skips the real Paymob call and returns a fake payment
// so the full SaaS flow can be exercised locally without master credentials.
// Triggered either by AQARIFY_DEV_BYPASS_PAYMENT=true, or automatically
// when NODE_ENV !== 'production' and the three Paymob env vars are missing.
export function isPlatformPaymentDevBypass(): boolean {
  if (process.env.AQARIFY_DEV_BYPASS_PAYMENT === "true") return true;
  const hasCreds =
    !!process.env.AQARIFY_PAYMOB_API_KEY &&
    !!process.env.AQARIFY_PAYMOB_INTEGRATION_ID &&
    !!process.env.AQARIFY_PAYMOB_IFRAME_ID;
  return !hasCreds && process.env.NODE_ENV !== "production";
}

// Creates a Paymob payment key against the Aqarify master account
// (for SaaS subscription charges — distinct from per-tenant paymob.service.ts).
export async function createPlatformPayment(params: {
  amountEGP: number;
  merchantOrderId: string;
  billingData: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
}): Promise<PlatformPaymentResult> {
  if (isPlatformPaymentDevBypass()) {
    logger.warn(
      `[dev-bypass] Skipping Paymob — subscription ${params.merchantOrderId} will be auto-activated.`,
    );
    const fake = `dev_${Date.now()}_${params.merchantOrderId.slice(0, 8)}`;
    const appUrl = process.env.AQARIFY_APP_URL ?? "http://localhost:3000";
    return {
      paymentKey: fake,
      paymobOrderId: fake,
      iframeUrl: `${appUrl}/signup/complete?subscription_id=${params.merchantOrderId}&dev=1`,
      devBypass: true,
    };
  }

  const apiKey = process.env.AQARIFY_PAYMOB_API_KEY;
  const integrationId = process.env.AQARIFY_PAYMOB_INTEGRATION_ID;
  const iframeId = process.env.AQARIFY_PAYMOB_IFRAME_ID;

  if (!apiKey || !integrationId || !iframeId) {
    throw new Error(
      "Aqarify platform Paymob credentials missing (AQARIFY_PAYMOB_API_KEY, AQARIFY_PAYMOB_INTEGRATION_ID, AQARIFY_PAYMOB_IFRAME_ID)",
    );
  }

  const amountCents = Math.round(params.amountEGP * 100);

  try {
    const authRes = await axios.post(`${BASE}/auth/tokens`, { api_key: apiKey });
    const token: string = authRes.data.token;

    const orderRes = await axios.post(`${BASE}/ecommerce/orders`, {
      auth_token: token,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: "EGP",
      merchant_order_id: params.merchantOrderId,
      items: [],
    });
    const paymobOrderId: string = String(orderRes.data.id);

    const redirectionUrl = platformPostCheckoutRedirectUrl(params.merchantOrderId);
    if (process.env.NODE_ENV !== "production") {
      logger.info(`[paymob-platform] redirection_url=${redirectionUrl}`);
    }

    const pkRes = await axios.post(`${BASE}/acceptance/payment_keys`, {
      auth_token: token,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: paymobOrderId,
      billing_data: {
        ...params.billingData,
        apartment: "NA", floor: "NA", street: "NA",
        building: "NA", city: "Cairo", country: "EG", state: "Cairo",
      },
      currency: "EGP",
      integration_id: integrationId,
      // Without this, Paymob leaves the customer on the generic post_pay page.
      redirection_url: redirectionUrl,
    });

    const paymentKey: string = pkRes.data.token;
    const apiRoot = BASE.replace(/\/$/, "");
    const iframeUrl = `${apiRoot}/acceptance/iframes/${iframeId}?payment_token=${encodeURIComponent(paymentKey)}`;

    return { paymentKey, paymobOrderId, iframeUrl };
  } catch (err) {
    logger.error("Platform Paymob error", err);
    throw new Error("Failed to create platform payment");
  }
}
