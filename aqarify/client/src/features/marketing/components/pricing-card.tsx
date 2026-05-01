import { Link } from "react-router-dom";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Plan } from "../hooks/use-plans";
import { formatCurrency } from "@/lib/format";

export type PricingDisplayCurrency = "EGP" | "SAR" | "AED" | "USD";

interface PricingCardProps {
  plan: Plan;
  billingCycle: "monthly" | "yearly";
  highlighted?: boolean;
  /** Multiply EGP plan amounts by this factor for display (e.g. SAR rough equivalent). */
  egpConversionFactor?: number;
  displayCurrency?: PricingDisplayCurrency;
}

function featureLines(plan: Plan): string[] {
  const lines: string[] = [
    `${plan.max_projects >= 99999 ? "Unlimited" : plan.max_projects} project${
      plan.max_projects === 1 ? "" : "s"
    }`,
    `${plan.max_units >= 99999 ? "Unlimited" : plan.max_units.toLocaleString()} units`,
    `${plan.max_users >= 99999 ? "Unlimited" : plan.max_users} team members`,
    "Branded portal & dashboards",
    "Paymob checkout + invoices",
    "Waiting list with auto-alerts",
  ];
  if (plan.features.map_view) lines.push("Interactive map view");
  if (plan.features.reports) lines.push("Advanced reports & exports");
  if (plan.features.custom_domain) lines.push("Custom domain (TLS included)");
  if (plan.features.white_label) lines.push("White-label branding");
  if (plan.features.api_access) lines.push("REST API access");
  if (plan.features.priority_support) lines.push("Priority support");
  return lines;
}

export function PricingCard({
  plan,
  billingCycle,
  highlighted,
  egpConversionFactor = 1,
  displayCurrency = "EGP",
}: PricingCardProps) {
  const priceEgp =
    billingCycle === "yearly" ? plan.price_egp_yearly : plan.price_egp_monthly;
  const priceShown = Math.round(priceEgp * egpConversionFactor);
  const cadence = billingCycle === "yearly" ? "/ year" : "/ month";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-8 shadow-sm transition-shadow",
        highlighted
          ? "border-foreground ring-1 ring-foreground"
          : "border-border hover:shadow-md",
      )}
    >
      {highlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-background">
          Most popular
        </span>
      ) : null}

      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          {plan.code}
        </span>
      </div>
      {plan.description ? (
        <p className="mt-1.5 min-h-[2.5rem] text-sm text-muted-foreground">
          {plan.description}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-end gap-1.5">
        <span className="text-4xl font-semibold tracking-tight">
          {formatCurrency(priceShown, displayCurrency, "en")}
        </span>
        <span className="pb-1 text-sm text-muted-foreground">{cadence}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Billed via Paymob · VAT inclusive
      </p>

      <ul className="mt-6 flex-1 space-y-2.5">
        {featureLines(plan).map((line) => (
          <li key={line} className="flex items-start gap-2 text-sm">
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-foreground/70" />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        className="mt-8 w-full rounded-full"
        variant={highlighted ? "default" : "outline"}
      >
        <Link to={`/signup?plan=${plan.code}&cycle=${billingCycle}`}>
          Choose {plan.name}
        </Link>
      </Button>
    </div>
  );
}
