import { useMemo } from "react";
import { formatCurrency } from "@/lib/format";
import { useTenantStore } from "@/stores/tenant.store";
import { useUIStore } from "@/stores/ui.store";

/** Tenant currency + formatter — replaces hardcoded ج.م / EGP across the app. */
export function useTenantMoney() {
  const currency = useTenantStore(
    (s) => s.tenant?.currency ?? s.tenant?.fallback_currency ?? "EGP",
  );
  const uiLang = useUIStore((s) => s.language);

  return useMemo(
    () => ({
      currency,
      formatMoney: (amount: number) =>
        formatCurrency(amount, currency, uiLang === "ar" ? "ar" : "en"),
    }),
    [currency, uiLang],
  );
}
