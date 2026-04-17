const FAQS = [
  {
    q: "Do I need a credit card to start?",
    a: "Yes. Aqarify bills in EGP via Paymob from day one — no free trial, but every plan is month-to-month with a 30-day money-back guarantee. Cancel in two clicks if it isn't for you.",
  },
  {
    q: "What happens if I miss a renewal?",
    a: "Your workspace switches to read-only. Public property pages stay live so buyers aren't blocked, writes are paused, and nothing is deleted. Pay the invoice and every dashboard comes back exactly as you left it.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes. Starter ships with yourco.aqarify.com. Growth and Pro include a custom domain (sales.your-brand.com) with automatic TLS — we handle the certificates.",
  },
  {
    q: "How are buyer payments handled?",
    a: "Each tenant connects their own Paymob account for buyer reservations, so the cash flows straight to you — never through Aqarify. We only bill you for the platform subscription.",
  },
  {
    q: "How isolated is my data from other tenants?",
    a: "Every workspace is scoped at the Postgres level with row-level security. An agent in one tenant can't query a unit from another — it's not a code check, it's the database enforcing it.",
  },
  {
    q: "Who owns the data and branding?",
    a: "You do. Buyers never see the word 'Aqarify' on your portal. On cancellation we give you a full export (CSV + JSON) and keep your data for 30 days before deletion.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-4xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          FAQ
        </div>
        <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
          Questions, answered.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-sm text-muted-foreground">
          Still unsure?{" "}
          <a href="#contact" className="font-medium text-foreground underline">
            Talk to our team
          </a>
          .
        </p>
      </div>

      <dl className="mt-12 divide-y divide-border rounded-2xl border border-border bg-card">
        {FAQS.map((item) => (
          <div key={item.q} className="px-6 py-6">
            <dt className="text-sm font-semibold text-foreground">{item.q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
