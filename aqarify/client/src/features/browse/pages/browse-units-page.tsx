import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { SlidersHorizontal, X, ChevronLeft } from "lucide-react";
import { Navbar } from "@/features/landing/components/navbar";
import { FilterBar } from "@/features/browse/components/filter-bar";
import { FilterPanelMobile } from "@/features/browse/components/filter-panel-mobile";
import { BrowseHero } from "@/features/browse/components/browse-hero";
import { UnitGrid } from "@/features/browse/components/unit-grid";
import { MapView } from "@/features/browse/components/map-view";
import { ViewToggle } from "@/features/browse/components/view-toggle";
import { useUnitFilters } from "@/features/browse/hooks/use-unit-filters";
import { useUnitsQuery } from "@/features/browse/hooks/use-units-query";
import { usePublicProject } from "@/features/browse/hooks/use-public-projects";
import { useTenantStore } from "@/stores/tenant.store";
import { appendTenantSearch } from "@/lib/tenant-path";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MobilePropertyActions } from "@/components/shared/mobile-property-actions";
import { useFavorites } from "@/features/browse/hooks/use-favorites";
import { useFavoritesStore } from "@/stores/favorites.store";
import { toast } from "@/lib/app-toast";

export default function BrowseUnitsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [view, setView] = useState<"grid" | "map">(
    () => (localStorage.getItem("aqarify:browse-view") as "grid" | "map") ?? "grid",
  );
  const { filters, setFilter, patchFilters, clearFilters, hasActiveFilters } = useUnitFilters();

  const mergedFilters = useMemo(
    () => ({ ...filters, ...(projectId ? { project_id: projectId } : {}) }),
    [filters, projectId],
  );

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useUnitsQuery(mergedFilters);
  const { data: project, isLoading: projectLoading, isError: projectError } = usePublicProject(projectId);
  const tenant = useTenantStore((s) => s.tenant);

  const allUnits = data?.pages.flatMap((p) => p.units) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;
  const { favoriteIds } = useFavorites();
  const compareUnitIds = useFavoritesStore((s) => s.compareUnitIds);

  const onChangeView = (next: "grid" | "map") => {
    setView(next);
    localStorage.setItem("aqarify:browse-view", next);
  };

  if (!projectId) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>
          {project?.name ? `${project.name} — وحدات` : "وحدات المشروع"} — {tenant?.name ?? "المطور"}
        </title>
        <meta
          name="description"
          content={`تصفح وحدات ${project?.name ?? "المشروع"} من ${tenant?.name ?? "المطور"}.`}
        />
      </Helmet>
      <Navbar />

      <main className="min-h-screen bg-background pb-24 pt-20">
        <div className="mx-auto max-w-screen-xl px-6 pt-4">
          <Button variant="ghost" asChild className="mb-2 -ms-2 gap-1 text-xs font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground">
            <Link to={withTenant("/browse")}>
              <ChevronLeft className="size-4" />
              كل المشاريع
            </Link>
          </Button>
        </div>

        {projectLoading ? (
          <div className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40 px-6 py-10">
            <Skeleton className="mx-auto max-w-screen-xl h-24 rounded-lg" />
          </div>
        ) : projectError || !project ? (
          <div className="mx-auto max-w-screen-xl px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">المشروع غير موجود أو غير متاح.</p>
            <Button asChild className="mt-6 rounded-full">
              <Link to={withTenant("/browse")}>العودة للمشاريع</Link>
            </Button>
          </div>
        ) : (
          <>
            <BrowseHero mode="units" total={total} isLoading={isLoading} projectName={project.name} />

            <div className="mx-auto flex max-w-screen-xl items-center justify-between px-6 pb-4 pt-6">
              <p className="label-overline">الفلاتر</p>
              <ViewToggle view={view} onChange={onChangeView} />
            </div>

            <div className="hidden border-t border-b border-[var(--color-border)] md:block">
              <div className="mx-auto max-w-screen-xl">
                <FilterBar
                  filters={filters}
                  onFiltersPatch={patchFilters}
                  onClear={clearFilters}
                  hasActive={hasActiveFilters}
                />
              </div>
            </div>

            <div className="border-t border-b border-[var(--color-border)] px-6 md:hidden">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="flex w-full items-center gap-3 py-4 text-[11px] font-medium uppercase tracking-widest text-foreground"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                فلاتر الوحدات
                {hasActiveFilters && (
                  <span className="ms-auto h-1.5 w-1.5 rounded-full bg-[var(--color-gold)]" />
                )}
              </button>
            </div>

            <AnimatePresence>
              {hasActiveFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-[var(--color-border)] md:hidden"
                >
                  <div className="flex items-center gap-3 overflow-x-auto px-6 py-3">
                    {Object.entries(filters)
                      .filter(([, v]) => v && v !== "all")
                      .map(([k, v]) => (
                        <span
                          key={k}
                          className="flex shrink-0 items-center gap-1.5 border border-foreground px-3 py-1 text-[10px] font-medium uppercase tracking-widest"
                        >
                          {v}
                          <button
                            type="button"
                            onClick={() => setFilter(k, "")}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="ms-auto shrink-0 text-[10px] font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground"
                    >
                      مسح الكل
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mx-auto max-w-screen-xl px-6 py-8">
              <div className={view === "map" ? "grid gap-6 lg:grid-cols-2" : ""}>
                <UnitGrid
                  units={allUnits}
                  isLoading={isLoading}
                  isFetchingNextPage={isFetchingNextPage}
                  hasNextPage={!!hasNextPage}
                  onLoadMore={fetchNextPage}
                  onClearFilters={clearFilters}
                />
                {view === "map" && (
                  <MapView
                    units={allUnits}
                    projectLocation={
                      project.location_lat != null && project.location_lng != null
                        ? {
                            lat: Number(project.location_lat),
                            lng: Number(project.location_lng),
                          }
                        : null
                    }
                  />
                )}
              </div>
            </div>

            <FilterPanelMobile
              isOpen={mobileFiltersOpen}
              onClose={() => setMobileFiltersOpen(false)}
              filters={filters}
              onFilterChange={setFilter}
              onFiltersPatch={patchFilters}
              onClear={clearFilters}
              resultCount={total}
            />
          </>
        )}
      </main>
      <MobilePropertyActions
        favoriteActive={favoriteIds.length > 0}
        compareActive={compareUnitIds.length === 2}
        onFavorite={() => {
          window.location.assign(withTenant("/favorites"));
        }}
        onShare={async () => {
          const url = window.location.href;
          try {
            if (navigator.share) {
              await navigator.share({ title: document.title, url });
            } else {
              await navigator.clipboard.writeText(url);
              toast.success("Page link copied");
            }
          } catch {
            // user canceled share
          }
        }}
        onCompare={() => {
          if (compareUnitIds.length !== 2) {
            toast.info("Pick 2 units using the home icon on cards.");
            return;
          }
          const ids = compareUnitIds.join(",");
          window.location.assign(withTenant(`/compare?ids=${encodeURIComponent(ids)}`));
        }}
      />
    </>
  );
}
