import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AppleCardsCarousel,
  type AppleCard,
  Button,
  Skeleton,
} from "@/components/ui-kit";
import { useUnitsQuery } from "@/features/browse/hooks/use-units-query";
import { useTenantStore } from "@/stores/tenant.store";
import { appendTenantSearch } from "@/lib/tenant-path";

export function FeaturedListingsSection() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const tenant = useTenantStore((s) => s.tenant);
  const { data, isLoading } = useUnitsQuery({});
  const units = data?.pages?.[0]?.units?.slice(0, 8) ?? [];

  const cards: AppleCard[] = units.map((u) => ({
    id: u.id,
    category: u.type,
    title: `${u.bedrooms} beds · ${(u.price / 1_000_000).toFixed(2)}M EGP`,
    src:
      u.gallery?.[0] ??
      `https://placehold.co/600x800/f5f5f5/888888?text=${encodeURIComponent(u.unit_number)}`,
  }));

  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-screen-xl px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="label-overline mb-2">وحدات مميزة</p>
            <h2
              className="text-3xl font-bold text-foreground md:text-4xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              أبرز العروض من {tenant?.name ?? "المطور"}
            </h2>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to={withTenant("/browse")}>Show all</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[28rem] w-72 shrink-0 rounded-2xl" />
            ))}
          </div>
        ) : (
          <AppleCardsCarousel
            items={cards}
            onCardClick={(card) => navigate(withTenant(`/units/${card.id}`))}
          />
        )}
      </div>
    </section>
  );
}
