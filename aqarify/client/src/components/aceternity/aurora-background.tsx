"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface AuroraBackgroundProps {
  children?: ReactNode
  className?: string
  showRadialGradient?: boolean
}

// Aceternity-inspired Aurora: multi-layer animated gradient background.
// Respects tenant brand via --color-primary / --color-gold tokens.
export function AuroraBackground({
  children,
  className,
  showRadialGradient = true,
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_55%),linear-gradient(135deg,color-mix(in_oklab,var(--color-primary)_10%,white),white_40%,color-mix(in_oklab,var(--color-accent,#d4a84b)_10%,white))]",
        className,
      )}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 opacity-80",
            "bg-[linear-gradient(115deg,transparent_15%,color-mix(in_oklab,var(--color-primary)_22%,transparent)_35%,transparent_55%,color-mix(in_oklab,var(--color-accent,#d4a84b)_18%,transparent)_75%,transparent)]",
            showRadialGradient &&
              "[mask-image:radial-gradient(circle_at_top,black,transparent_72%)]",
          )}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}
