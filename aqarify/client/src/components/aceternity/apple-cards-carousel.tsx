"use client"

import { useRef, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AppleCard {
  id: string | number
  category?: string
  title: string
  src: string
  href?: string
}

interface AppleCardsCarouselProps {
  items: AppleCard[]
  onCardClick?: (card: AppleCard) => void
  className?: string
}

// Aceternity-inspired Apple-style horizontal carousel with snap scroll.
export function AppleCardsCarousel({
  items,
  onCardClick,
  className,
}: AppleCardsCarouselProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

  function updateButtons() {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  function scrollBy(dir: -1 | 1) {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" })
  }

  return (
    <div className={cn("relative", className)}>
      <div
        ref={ref}
        onScroll={updateButtons}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-thin"
      >
        {items.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onCardClick?.(card)}
            className="relative h-[28rem] w-72 shrink-0 snap-start overflow-hidden rounded-2xl text-start shadow-md transition-transform hover:-translate-y-1"
          >
            <img
              src={card.src}
              alt={card.title}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              {card.category ? (
                <div className="text-[0.7rem] font-medium uppercase tracking-[0.15em] text-white/85">
                  {card.category}
                </div>
              ) : null}
              <div className="mt-1 text-2xl font-semibold leading-tight">
                {card.title}
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-1">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          disabled={!canLeft}
          className="pointer-events-auto grid size-10 place-items-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition-opacity disabled:opacity-0"
          aria-label="Previous"
        >
          <ChevronLeftIcon className="size-5" />
        </button>
      </div>
      <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-1">
        <button
          type="button"
          onClick={() => scrollBy(1)}
          disabled={!canRight}
          className="pointer-events-auto grid size-10 place-items-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition-opacity disabled:opacity-0"
          aria-label="Next"
        >
          <ChevronRightIcon className="size-5" />
        </button>
      </div>
    </div>
  )
}
