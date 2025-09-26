'use client'

import { cn } from '@/lib/utils'
import { GameCard } from './GameCard'

interface CardGridProps {
  cards: Array<{
    idx: number
    value_cents: number
    revealed: boolean
    burned: boolean
  }>
  playerCase: number | null
  onCardClick?: (idx: number) => void
  gameStatus: string
  className?: string
}

export function CardGrid({
  cards,
  playerCase,
  onCardClick,
  gameStatus,
  className
}: CardGridProps) {
  const sortedCards = [...cards].sort((a, b) => a.idx - b.idx)

  return (
    <div className={cn('grid grid-cols-5 gap-4 max-w-2xl mx-auto', className)}>
      {sortedCards.map((card) => (
        <GameCard
          key={card.idx}
          idx={card.idx}
          value={card.value_cents}
          revealed={card.revealed}
          burned={card.burned}
          isPlayerCase={card.idx === playerCase}
          onClick={() => onCardClick?.(card.idx)}
          disabled={gameStatus !== 'PLAYING'}
        />
      ))}
    </div>
  )
}
