import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface BentoGridProps {
  className?: string
  children: ReactNode
}

interface BentoGridItemProps {
  className?: string
  title?: ReactNode
  description?: ReactNode
  icon?: ReactNode
  header?: ReactNode
  href?: string
}

export function BentoGrid({ className, children }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-3 md:auto-rows-[16rem] lg:gap-6",
        className
      )}
    >
      {children}
    </div>
  )
}

export function BentoGridItem({
  className,
  title,
  description,
  icon,
  header,
}: BentoGridItemProps) {
  return (
    <div
      className={cn(
        "group/bento relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      {header ? <div className="min-h-[6rem]">{header}</div> : null}
      <div className="flex flex-col gap-1.5 pt-4 transition-transform duration-200 group-hover/bento:translate-y-[-2px]">
        {icon ? <div className="text-foreground/80">{icon}</div> : null}
        {title ? (
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        ) : null}
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
}
