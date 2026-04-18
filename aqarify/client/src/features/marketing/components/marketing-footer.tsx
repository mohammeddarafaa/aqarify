import { Link } from "react-router-dom";

type FooterItem = { to: string; label: string; external?: boolean };

const columns: { title: string; items: FooterItem[] }[] = [
  {
    title: "Product",
    items: [
      { to: "/#features", label: "Features" },
      { to: "/#pricing", label: "Pricing" },
      { to: "/#guardrails", label: "Security" },
      { to: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Get started",
    items: [
      { to: "/signup", label: "Create a workspace" },
      { to: "/discover", label: "Find a developer portal" },
      { to: "/#contact", label: "Talk to sales" },
    ],
  },
  {
    title: "Legal",
    items: [
      { to: "/terms", label: "Terms" },
      { to: "/privacy", label: "Privacy" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <span className="grid size-7 place-items-center rounded-md bg-foreground text-background text-sm font-bold">
              A
            </span>
            Aqarify
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            The multi-tenant real-estate SaaS for Egyptian developers. Branded
            portals, online reservations, agent CRM, and Paymob billing — in
            one place.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            sales@aqarify.com · +20 100 000 0000
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              {col.title}
            </div>
            <ul className="mt-4 space-y-2">
              {col.items.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} Aqarify. All rights reserved.</span>
          <span>Made with care in Cairo.</span>
        </div>
      </div>
    </footer>
  );
}
