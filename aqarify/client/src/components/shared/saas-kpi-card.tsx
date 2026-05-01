import type { ElementType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

interface SaaSKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ElementType;
  tone?: "default" | "success" | "warning" | "danger";
}

const toneClass: Record<NonNullable<SaaSKpiCardProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-100/70 text-emerald-700",
  warning: "bg-amber-100/70 text-amber-700",
  danger: "bg-destructive/10 text-destructive",
};

export function SaaSKpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "default",
}: SaaSKpiCardProps) {
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
            {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          {Icon ? (
            <div className={cn("inline-flex size-9 items-center justify-center rounded-lg", toneClass[tone])}>
              <Icon className="size-4" />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
