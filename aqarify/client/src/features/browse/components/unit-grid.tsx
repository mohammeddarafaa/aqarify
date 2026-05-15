import { useTranslation } from "react-i18next";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { UnitCard } from "@/features/browse/components/unit-card";
import { UnitCardSkeleton } from "@/features/browse/components/unit-card.skeleton";
import type { Unit } from "@/features/browse/types";

interface UnitGridProps {
  units: Unit[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onClearFilters: () => void;
}

export function UnitGrid({ units, isLoading, isFetchingNextPage, hasNextPage, onLoadMore, onClearFilters }: UnitGridProps) {
  const { t } = useTranslation("browse");
  const sentinelRef = useInfiniteScroll(onLoadMore, hasNextPage && !isFetchingNextPage);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <UnitCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!units.length) {
    return (
      <div className="border-t border-[var(--color-border)] py-24 text-center">
        <p className="label-overline mb-4">{t("no_units")}</p>
        <p className="mb-8 text-sm text-muted-foreground">{t("no_units_hint")}</p>
        <button type="button" onClick={onClearFilters} className="btn-luxury inline-flex text-[11px]">
          {t("filters.reset")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {units.map((unit) => (
          <UnitCard key={unit.id} unit={unit} />
        ))}
        {isFetchingNextPage &&
          Array.from({ length: 3 }).map((_, i) => <UnitCardSkeleton key={`sk-${i}`} />)}
      </div>
      <div ref={sentinelRef} className="h-8" />
    </div>
  );
}
