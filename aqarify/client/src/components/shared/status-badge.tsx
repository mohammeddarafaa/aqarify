import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type UnitStatus = "available" | "reserved" | "sold";

const config: Record<UnitStatus, { className: string; key: string }> = {
  available: { className: "border-lime/40 bg-lime text-lime-foreground", key: "status.available" },
  reserved: { className: "border-border bg-muted text-muted-foreground", key: "status.reserved" },
  sold: { className: "border-destructive/20 bg-destructive/10 text-destructive", key: "status.sold" },
};

export function StatusBadge({ status, className }: { status: UnitStatus; className?: string }) {
  const { t } = useTranslation();
  const { className: statusClass, key } = config[status] ?? config.available;
  return (
    <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-xs font-medium", statusClass, className)}>
      {t(key)}
    </Badge>
  );
}
