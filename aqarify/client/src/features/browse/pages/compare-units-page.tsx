import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { Scale, Trash2 } from "lucide-react";
import { Navbar } from "@/features/landing/components/navbar";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { appendTenantSearch } from "@/lib/tenant-path";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Button } from "@/components/ui/button";
import { useFavoritesStore } from "@/stores/favorites.store";
import { cn } from "@/lib/utils";
import type { ApiSuccess } from "@/types/api.types";
import type { Unit } from "@/features/browse/types";

/** Max UUIDs per request — longer lists are chunked client-side so URLs stay proxy-safe */
const IDS_PER_CHUNK = 50;

function parseCompareIds(raw: string | null): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(",").map((v) => v.trim()).filter(Boolean))];
}

async function fetchUnitsByOrderedIds(ids: string[]): Promise<Unit[]> {
  if (ids.length === 0) return [];

  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += IDS_PER_CHUNK) {
    chunks.push(ids.slice(i, i + IDS_PER_CHUNK));
  }

  const rows = await Promise.all(
    chunks.map((chunk) =>
      api
        .get<ApiSuccess<Unit[]>>(`/units/by-ids?ids=${chunk.map((id) => encodeURIComponent(id)).join(",")}`)
        .then((r) => r.data.data ?? []),
    ),
  );

  const byId = new Map(rows.flat().map((u) => [u.id, u]));
  return ids.flatMap((id) => {
    const u = byId.get(id);
    return u ? [u] : [];
  });
}

const STATUS_LABEL: Record<string, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
};

