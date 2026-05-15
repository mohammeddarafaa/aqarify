import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Inner content for banner-style alerts (title, optional body, time on the right). */
export function PushNotificationContent({
  title,
  description,
  time = "now",
  className,
}: {
  title: ReactNode;
  description?: string;
  time?: string;
  className?: string;
}) {
  const hasBody = Boolean(description);

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-0.5",
        /* Title-only: vertically center with the squircle icon (44px); with body: align tops */
        !hasBody && "self-center",
        className,
      )}
    >
      {/* Timestamp stays top-right when title wraps (system-notification pattern). */}
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
          {title}
        </span>
        <span className="shrink-0 text-[0.6875rem] font-medium tabular-nums text-[var(--color-muted-foreground)]">
          {time}
        </span>
      </div>
      {description ? (
        <p className="text-[0.8125rem] leading-snug text-[var(--color-muted-foreground)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

const squircleByVariant = {
  success:
    "bg-[color-mix(in_oklch,var(--status-success)_22%,transparent)] text-[var(--status-success)]",
  error: "bg-[color-mix(in_oklch,var(--status-error)_24%,transparent)] text-[var(--status-error)]",
  info: "bg-[color-mix(in_oklch,var(--status-info)_24%,transparent)] text-[var(--status-info)]",
  warning:
    "bg-[color-mix(in_oklch,var(--status-warning)_26%,transparent)] text-[var(--status-warning)]",
  loading:
    "bg-[color-mix(in_oklch,var(--color-foreground)_10%,transparent)] text-[var(--color-foreground)]",
  neutral:
    "bg-[color-mix(in_oklch,var(--color-foreground)_10%,transparent)] text-[var(--color-foreground)]",
} as const;

export type PushVariant = keyof typeof squircleByVariant;

export function PushNotificationIconFrame({
  variant,
  children,
}: {
  variant: PushVariant;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-[14px] [&_svg]:size-5",
        squircleByVariant[variant],
      )}
    >
      {children}
    </span>
  );
}
