import { InfiniteMovingCards } from "@/components/ui-kit";

const testimonials = [
  {
    quote:
      "We went from Excel to a branded portal in nine days. Online reservations doubled in the first month — no new hires.",
    name: "Hana El-Said",
    title: "Sales Director, Nile Developments",
  },
  {
    quote:
      "The waitlist alone paid for a year of Aqarify. We resold four cancelled units in under 48 hours without lifting a phone.",
    name: "Karim Shafik",
    title: "Managing Partner, Palm Residences",
  },
  {
    quote:
      "Our accountants stopped chasing receipts. Paymob plus PDF invoices means reconciliation happens on its own.",
    name: "Mohamed Attia",
    title: "CFO, Roya Developments",
  },
  {
    quote:
      "Agents, managers, buyers — one login each, one source of truth. Productivity up, WhatsApp chaos down.",
    name: "Sarah Moustafa",
    title: "Operations Lead, Cairo Urban",
  },
  {
    quote:
      "The onboarding took an afternoon. Two weeks in we'd sold a whole tower of units online — first time in the company's history.",
    name: "Youssef Hassan",
    title: "CEO, Sahary Real Estate",
  },
];

export function TestimonialStrip() {
  return (
    <section className="border-y border-border bg-muted/30 py-20">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Loved by Egypt&rsquo;s top developers
        </div>
        <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
          Teams close more deals with Aqarify.
        </h2>
      </div>

      <div className="mt-12">
        <InfiniteMovingCards items={testimonials} speed="slow" />
      </div>
    </section>
  );
}
