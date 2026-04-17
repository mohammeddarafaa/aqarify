import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type UnitStatus = "available" | "reserved" | "sold";

const config: Record<UnitStatus, { className: string; key: string }> = {
  available: { className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300", key: "status.available" },
  reserved: { className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300", key: "status.reserved" },
  sold: { className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400", key: "status.sold" },
};

export function StatusBadge({ status, className }: { status: UnitStatus; className?: string }) {
  const { t } = useTranslation();
  const { className: statusClass, key } = config[status] ?? config.available;
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", statusClass, className)}>
      {t(key)}
    </Badge>
  );
}
