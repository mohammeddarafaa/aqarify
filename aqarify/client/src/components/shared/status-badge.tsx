import { type VariantProps } from "class-variance-authority";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type UnitStatus = "available" | "reserved" | "sold";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const config: Record<UnitStatus, { variant: BadgeVariant; className?: string; key: string }> = {
  available: {
    variant: "outline",
    className: "border-lime/40 bg-lime text-lime-foreground",
    key: "status.available",
  },
  reserved: {
    variant: "warning",
    key: "status.reserved",
  },
  sold: {
    variant: "outline",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
    key: "status.sold",
  },
};

export function StatusBadge({ status, className }: { status: UnitStatus; className?: string }) {
  const { t } = useTranslation();
  const { variant, className: statusClass, key } = config[status] ?? config.available;
  return (
    <Badge
      variant={variant}
      className={cn("rounded-full px-3 py-1 text-xs font-medium", statusClass, className)}
    >
      {t(key)}
    </Badge>
  );
}
