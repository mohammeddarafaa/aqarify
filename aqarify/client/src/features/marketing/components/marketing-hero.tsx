import { Link } from "react-router-dom";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import { Button, Spotlight } from "@/components/ui-kit";

const LOGO_ROW = [
  "K-Developments",
  "Palencia",
  "New Cairo Group",
  "Roya",
  "Madinaty Living",
];

export function MarketingHero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <Spotlight />

      <div className="relative mx-auto max-w-6xl px-6 py-24 text-center md:py-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
          <SparklesIcon className="size-3.5 text-foreground" />
          <span>New · Paymob-powered subscriptions are live</span>
        </div>

        <h1 className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-semibold tracking-[-0.03em] md:text-7xl">
          Sell real estate online,
          <br className="hidden md:inline" />
          <span className="text-muted-foreground"> under your own brand.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
          Aqarify is the multi-tenant SaaS Egyptian developers use to launch a
          branded property portal in a weekend — with online reservations,
          agent dashboards, waiting lists, and Paymob checkout built in.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link to="/signup">
              Create your workspace
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <a href="#pricing">See pricing</a>
          </Button>
          <Button asChild size="lg" variant="ghost" className="rounded-full">
            <a href="#guardrails">How isolation works</a>
          </Button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Starts at EGP 2,500/mo · Cancel any time · Arabic &amp; English out of the box
        </p>

        <div className="mx-auto mt-16 max-w-4xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Built for teams like
          </p>
          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-foreground/70">
            {LOGO_ROW.map((name) => (
              <li key={name} className="font-medium tracking-tight">
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
