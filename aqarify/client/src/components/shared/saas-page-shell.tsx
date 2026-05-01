import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SaaSPageShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SaaSPageShell({
  title,
  description,
  actions,
  children,
  className,
}: SaaSPageShellProps) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 py-8", className)}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}
