import { createPaymobPaymentKey } from "./paymob.service";
import { decrypt } from "../utils/hmac";
import { normalizeTenantPaymentGateway } from "./paymentGateway.factory";

export type TenantCardGatewayRow = {
  payment_gateway?: string | null;
  paymob_integration_id?: string | null;
  paymob_api_key_enc?: string | null;
  paymob_iframe_id?: string | null;
  currency?: string | null;
  country_code?: string | null;
};

/**
 * Creates a hosted card payment session for the tenant's configured PSP.
 * Additional gateways (Konnect, CMI, …) branch here without leaking Paymob into route handlers.
 */
export async function createTenantCardPaymentIntent(params: {
  tenant: TenantCardGatewayRow;
  amountCents: number;
  orderId: string;
  billingData: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
}): Promise<{ paymentKey: string }> {
  const gw = normalizeTenantPaymentGateway(params.tenant.payment_gateway);
  if (gw !== "paymob") {
    throw new Error("CARD_GATEWAY_NOT_IMPLEMENTED");
  }
  if (!params.tenant.paymob_integration_id?.trim() || !params.tenant.paymob_api_key_enc) {
    throw new Error("PAYMOB_NOT_CONFIGURED");
  }

  const apiKey = decrypt(params.tenant.paymob_api_key_enc);
  const currency = params.tenant.currency?.trim() || "EGP";

  return createPaymobPaymentKey({
    apiKey,
    integrationId: params.tenant.paymob_integration_id,
    amountCents: params.amountCents,
    currency,
    orderId: params.orderId,
    billingData: params.billingData,
    tenantCountryIso: params.tenant.country_code ?? null,
  });
}
