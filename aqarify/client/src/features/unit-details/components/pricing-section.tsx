import { CurrencyDisplay } from "@/components/shared/currency-display";
import type { Unit } from "@/features/browse/types";

export function PricingSection({ unit }: { unit: Unit }) {
  const downPayment = (unit.price * unit.down_payment_pct) / 100;
  const remaining = unit.price - downPayment;
  const monthly = remaining / unit.installment_months;

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
      <h3 className="font-semibold text-[var(--color-foreground)]">تفاصيل السعر والتقسيط</h3>
      <div className="space-y-3">
        {[
          { label: "إجمالي السعر", value: unit.price, accent: true },
          { label: "رسوم الحجز", value: unit.reservation_fee },
          { label: `مقدم ${unit.down_payment_pct}%`, value: downPayment },
          { label: `قسط شهري (${unit.installment_months} شهر)`, value: monthly },
        ].map(({ label, value, accent }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
            <span className="text-sm text-[var(--color-muted-foreground)]">{label}</span>
            <CurrencyDisplay amount={value} size={accent ? "lg" : "base"}
              className={accent ? "text-[var(--color-primary)]" : ""} />
          </div>
        ))}
      </div>
    </div>
  );
}
