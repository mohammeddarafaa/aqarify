import axios from "axios";
import { logger } from "../utils/logger";

const BASE = process.env.PAYMOB_BASE_URL ?? "https://accept.paymob.com/api";

export interface PaymobIntentionResult {
  client_secret: string;
  payment_keys: { token: string }[];
}

export async function createPaymobIntention(params: {
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
    const pkRes = await axios.post(`${BASE}/acceptance/payment_keys`, {
      auth_token: token,
      amount_cents: params.amountCents,
      expiration: 3600,
      order_id: paymobOrderId,
      billing_data: { ...params.billingData, apartment: "NA", floor: "NA", street: "NA", building: "NA", city: "Cairo", country: "EG", state: "Cairo" },
      currency: params.currency,
      integration_id: params.integrationId,
    });

    return { paymentKey: pkRes.data.token, intentionId: paymobOrderId };
  } catch (err) {
    logger.error("Paymob error", err);
    throw new Error("Failed to create Paymob payment");
  }
}
