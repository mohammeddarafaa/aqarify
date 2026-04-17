"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface InfiniteMovingCard {
  quote: string
  name: string
  title?: string
}

interface InfiniteMovingCardsProps {
  items: InfiniteMovingCard[]
  direction?: "left" | "right"
  speed?: "fast" | "normal" | "slow"
  pauseOnHover?: boolean
  className?: string
}

export function InfiniteMovingCards({
  items,
  direction = "left",
  speed = "normal",
  pauseOnHover = true,
  className,
}: InfiniteMovingCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLUListElement>(null)
  const [start, setStart] = useState(false)

  useEffect(() => {
    if (!containerRef.current || !scrollerRef.current) return
    const scroller = scrollerRef.current

    Array.from(scroller.children).forEach((child) => {
      const clone = child.cloneNode(true) as HTMLElement
      scroller.appendChild(clone)
    })

    const container = containerRef.current
    container.style.setProperty(
      "--animation-direction",
      direction === "left" ? "forwards" : "reverse"
    )
    const durationMap = { fast: "20s", normal: "40s", slow: "80s" }
    container.style.setProperty("--animation-duration", durationMap[speed])

    setStart(true)
  }, [direction, speed])

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-10 max-w-full overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
          start && "animate-[infinite-scroll_var(--animation-duration)_linear_infinite]",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
        style={{ animationDirection: "var(--animation-direction)" as never }}
      >
        {items.map((item, idx) => (
          <li
            key={`${item.name}-${idx}`}
            className="relative w-[22rem] max-w-full shrink-0 rounded-xl border border-border bg-card px-6 py-5 shadow-sm"
          >
            <blockquote className="text-sm leading-relaxed text-foreground">
              "{item.quote}"
            </blockquote>
            <div className="mt-4 flex flex-col">
              <span className="text-sm font-medium text-foreground">{item.name}</span>
              {item.title ? (
                <span className="text-xs text-muted-foreground">{item.title}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
