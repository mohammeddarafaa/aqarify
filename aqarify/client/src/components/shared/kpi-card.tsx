import type { ElementType } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  progress?: number;
  progressColor?: "lime" | "striped" | "default";
  trend?: { value: number; direction: "up" | "down" };
  icon?: ElementType;
  tone?: "default" | "success" | "warning" | "danger";
}

function barClass(color: KpiCardProps["progressColor"]) {
  if (color === "lime") return "bg-lime";
  if (color === "striped") {
    return "bg-[repeating-linear-gradient(135deg,rgb(20_20_20/.18)_0px,rgb(20_20_20/.18)_4px,transparent_4px,transparent_9px)]";
  }
  return "bg-foreground/70";
}

export function KpiCard({
  title,
  value,
  subtitle,
  progress = 0,
  progressColor = "default",
  trend,
  icon: Icon,
  tone = "default",
}: KpiCardProps) {
  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/70 p-5 shadow-[0_24px_70px_-50px_rgb(20_20_20/.65)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold leading-none text-foreground sm:text-3xl">{value}</p>
          {subtitle ? <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {Icon ? (
            <span
              className={cn(
                "grid h-10 w-10 place-items-center rounded-full",
                tone === "success" && "bg-lime/35 text-foreground",
                tone === "warning" && "bg-amber-100 text-amber-900",
                tone === "danger" && "bg-destructive/10 text-destructive",
                tone === "default" && "bg-background text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          {trend ? (
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", trend.direction === "up" ? "bg-lime/45 text-foreground" : "bg-destructive/10 text-destructive")}>
              {trend.direction === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {trend.value}%
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <span className="h-16 w-px bg-foreground/70" />
        <div className="h-9 flex-1 overflow-hidden rounded-full bg-muted/70">
          <div className={cn("h-full rounded-full transition-all", barClass(progressColor))} style={{ width: `${safeProgress}%` }} />
        </div>
      </div>
    </article>
  );
}
