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
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}
