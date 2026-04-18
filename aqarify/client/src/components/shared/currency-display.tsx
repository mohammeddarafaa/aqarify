import { formatCurrency } from "@/lib/format";
import { useUIStore } from "@/stores/ui.store";
import { useTenantStore } from "@/stores/tenant.store";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
  size?: "sm" | "base" | "lg" | "xl";
}

const sizeClass = { sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl font-bold" };

export function CurrencyDisplay({ amount, className, size = "base" }: CurrencyDisplayProps) {
  const language = useUIStore((s) => s.language);
  const currency = useTenantStore((s) => s.tenant?.currency ?? "EGP");
  return (
    <span className={cn("font-semibold tabular-nums", sizeClass[size], className)}>
      {formatCurrency(amount, currency, language === "ar" ? "ar" : "en")}
    </span>
  );
}
