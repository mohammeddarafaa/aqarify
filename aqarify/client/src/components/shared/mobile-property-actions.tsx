import { Heart, Home, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  favoriteActive: boolean;
  compareActive: boolean;
  onFavorite: () => void;
  onShare: () => void;
  onCompare: () => void;
};

function ActionButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "grid h-12 w-12 place-items-center rounded-full border border-[color-mix(in_oklch,var(--color-background)_20%,transparent)] bg-[color-mix(in_oklch,var(--color-foreground)_75%,transparent)] text-background transition-colors",
        active && "bg-background text-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

export function MobilePropertyActions({
  favoriteActive,
  compareActive,
  onFavorite,
  onShare,
  onCompare,
}: Props) {
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-4 md:hidden">
      <div className="mx-auto flex max-w-xs items-center justify-center gap-3 rounded-full border border-[color-mix(in_oklch,var(--color-background)_15%,transparent)] bg-[color-mix(in_oklch,var(--color-foreground)_80%,transparent)] p-2 shadow-2xl backdrop-blur">
        <ActionButton active={favoriteActive} onClick={onFavorite} icon={Heart} label="Favorite" />
        <ActionButton onClick={onShare} icon={Share2} label="Share" />
        <ActionButton active={compareActive} onClick={onCompare} icon={Home} label="Compare" />
      </div>
    </div>
  );
}
