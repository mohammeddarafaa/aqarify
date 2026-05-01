import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { Navbar } from "@/features/landing/components/navbar";
import { api } from "@/lib/api";
import { appendTenantSearch } from "@/lib/tenant-path";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Button } from "@/components/ui/button";
import { useFavoritesStore } from "@/stores/favorites.store";
import type { ApiSuccess } from "@/types/api.types";
import type { Unit } from "@/features/browse/types";

function parseCompareIds(raw: string | null) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 2);
}

export default function CompareUnitsPage() {
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);
  const ids = parseCompareIds(params.get("ids"));
  const removeCompareUnit = useFavoritesStore((s) => s.removeCompareUnit);
  const clearCompareUnits = useFavoritesStore((s) => s.clearCompareUnits);

  const unitQueries = useQueries({
    queries: ids.map((id) => ({
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
  const isLoading = unitQueries.some((q) => q.isLoading);
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);

  return (
    <>
      <Helmet>
        <title>Compare Units</title>
      </Helmet>
      <Navbar />
      <main className="min-h-screen bg-background pt-24">
        <div className="mx-auto max-w-screen-xl px-6 py-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Compare units</h1>
            <Button variant="outline" onClick={clearCompareUnits}>
              Clear compare
            </Button>
          </div>

          {ids.length !== 2 ? (
            <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
              Select exactly 2 units to compare from the browse page.
              <div className="mt-3">
                <Link className="underline" to={withTenant("/browse")}>
                  Back to browse
                </Link>
              </div>
            </div>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Loading units...</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {units.map((unit) => (
                <article key={unit.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="aspect-[16/10] bg-muted">
                    {unit.gallery?.[0] ? (
                      <img src={unit.gallery[0]} alt={unit.unit_number} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="space-y-2 p-5">
                    <h2 className="text-xl font-semibold">
                      {unit.type} - Unit {unit.unit_number}
                    </h2>
                    <CurrencyDisplay amount={unit.price} className="text-xl font-bold" />
                    <p className="text-sm text-muted-foreground">
                      {unit.bedrooms} beds · {unit.bathrooms} baths · {unit.size_sqm} m2 · Floor {unit.floor}
                    </p>
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        className="px-0 text-xs text-muted-foreground"
                        onClick={() => removeCompareUnit(unit.id)}
                      >
                        Remove from compare
                      </Button>
                    </div>
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
