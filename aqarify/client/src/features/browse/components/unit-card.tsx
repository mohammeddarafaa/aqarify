import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { HeartIcon, MapPinIcon } from "lucide-react";
import { cn } from "@/components/ui-kit";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { useTenantStore } from "@/stores/tenant.store";
import { appendTenantSearch } from "@/lib/tenant-path";
import type { Unit } from "@/features/browse/types";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  available: { label: "متاح", color: "text-emerald-600" },
  reserved: { label: "محجوز", color: "text-amber-600" },
  sold: { label: "مباع", color: "text-muted-foreground" },
  unavailable: { label: "غير متاح", color: "text-muted-foreground" },
};

interface UnitCardProps {
  unit: Unit;
}

function fallbackImage(unit: Unit) {
  return `https://placehold.co/600x400/f5f5f5/888888?text=${encodeURIComponent(unit.unit_number)}`;
}

export function UnitCard({ unit }: UnitCardProps) {
  const { pathname, search } = useLocation();
  const tenant = useTenantStore((s) => s.tenant);
  const cover = unit.gallery?.[0] ?? fallbackImage(unit);
  const status = STATUS_MAP[unit.status] ?? STATUS_MAP.available;
  const unitHref = appendTenantSearch(pathname, search, `/units/${unit.id}`);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group relative overflow-hidden bg-transparent"
    >
      <Link to={unitHref} className="block">
        <div className="relative h-64 overflow-hidden rounded-2xl bg-muted">
          <img
            src={cover}
            alt={`${unit.type} ${unit.unit_number}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <button
            type="button"
            className="absolute end-3 top-3 grid size-8 place-items-center rounded-full bg-background/90 text-foreground transition-colors hover:bg-background"
            aria-label="Save"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <HeartIcon className="size-4" />
          </button>
          <div className="absolute bottom-3 start-3">
            <span
              className={cn(
                "rounded-full bg-background px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em]",
                status.color
              )}
            >
              {status.label}
            </span>
          </div>
        </div>

        <div className="pb-5 pt-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold leading-snug text-foreground">
              {unit.type} — وحدة {unit.unit_number}
            </h3>
            {unit.view_type ? (
              <span className="shrink-0 text-xs text-muted-foreground">{unit.view_type}</span>
            ) : null}
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPinIcon className="size-3.5" />
            {tenant?.address ?? "مصر"}
          </p>
          <div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground">
            <span>{unit.bedrooms} غرف</span>
            <span>·</span>
            <span>{unit.bathrooms} حمامات</span>
            <span>·</span>
            <span>{unit.size_sqm} م²</span>
          </div>
          <div className="mt-3">
            <CurrencyDisplay
              amount={unit.price}
              size="lg"
              className="text-2xl font-bold text-foreground"
            />
            <p className="mt-0.5 text-xs text-muted-foreground">
              الدور {unit.floor} · وحدة {unit.unit_number}
            </p>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
