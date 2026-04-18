import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Skeleton, cn } from "@/components/ui-kit";
import { usePlans } from "../hooks/use-plans";
import { PricingCard, type PricingDisplayCurrency } from "./pricing-card";

const DISPLAY_RATES: Record<PricingDisplayCurrency, number> = {
  EGP: 1,
  SAR: 0.075,
  AED: 0.069,
  USD: 0.02,
};

// Compact pricing block for the marketing landing page.
// Uses the same /plans API as the /pricing page.
export function PricingSection() {
  const { data: plans, isLoading } = usePlans();
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [pricingCurrency, setPricingCurrency] = useState<PricingDisplayCurrency>("EGP");

  return (
    <section id="pricing" className="border-y border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Pricing
          </div>
          <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
            One subscription. Your whole portfolio.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground">
            Pick a plan that fits your project count today — upgrade as you
            grow. Plans are priced in EGP; use the currency toggle for an approximate Gulf / USD view. Cancel any time.
          </p>

          <div className="mx-auto mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 text-sm">
              {(["monthly", "yearly"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCycle(c)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm transition-colors",
                    cycle === c
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {c === "monthly" ? "Monthly" : "Yearly (save 17%)"}
                </button>
              ))}
            </div>
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 text-xs">
              {(["EGP", "SAR", "AED", "USD"] as const).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setPricingCurrency(cur)}
                  className={cn(
                    "rounded-full px-3 py-1.5 font-medium transition-colors",
                    pricingCurrency === cur
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-96 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {plans?.map((plan) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  billingCycle={cycle}
                  highlighted={plan.code === "growth"}
                  egpConversionFactor={DISPLAY_RATES[pricingCurrency]}
                  displayCurrency={pricingCurrency}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <Button asChild size="lg" className="rounded-full">
            <Link to="/signup">Create your workspace</Link>
          </Button>
          <p className="max-w-md text-xs text-muted-foreground">
            Billed securely via <span className="font-medium">Paymob</span>. Month-to-month plans.
            Miss a renewal and we switch you to read-only — nothing is ever deleted.
          </p>
        </div>
      </div>
    </section>
  );
}
