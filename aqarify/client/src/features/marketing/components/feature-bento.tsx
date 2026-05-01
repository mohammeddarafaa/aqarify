import {
  PaletteIcon,
  CreditCardIcon,
  UsersIcon,
  ClockIcon,
  GlobeIcon,
  BarChart3Icon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    title: "Your brand, not ours",
    description:
      "Logo, colors, typography, language, and custom filters — every tenant portal is 100% white-label. Buyers never see the word Aqarify.",
    icon: <PaletteIcon className="size-5" />,
    className: "md:col-span-2",
  },
  {
    title: "Reserve in one click",
    description:
      "Paymob iframe, 24-hour unit holds, and automatic invoices — so buyers convert without calling an agent.",
    icon: <CreditCardIcon className="size-5" />,
  },
  {
    title: "Every role has a dashboard",
    description:
      "Customer, agent, manager, and admin views — each seeing only what they need, nothing they don't.",
    icon: <UsersIcon className="size-5" />,
  },
  {
    title: "Waiting list + auto-alerts",
    description:
      "When a reserved unit frees up, the next buyer is notified by SMS and email instantly. Never lose a lead to a slow follow-up.",
    icon: <ClockIcon className="size-5" />,
  },
  {
    title: "Custom domain",
    description:
      "Point sales.your-brand.com at Aqarify and we'll terminate TLS — your buyers see your URL, not ours.",
    icon: <GlobeIcon className="size-5" />,
  },
  {
    title: "Reports your CFO will read",
    description:
      "Revenue, conversion, agent leaderboards, and PDF exports — pre-built so your team can focus on selling.",
    icon: <BarChart3Icon className="size-5" />,
    className: "md:col-span-2",
  },
];

export function FeatureBento() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Everything in one platform
        </div>
        <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
          The real-estate CRM your team already wishes you had.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-sm text-muted-foreground md:text-base">
          Stop stitching together WhatsApp, Excel, and an outdated landing
          page. Aqarify gives you the whole funnel — buyer portal through
          reservation, CRM, and reporting — out of the box.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className={f.className}>
            <CardContent className="space-y-3 p-5">
              <div className="text-lime">{f.icon}</div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
