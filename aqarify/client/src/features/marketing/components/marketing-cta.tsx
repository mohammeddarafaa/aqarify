import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function MarketingCTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-foreground px-8 py-16 text-background shadow-xl md:px-16 md:py-20">
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-background/60">
            Launch in a weekend
          </div>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.02em] md:text-5xl">
            Your branded property portal,
            <br className="hidden md:inline" />
            live by Monday.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-background/70">
            No implementation fees. No annual contracts. You own your data and
            your domain — we just run the infrastructure.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="rounded-full">
              <Link to="/signup">Create your workspace</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-background/30 bg-transparent text-background hover:bg-background/10"
            >
              <a href="#contact">Talk to sales</a>
            </Button>
          </div>
          <p className="mt-6 text-xs text-background/50">
            Average setup time: a single afternoon. 30-day money-back guarantee.
          </p>
        </div>
      </div>
    </section>
  );
}
