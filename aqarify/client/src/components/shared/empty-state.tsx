import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      {icon && (
        <div className="mb-4 text-[var(--color-muted-foreground)] opacity-40 text-5xl">{icon}</div>
      )}
      <h3 className="text-base font-semibold text-[var(--color-foreground)] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--color-muted-foreground)] max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
