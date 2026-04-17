export function UnitCardSkeleton() {
  return (
    <div className="animate-pulse border-b border-[var(--color-border)] pb-5 pt-0">
      <div className="h-56 bg-[#f0f0f0] mb-4" />
      <div className="h-2.5 w-20 bg-[#f0f0f0] mb-3" />
      <div className="flex justify-between mb-3">
        <div className="h-4 w-28 bg-[#f0f0f0]" />
        <div className="h-4 w-24 bg-[#f0f0f0]" />
      </div>
      <div className="flex gap-4 mb-4">
        <div className="h-3 w-14 bg-[#f0f0f0]" />
        <div className="h-3 w-14 bg-[#f0f0f0]" />
        <div className="h-3 w-14 bg-[#f0f0f0] ms-auto" />
      </div>
      <div className="border-t border-[var(--color-border)] pt-4 flex justify-between">
        <div className="h-3 w-24 bg-[#f0f0f0]" />
        <div className="h-3 w-4 bg-[#f0f0f0]" />
      </div>
    </div>
  );
}
