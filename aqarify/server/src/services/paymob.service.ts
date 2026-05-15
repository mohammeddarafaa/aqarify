import axios from "axios";
import { logger } from "../utils/logger";

const BASE = process.env.PAYMOB_BASE_URL ?? "https://accept.paymob.com/api";

/** Billing geography Paymob expects on acceptance keys — aligned with tenant country when possible. */
const PAYMOB_BILLING_GEO: Record<string, { city: string; country: string; state: string }> = {
  EG: { city: "Cairo", country: "EG", state: "Cairo" },
  SA: { city: "Riyadh", country: "SA", state: "Riyadh" },
  AE: { city: "Dubai", country: "AE", state: "Dubai" },
  KW: { city: "Kuwait City", country: "KW", state: "Kuwait" },
  QA: { city: "Doha", country: "QA", state: "Doha" },
  BH: { city: "Manama", country: "BH", state: "Capital" },
  OM: { city: "Muscat", country: "OM", state: "Muscat" },
  JO: { city: "Amman", country: "JO", state: "Amman" },
  MA: { city: "Casablanca", country: "MA", state: "Casablanca" },
  TN: { city: "Tunis", country: "TN", state: "Tunis" },
  DZ: { city: "Algiers", country: "DZ", state: "Algiers" },
  LY: { city: "Tripoli", country: "LY", state: "Tripoli" },
};

export interface PaymobIntentionResult {
  client_secret: string;
  payment_keys: { token: string }[];
}

/** Legacy Accept API: auth token → order → payment key (not Paymob Intentions API). */
export async function createPaymobPaymentKey(params: {
  apiKey: string;
  integrationId: string;
  amountCents: number;
  currency: string;
  orderId: string;
  billingData: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
  /** Tenant ISO country — selects billing city/country sent to Paymob. */
  tenantCountryIso?: string | null;
}): Promise<{ paymentKey: string; intentionId: string }> {
  try {
    // Step 1: Auth
    const authRes = await axios.post(`${BASE}/auth/tokens`, { api_key: params.apiKey });
    const token: string = authRes.data.token;

    // Step 2: Create order
    const orderRes = await axios.post(
      `${BASE}/ecommerce/orders`,
      {
        auth_token: token,
        delivery_needed: false,
        amount_cents: params.amountCents,
        currency: params.currency,
        merchant_order_id: params.orderId,
        items: [],
      }
    );
    const paymobOrderId: string = orderRes.data.id;

    // Step 3: Payment key
    const iso = (params.tenantCountryIso ?? "EG").toUpperCase();
    const geo = PAYMOB_BILLING_GEO[iso] ?? PAYMOB_BILLING_GEO.EG;

    const pkRes = await axios.post(`${BASE}/acceptance/payment_keys`, {
      auth_token: token,
      amount_cents: params.amountCents,
      expiration: 3600,
      order_id: paymobOrderId,
      billing_data: {
        ...params.billingData,
        apartment: "NA",
        floor: "NA",
        street: "NA",
        building: "NA",
        city: geo.city,
        country: geo.country,
        state: geo.state,
      },
      currency: params.currency,
      integration_id: params.integrationId,
    });

    return { paymentKey: pkRes.data.token, intentionId: paymobOrderId };
  } catch (err) {
    logger.error("Paymob error", err);
    throw new Error("Failed to create Paymob payment");
  }
}
