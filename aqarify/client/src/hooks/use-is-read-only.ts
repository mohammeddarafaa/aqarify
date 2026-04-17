import { useTenantStore } from "@/stores/tenant.store";

/**
 * Returns true when the current tenant's subscription has lapsed and the
 * portal is in read-only mode. Consumers should disable any write-action
 * buttons (and optionally show a tooltip). The server still enforces this
 * via subscriptionGuard middleware — this is purely a UX nicety.
 */
export function useIsReadOnly(): boolean {
  const tenant = useTenantStore((s) => s.tenant);
  return tenant?.status === "read_only";
}
