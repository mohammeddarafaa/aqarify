import { cn } from "@/lib/utils";

interface PillBarChartProps {
  data: { day: number; value: number }[];
  activeDay?: number;
  height?: number;
}

export function PillBarChart({ data, activeDay, height = 220 }: PillBarChartProps) {
  const max = Math.max(...data.map((item) => Math.abs(item.value)), 1);

  return (
    <div className="flex w-full items-end gap-2 overflow-x-auto pb-1" style={{ minHeight: height }}>
      {data.map((item, index) => {
        const isActive = item.day === activeDay;
        const isDark = index % 4 === 3 || index % 7 === 5;
        const fillHeight = `${Math.max(28, (Math.abs(item.value) / max) * 100)}%`;

        return (
          <div key={item.day} className="flex min-w-9 flex-1 flex-col items-center justify-end gap-2">
            <div className="flex h-32 w-8 items-end rounded-full border border-foreground/20 bg-background/45 p-0.5">
              <div
                className={cn(
                  "w-full rounded-full",
                  isActive ? "bg-lime" : isDark ? "bg-foreground" : "bg-muted-foreground/55",
                )}
                style={{ height: fillHeight }}
              />
            </div>
            <span
              className={cn(
                "grid h-9 min-w-9 place-items-center rounded-full px-2 text-xs text-muted-foreground",
                isActive && "bg-foreground text-background",
                !isActive && index % 5 === 0 && "bg-muted-foreground/45 text-background",
              )}
            >
              {item.day}
            </span>
          </div>
        );
      })}
      <span className="ms-2 pb-11 text-xs text-muted-foreground">daily</span>
    </div>
  );
}
