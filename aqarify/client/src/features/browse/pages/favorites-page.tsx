import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { Navbar } from "@/features/landing/components/navbar";
import { api } from "@/lib/api";
import { appendTenantSearch } from "@/lib/tenant-path";
import { useFavorites } from "@/features/browse/hooks/use-favorites";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import type { Unit } from "@/features/browse/types";
import type { ApiSuccess } from "@/types/api.types";

export default function FavoritesPage() {
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const { favoriteIds, toggleFavorite } = useFavorites();

  const unitQueries = useQueries({
    queries: favoriteIds.map((id) => ({
      queryKey: ["unit-detail", id],
      queryFn: async () => {
        const res = await api.get<ApiSuccess<Unit>>(`/units/${id}`);
        return res.data.data;
      },
      enabled: !!id,
    })),
  });

  const units = useMemo(
    () => unitQueries.map((q) => q.data).filter(Boolean) as Unit[],
    [unitQueries],
  );

  return (
    <>
      <Helmet>
        <title>Favorites</title>
      </Helmet>
      <Navbar />
      <main className="min-h-screen bg-background pt-24">
        <div className="mx-auto max-w-screen-xl px-6 py-6">
          <h1 className="mb-6 text-2xl font-semibold">Favorite units</h1>
          {units.length === 0 ? (
            <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
              You have no favorite units yet.
              <div className="mt-3">
                <Link className="underline" to={withTenant("/browse")}>
                  Browse units
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {units.map((unit) => (
                <article key={unit.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <Link to={withTenant(`/units/${unit.id}`)}>
                    <div className="aspect-[16/10] bg-muted">
                      {unit.gallery?.[0] ? (
                        <img src={unit.gallery[0]} alt={unit.unit_number} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                  </Link>
                  <div className="space-y-2 p-4">
                    <h2 className="font-semibold">
                      {unit.type} - Unit {unit.unit_number}
                    </h2>
                    <CurrencyDisplay amount={unit.price} className="text-lg font-bold" />
                    <Button variant="outline" size="sm" onClick={() => toggleFavorite(unit.id)}>
                      Remove favorite
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
