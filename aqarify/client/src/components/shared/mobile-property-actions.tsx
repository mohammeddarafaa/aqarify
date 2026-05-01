import type { ElementType } from "react";
import { Heart, Home, Share2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";
import { isMobileBottomNavAudience } from "@/components/shared/mobile-bottom-nav";

type Props = {
  favoriteActive: boolean;
  compareActive: boolean;
  /** Shown on the compare control when &gt; 0 (e.g. number of units in list). */
  compareCount?: number;
  onFavorite: () => void;
  onShare: () => void;
  onCompare: () => void;
};

function ActionButton({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  active?: boolean;
  onClick: () => void;
  icon: ElementType;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "relative grid h-12 w-12 place-items-center rounded-full border border-[color-mix(in_oklch,var(--color-background)_20%,transparent)] bg-[color-mix(in_oklch,var(--color-foreground)_75%,transparent)] text-background transition-colors",
        active && "bg-background text-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
      {badge != null && badge > 0 ? (
        <span className="absolute -end-0.5 -top-0.5 flex min-w-[1.125rem] items-center justify-center rounded-full bg-[var(--color-gold)] px-1 text-[10px] font-bold leading-none text-[var(--color-foreground)]">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </button>
  );
}

export function MobilePropertyActions({
  favoriteActive,
  compareActive,
  compareCount,
  onFavorite,
  onShare,
  onCompare,
}: Props) {
  const user = useAuthStore((s) => s.user);
  const bottomNavActive = isMobileBottomNavAudience(user);

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-[52] px-4 md:hidden",
        /* Sit above `MobileBottomNav` (z-40, ~5.75rem tall); keep clear of home indicator */
        bottomNavActive
          ? "bottom-[calc(5.85rem+env(safe-area-inset-bottom,0px))]"
          : "bottom-[max(1rem,env(safe-area-inset-bottom,0px))]",
      )}
    >
      <div className="mx-auto flex max-w-xs items-center justify-center gap-3 rounded-full border border-[color-mix(in_oklch,var(--color-background)_15%,transparent)] bg-[color-mix(in_oklch,var(--color-foreground)_80%,transparent)] p-2 shadow-2xl backdrop-blur">
        <ActionButton active={favoriteActive} onClick={onFavorite} icon={Heart} label="Favorite" />
        <ActionButton onClick={onShare} icon={Share2} label="Share" />
        <ActionButton
          active={compareActive}
          onClick={onCompare}
          icon={Home}
          label="Compare"
          badge={compareCount}
        />
      </div>
    </div>
  );
}
