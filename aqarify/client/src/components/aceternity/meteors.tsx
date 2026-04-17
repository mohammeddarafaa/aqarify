"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface MeteorsProps {
  number?: number
  className?: string
}

// Aceternity-inspired Meteors: small streaking lines animated across a container.
export function Meteors({ number = 20, className }: MeteorsProps) {
  const meteors = useMemo(
    () =>
      new Array(number).fill(null).map(() => ({
        top: Math.floor(Math.random() * 100),
        left: Math.floor(Math.random() * 100),
        delay: Math.random() * 5,
        duration: 5 + Math.random() * 5,
      })),
    [number]
  )

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {meteors.map((m, idx) => (
        <span
          key={idx}
          className={cn(
            "absolute h-[1px] w-[80px] rotate-[215deg] animate-[meteor_linear_infinite] rounded-full bg-slate-400",
            "before:absolute before:top-1/2 before:h-[1px] before:w-[50px] before:-translate-y-1/2 before:transform before:bg-gradient-to-r before:from-slate-400 before:to-transparent before:content-['']",
            className
          )}
          style={{
            top: `${m.top}%`,
            left: `${m.left}%`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
