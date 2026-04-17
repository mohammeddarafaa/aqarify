import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "motion/react";
import { SlidersHorizontal, X } from "lucide-react";
import { Navbar } from "@/features/landing/components/navbar";
import { FilterBar } from "@/features/browse/components/filter-bar";
import { FilterPanelMobile } from "@/features/browse/components/filter-panel-mobile";
import { BrowseHero } from "@/features/browse/components/browse-hero";
import { UnitGrid } from "@/features/browse/components/unit-grid";
import { MapView } from "@/features/browse/components/map-view";
import { ViewToggle } from "@/features/browse/components/view-toggle";
import { useUnitFilters } from "@/features/browse/hooks/use-unit-filters";
import { useUnitsQuery } from "@/features/browse/hooks/use-units-query";
import { useTenantStore } from "@/stores/tenant.store";

export default function BrowsePage() {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [view, setView] = useState<"grid" | "map">(
    () => (localStorage.getItem("aqarify:browse-view") as "grid" | "map") ?? "grid"
  );
  const { filters, setFilter, clearFilters, hasActiveFilters } = useUnitFilters();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useUnitsQuery(filters);
  const tenant = useTenantStore((s) => s.tenant);

  const allUnits = data?.pages.flatMap((p) => p.units) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;

  const onChangeView = (next: "grid" | "map") => {
    setView(next);
    localStorage.setItem("aqarify:browse-view", next);
  };

  return (
    <>
      <Helmet>
        <title>وحدات {tenant?.name ?? "المطور"} — تصفح الوحدات المتاحة</title>
        <meta
          name="description"
          content={`تصفح الوحدات المتاحة من ${tenant?.name ?? "المطور"} في ${tenant?.address ?? "مصر"} مع فلاتر المشروع والوحدة.`}
        />
      </Helmet>
      <Navbar />

      <main className="min-h-screen bg-white pt-20">
        <BrowseHero total={total} isLoading={isLoading} />

        <div className="max-w-screen-xl mx-auto px-6 pt-6 pb-4 flex items-center justify-between">
          <p className="label-overline">الفلاتر</p>
          <ViewToggle view={view} onChange={onChangeView} />
        </div>

        {/* Desktop filter bar — full width with borders */}
        <div className="hidden md:block border-t border-b border-[var(--color-border)]">
          <div className="max-w-screen-xl mx-auto">
            <FilterBar
              filters={filters}
              onFilterChange={setFilter}
              onClear={clearFilters}
              hasActive={hasActiveFilters}
            />
          </div>
        </div>

        {/* Mobile filter button */}
        <div className="md:hidden border-t border-b border-[var(--color-border)] px-6">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-3 py-4 w-full text-[11px] font-medium tracking-widest uppercase text-[#141414]">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            فلاتر المشاريع
            {hasActiveFilters && (
              <span className="ms-auto h-1.5 w-1.5 rounded-full bg-[var(--color-gold)]" />
            )}
          </button>
        </div>

        {/* Active filter pills — mobile only */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3 px-6 py-3 overflow-x-auto">
                {Object.entries(filters).filter(([, v]) => v && v !== "all").map(([k, v]) => (
                  <span key={k}
                    className="flex items-center gap-1.5 shrink-0 border border-[#141414] px-3 py-1 text-[10px] font-medium tracking-widest uppercase">
                    {v}
                    <button onClick={() => setFilter(k, "")} className="text-[#888888] hover:text-[#141414]">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button onClick={clearFilters}
                  className="shrink-0 text-[10px] font-medium tracking-widest uppercase text-[#888888] hover:text-[#141414] ms-auto">
                  مسح الكل
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="max-w-screen-xl mx-auto px-6 py-8">
          <div className={view === "map" ? "grid lg:grid-cols-2 gap-6" : ""}>
            <UnitGrid
              units={allUnits}
              isLoading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={!!hasNextPage}
              onLoadMore={fetchNextPage}
              onClearFilters={clearFilters}
            />
            {view === "map" && <MapView units={allUnits} />}
          </div>
        </div>
      </main>

      {/* Mobile filter panel */}
      <FilterPanelMobile
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filters={filters}
        onFilterChange={setFilter}
        onClear={clearFilters}
      />
    </>
  );
}