export default function CompareUnitsPage() {
  const { pathname, search } = useLocation();
  const compareUnitIds = useFavoritesStore((s) => s.compareUnitIds);
  const removeCompareUnit = useFavoritesStore((s) => s.removeCompareUnit);
  const clearCompareUnits = useFavoritesStore((s) => s.clearCompareUnits);
  const replaceCompareUnits = useFavoritesStore((s) => s.replaceCompareUnits);

  useEffect(() => {
    const fromUrl = parseCompareIds(new URLSearchParams(search).get("ids"));
    if (fromUrl.length > 0) {
      replaceCompareUnits(fromUrl);
    }
  }, [search, replaceCompareUnits]);

  const effectiveIds = compareUnitIds;
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);

  const unitQuery = useQuery({
    queryKey: ["units-compare-batch", [...effectiveIds].sort().join(",")],
    queryFn: () => fetchUnitsByOrderedIds(effectiveIds),
    enabled: effectiveIds.length > 0,
  });

  const units = unitQuery.data ?? [];

  const copyShareLink = async () => {
    const query = effectiveIds.map((id) => encodeURIComponent(id)).join(",");
    const path = `/compare?ids=${query}`;
    const href = `${window.location.origin}${withTenant(path)}`;
    try {
      await navigator.clipboard.writeText(href);
      toast.success("Compare link copied");
    } catch {
      toast.info("Unable to copy from this browser.");
    }
  };

  const comparisonRows = useMemo(() => {
    if (units.length === 0) return [];
    return [
      { label: "Unit", values: units.map((u) => `#${u.unit_number}`) },
      { label: "Type", values: units.map((u) => u.type) },
      {
        label: "Price",
        values: units.map((u) => (
          <CurrencyDisplay key={`${u.id}-price`} amount={u.price} className="font-semibold" />
        )),
      },
      { label: "Bedrooms", values: units.map((u) => String(u.bedrooms)) },
      { label: "Bathrooms", values: units.map((u) => String(u.bathrooms)) },
      { label: "Size (m²)", values: units.map((u) => String(u.size_sqm)) },
      { label: "Floor", values: units.map((u) => String(u.floor)) },
      {
        label: "Status",
        values: units.map((u) => STATUS_LABEL[u.status] ?? u.status),
      },
      {
        label: "Reservation fee",
        values: units.map((u) => (
          <CurrencyDisplay key={`${u.id}-rf`} amount={u.reservation_fee} />
        )),
      },
      { label: "Down payment", values: units.map((u) => `${u.down_payment_pct}%`) },
      { label: "Installments", values: units.map((u) => `${u.installment_months} mo`) },
      { label: "View", values: units.map((u) => u.view_type ?? "—") },
      { label: "Finishing", values: units.map((u) => u.finishing ?? "—") },
    ];
  }, [units]);

  return (
    <>
      <Helmet>
        <title>Compare Units</title>
      </Helmet>
      <Navbar />
      <main className="min-h-screen bg-background pt-24">
        <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/50">
                <Scale className="size-5 text-foreground" aria-hidden />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Compare units</h1>
                <p className="text-sm text-muted-foreground">
                  Add units from browse or listing pages. There is no limit on how many you compare.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {effectiveIds.length > 0 && (
                <>
                  <Button type="button" variant="outline" size="sm" onClick={() => void copyShareLink()}>
                    Copy link
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => clearCompareUnits()}>
                    Clear all
                  </Button>
                </>
              )}
            </div>
          </div>

          {effectiveIds.length === 0 ? (
            <div className="rounded-xl border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
              <p>You have nothing to compare yet. Use the compare control on unit cards or the unit page to build your list.</p>
              <div className="mt-4">
                <Button asChild variant="default" className="rounded-full">
                  <Link to={withTenant("/browse")}>Browse projects</Link>
                </Button>
              </div>
            </div>
          ) : unitQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading units…</p>
          ) : unitQuery.isError ? (
            <p className="text-sm text-destructive">Something went wrong loading units. Try again in a moment.</p>
          ) : units.length === 0 ? (
            <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
              None of these units could be loaded. They may have been removed.
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => clearCompareUnits()}>
                  Clear list
                </Button>
                <Button asChild variant="default" size="sm">
                  <Link to={withTenant("/browse")}>Back to browse</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="overflow-x-auto overscroll-x-contain rounded-2xl border border-border bg-card pb-2 shadow-sm [-webkit-overflow-scrolling:touch]">
                <div className="inline-block min-w-full align-middle">
                  <table className="relative min-w-max w-full caption-bottom border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th
                          scope="col"
                          className={cn(
                            "sticky left-0 z-20 w-[7.5rem] min-w-[7.5rem] border-e border-border bg-card px-3 py-3 text-start font-medium text-muted-foreground",
                            "max-sm:w-28 max-sm:min-w-28 max-sm:text-xs",
                          )}
                        >
                          {""}
                        </th>
                        {units.map((unit) => (
                          <th
                            key={unit.id}
                            scope="col"
                            className={cn(
                              "w-[min(14rem,calc(100vw-8rem))] min-w-[10rem] max-w-[16rem] border-e border-border p-3 text-start align-top font-normal last:border-e-0",
                            )}
                          >
                            <Link
                              to={withTenant(`/units/${unit.id}`)}
                              className="group flex flex-col gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <div className="aspect-[16/10] overflow-hidden rounded-xl bg-muted">
                                {unit.gallery?.[0] ? (
                                  <img
                                    src={unit.gallery[0]}
                                    alt=""
                                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                    No image
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{unit.type}</p>
                                <p className="text-muted-foreground">Unit {unit.unit_number}</p>
                              </div>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              className={cn(
                                "mt-3 h-9 w-full justify-center gap-1.5 rounded-full px-3 text-xs font-semibold uppercase tracking-wide",
                                "border-2 border-destructive/70 bg-destructive/15 text-destructive shadow-sm",
                                "hover:bg-destructive/25 hover:text-destructive",
                                "focus-visible:border-destructive focus-visible:ring-destructive/30",
                              )}
                              onClick={() => removeCompareUnit(unit.id)}
                            >
                              <Trash2 className="size-3.5 shrink-0" aria-hidden />
                              Remove
                            </Button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((row) => (
                        <tr key={row.label} className="border-b border-border last:border-b-0">
                          <th
                            scope="row"
                            className={cn(
                              "sticky left-0 z-10 whitespace-nowrap border-e border-border bg-muted/60 px-3 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground",
                              "backdrop-blur supports-[backdrop-filter]:bg-muted/75",
                              "max-sm:max-w-[6.5rem] max-sm:text-[10px] max-sm:normal-case max-sm:tracking-normal",
                            )}
                          >
                            {row.label}
                          </th>
                          {row.values.map((cell, idx) => (
                            <td
                              key={units[idx]!.id + row.label}
                              className="border-e border-border px-3 py-2.5 align-top text-foreground last:border-e-0"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Scroll sideways on phones and tablets to see every column.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
