/**
 * Tenant-level payment routing. Today only Paymob is implemented; other values
 * gate card flows to bank transfer / manual settlement (see reservations.routes).
 */
export type TenantPaymentGateway = "paymob" | "cmi" | "konnect" | "efawateer" | "manual";

export function normalizeTenantPaymentGateway(raw: string | null | undefined): TenantPaymentGateway {
  const v = (raw ?? "paymob").toLowerCase().trim();
  if (v === "cmi" || v === "konnect" || v === "efawateer" || v === "manual") return v;
  return "paymob";
}

export function cardPaymentsEnabledForTenant(gateway: string | null | undefined): boolean {
  return normalizeTenantPaymentGateway(gateway) === "paymob";
}
