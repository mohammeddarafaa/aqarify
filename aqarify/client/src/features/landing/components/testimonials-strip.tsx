import { InfiniteMovingCards } from "@/components/ui-kit";
import { useTenantStore } from "@/stores/tenant.store";

// Tenant-scoped testimonials. Defaults are sensible for any real-estate
// tenant; admins can override by extending tenant.theme_config later.
const DEFAULT_ITEMS = [
  {
    quote: "The buying experience was seamless — I picked my unit, paid the reservation fee, and signed the contract in a week.",
    name: "Layla K.",
    title: "Customer",
  },
  {
    quote: "I love how transparent the pricing and installment plans are. No hidden fees, no surprises.",
    name: "Ahmed F.",
    title: "Customer",
  },
  {
    quote: "Schedule-a-visit and the virtual tour saved me three trips. I closed in 48 hours.",
    name: "Nour M.",
    title: "Customer",
  },
  {
    quote: "Their agents responded within minutes every time. Best customer service in Egyptian real estate.",
    name: "Omar S.",
    title: "Customer",
  },
];

export function TestimonialsStrip() {
  const tenant = useTenantStore((s) => s.tenant);
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-muted)] py-16">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <p className="label-overline mb-3">Reviews</p>
        <h2 className="text-3xl font-bold text-[var(--color-foreground)] md:text-4xl">
          عملاء {tenant?.name ?? "المطور"} يشاركون تجربتهم
        </h2>
      </div>
      <div className="mt-10">
        <InfiniteMovingCards items={DEFAULT_ITEMS} speed="slow" />
      </div>
    </section>
  );
}
