"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

export interface FocusCard {
  id: string | number
  title: string
  src: string
  href?: string
  subtitle?: string
}

interface FocusCardsProps {
  cards: FocusCard[]
  className?: string
  onCardClick?: (card: FocusCard) => void
}

// Aceternity-inspired FocusCards: hovering one dims all others.
export function FocusCards({ cards, className, onCardClick }: FocusCardsProps) {
  const [hovered, setHovered] = useState<string | number | null>(null)
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {cards.map((card) => {
        const isDimmed = hovered !== null && hovered !== card.id
        return (
          <motion.button
            key={card.id}
            type="button"
            onMouseEnter={() => setHovered(card.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onCardClick?.(card)}
            animate={{ opacity: isDimmed ? 0.55 : 1, scale: isDimmed ? 0.98 : 1 }}
            transition={{ duration: 0.25 }}
            className="group/focus relative h-72 w-full overflow-hidden rounded-xl text-start"
          >
            <img
              src={card.src}
              alt={card.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/focus:scale-[1.04]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <div className="text-lg font-semibold">{card.title}</div>
              {card.subtitle ? (
                <div className="text-xs text-white/80">{card.subtitle}</div>
              ) : null}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
