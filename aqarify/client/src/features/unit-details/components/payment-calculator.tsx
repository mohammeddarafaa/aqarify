import { useState } from "react";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import type { Unit } from "@/features/browse/types";

export function PaymentCalculator({ unit }: { unit: Unit }) {
  const [downPct, setDownPct] = useState(unit.down_payment_pct);
  const [months, setMonths] = useState(unit.installment_months);

  const downPayment = (unit.price * downPct) / 100;
  const remaining = unit.price - downPayment;
  const monthly = remaining / months;

  return (
    <div className="bg-[var(--color-muted)] rounded-xl p-5 space-y-5">
      <h3 className="font-semibold text-[var(--color-foreground)]">حاسبة التقسيط</h3>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[var(--color-muted-foreground)]">المقدم</span>
            <span className="font-medium">{downPct}% — <CurrencyDisplay amount={downPayment} size="sm" /></span>
          </div>
          <input type="range" min={5} max={50} step={5} value={downPct}
            onChange={(e) => setDownPct(+e.target.value)}
            className="w-full accent-[var(--color-primary)]" />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[var(--color-muted-foreground)]">مدة التقسيط</span>
            <span className="font-medium">{months} شهر</span>
          </div>
          <input type="range" min={12} max={120} step={12} value={months}
            onChange={(e) => setMonths(+e.target.value)}
            className="w-full accent-[var(--color-primary)]" />
        </div>
      </div>

      <div className="bg-[var(--color-card)] rounded-lg p-4 text-center border border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-muted-foreground)] mb-1">القسط الشهري</p>
        <CurrencyDisplay amount={monthly} size="xl" className="text-[var(--color-primary)]" />
      </div>
    </div>
  );
}
