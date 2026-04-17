"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface SpotlightProps {
  className?: string
  fill?: string
}

// Aceternity-inspired Spotlight: a large animated radial glow behind hero content.
// Tenant-aware: defaults to the --color-primary token so it matches branding.
export function Spotlight({ className, fill }: SpotlightProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.35 }}
      transition={{ duration: 1.6, ease: "easeOut" }}
      className={cn(
        "pointer-events-none absolute -top-40 start-1/2 h-[70rem] w-[70rem] -translate-x-1/2 rounded-full blur-3xl",
        className
      )}
      style={{
        background: `radial-gradient(circle at center, ${
          fill ?? "var(--color-primary, #141414)"
        } 0%, transparent 60%)`,
      }}
      aria-hidden="true"
    />
  )
}
