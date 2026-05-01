import type React from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { HeartIcon, HomeIcon, Share2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { useTenantStore } from "@/stores/tenant.store";
import { appendTenantSearch } from "@/lib/tenant-path";
import type { Unit } from "@/features/browse/types";
import { useFavorites } from "@/features/browse/hooks/use-favorites";
import { useFavoritesStore } from "@/stores/favorites.store";
import { ShareModal } from "@/features/unit-details/components/share-modal";
import { toast } from "@/lib/app-toast";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  available: { label: "متاح", color: "text-emerald-600" },
  reserved: {
    label: "محجوز",
    color:
      "border-0 bg-[color-mix(in_oklch,var(--status-warning)_20%,transparent)] text-[color-mix(in_oklch,var(--status-warning)_82%,var(--foreground))] ring-1 ring-[color-mix(in_oklch,var(--status-warning)_45%,transparent)] font-semibold",
  },
  sold: { label: "مباع", color: "text-muted-foreground" },
  unavailable: { label: "غير متاح", color: "text-muted-foreground" },
};

interface UnitCardProps { unit: Unit; }

export function UnitCard({ unit }: UnitCardProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const { pathname, search } = useLocation();
  const tenant = useTenantStore((s) => s.tenant);
  const cover = unit.gallery?.[0] ?? tenant?.logo_url ?? null;
  const status = STATUS_MAP[unit.status] ?? STATUS_MAP.available;
  const unitHref = appendTenantSearch(pathname, search, `/units/${unit.id}`);
  const { isFavorite, toggleFavorite } = useFavorites();
  const isCompared = useFavoritesStore((s) => s.isCompared(unit.id));

  const onShare = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShareOpen(true);
  };

  const onCompare = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const result = useFavoritesStore.getState().toggleCompareUnit(unit.id);
    if (result.selected) {
      toast.success("Added to compare.");
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group relative overflow-hidden bg-transparent"
    >
      <Link to={unitHref} className="block">
        <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] bg-muted shadow-[0_24px_70px_-52px_rgb(20_20_20/.8)] sm:min-h-[420px]">
          {cover ? (
            <img
              src={cover}
              alt={`${unit.type} ${unit.unit_number}`}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-accent text-sm text-muted-foreground">
              Unit {unit.unit_number}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

          <div className="absolute start-4 top-4 flex items-center gap-2">
            <span className={cn("rounded-full bg-white/88 px-3 py-1.5 text-xs font-semibold backdrop-blur", status.color)}>
              {status.label}
            </span>
          </div>

          <div className="absolute end-4 top-4 flex items-center gap-2">
            <button
              type="button"
              className={cn(
                "grid size-12 place-items-center rounded-full border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur transition-colors hover:bg-white/25",
                isFavorite(unit.id) && "bg-white text-rose-500",
              )}
              aria-label="Save"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await toggleFavorite(unit.id);
              }}
            >
              <HeartIcon className={cn("size-5", isFavorite(unit.id) && "fill-current")} />
            </button>
          </div>

          <div className="absolute end-4 top-20 flex flex-col gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
              aria-label="Share"
              onClick={onShare}
            >
              <Share2Icon className="size-4" />
            </button>
            <button
              type="button"
              className={cn(
                "grid size-10 place-items-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25",
                isCompared && "bg-white text-foreground",
              )}
              aria-label="Compare"
              onClick={onCompare}
            >
              <HomeIcon className={cn("size-4", isCompared && "fill-current")} />
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-2xl font-semibold leading-tight drop-shadow">
                  {unit.type} {unit.unit_number}
                </h3>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/82">
                  <span>{unit.bedrooms} beds</span>
                  <span>{unit.bathrooms} baths</span>
                  <span>{unit.size_sqm} m²</span>
                </div>
              </div>
              <div className="shrink-0 text-end">
                <CurrencyDisplay
                  amount={unit.price}
                  size="xl"
                  className="text-2xl font-semibold leading-none text-white"
                />
                <p className="mt-2 text-xs text-white/70">total price</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/15 pt-3 text-xs text-white/72">
              <span>Floor {unit.floor}</span>
              <span>{unit.view_type ?? "Premium view"}</span>
            </div>
          </div>
        </div>
      </Link>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        unitNumber={unit.unit_number}
        unitId={unit.id}
        price={unit.price}
      />
    </motion.article>
  );
}
