import {
  ShieldCheckIcon,
  LockKeyholeIcon,
  CreditCardIcon,
  PauseCircleIcon,
} from "lucide-react";

const items = [
  {
    icon: ShieldCheckIcon,
    title: "Tenant isolation on day one",
    body:
      "Every workspace is enforced at the database level with Postgres row-level security. An agent cannot query a unit that doesn't belong to them — it's not a code check, it's the DB saying no.",
  },
  {
    icon: LockKeyholeIcon,
    title: "Your subdomain, your rules",
    body:
      "Run on kdev.aqarify.com or bring your own custom domain. Buyers never leave your brand; your data never touches another tenant.",
  },
  {
    icon: CreditCardIcon,
    title: "Paymob, not card scrapers",
    body:
      "Subscriptions are billed in EGP through a Paymob integration with HMAC-verified webhooks. You activate the moment payment clears — no manual approvals, no email chains.",
  },
  {
    icon: PauseCircleIcon,
    title: "Read-only, not deleted",
    body:
      "Miss a renewal? Your public portal stays live, writes are paused, and nothing is deleted. Pay the invoice and every dashboard comes back exactly as you left it.",
  },
];

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Platform guardrails
          </div>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
            Multi-tenant by design, not by prayer.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-sm text-muted-foreground">
            Aqarify isn't one shared app with a logo picker. Each signup
            provisions an isolated tenant with its own users, RLS policies,
            Paymob credentials, and subscription lifecycle.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <div
              key={it.title}
              className="flex flex-col rounded-2xl border border-border bg-background p-5"
            >
              <div className="grid size-10 place-items-center rounded-xl bg-muted">
                <it.icon className="size-5 text-foreground" />
              </div>
              <h3 className="mt-4 text-sm font-semibold tracking-tight">
                {it.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {it.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
