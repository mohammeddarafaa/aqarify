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
  const sentinelRef = useInfiniteScroll(onLoadMore, hasNextPage && !isFetchingNextPage);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-0 border-t border-[var(--color-border)]">
        {Array.from({ length: 6 }).map((_, i) => <UnitCardSkeleton key={i} />)}
      </div>
    );
  }

  if (!units.length) {
    return (
      <div className="border-t border-[var(--color-border)] py-24 text-center">
        <p className="label-overline mb-4">لا توجد نتائج</p>
        <p className="text-[#888888] text-sm mb-8">لم يتم العثور على وحدات تطابق الفلاتر المحددة.</p>
        <button
          onClick={onClearFilters}
          className="btn-luxury text-[11px] inline-flex">
          مسح الفلاتر
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 border-t border-[var(--color-border)]">
        {units.map((unit) => <UnitCard key={unit.id} unit={unit} />)}
        {isFetchingNextPage && Array.from({ length: 3 }).map((_, i) => <UnitCardSkeleton key={`sk-${i}`} />)}
      </div>
      <div ref={sentinelRef} className="h-8" />
    </div>
  );
}
