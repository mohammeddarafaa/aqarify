import { formatCurrency } from "@/lib/format";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
  size?: "sm" | "base" | "lg" | "xl";
}

const sizeClass = { sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl font-bold" };

export function CurrencyDisplay({ amount, className, size = "base" }: CurrencyDisplayProps) {
  const language = useUIStore((s) => s.language);
  return (
    <span className={cn("font-semibold tabular-nums", sizeClass[size], className)}>
      {formatCurrency(amount, language === "ar" ? "ar-EG" : "en-EG")}
    </span>
  );
}
