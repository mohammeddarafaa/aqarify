export function UnitCardSkeleton() {
  return (
    <div className="relative min-h-[360px] animate-pulse overflow-hidden rounded-[2rem] bg-muted shadow-[0_24px_70px_-52px_rgb(20_20_20/.35)] sm:min-h-[420px]">
      <div className="absolute inset-x-5 bottom-5 space-y-4">
        <div className="h-7 w-2/3 rounded-full bg-background/70" />
        <div className="flex gap-3">
          <div className="h-4 w-14 rounded-full bg-background/60" />
          <div className="h-4 w-14 rounded-full bg-background/60" />
          <div className="h-4 w-16 rounded-full bg-background/60" />
        </div>
      </div>
    </div>
  );
}
