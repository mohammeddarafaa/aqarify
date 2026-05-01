import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        /** Table / workflow status — contrast-safe even when tenant `--secondary` is dark */
        success:
          "border border-[color-mix(in_oklch,var(--status-success)_35%,transparent)] bg-[color-mix(in_oklch,var(--status-success)_16%,var(--card))] font-medium text-[var(--status-success)] dark:bg-[color-mix(in_oklch,var(--status-success)_14%,var(--card))] [a]:hover:bg-[color-mix(in_oklch,var(--status-success)_24%,var(--card))]",
        warning:
          "border border-[color-mix(in_oklch,var(--status-warning)_38%,transparent)] bg-[color-mix(in_oklch,var(--status-warning)_14%,var(--card))] font-medium text-[color-mix(in_oklch,var(--status-warning)_92%,var(--foreground))] dark:bg-[color-mix(in_oklch,var(--status-warning)_12%,var(--card))] [a]:hover:bg-[color-mix(in_oklch,var(--status-warning)_22%,var(--card))]",
        muted:
          "border border-border bg-muted font-medium text-muted-foreground [a]:hover:bg-muted/80",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
