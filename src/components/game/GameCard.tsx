'use client'

import { cn, formatCurrency } from '@/lib/utils'

interface GameCardProps {
  idx: number
  value: number
  revealed: boolean
  burned: boolean
  isPlayerCase: boolean
  onClick?: () => void
  disabled?: boolean
  gameFinished?: boolean
}

export function GameCard({
  idx,
  value,
  revealed,
  burned,
  isPlayerCase,
  onClick,
  disabled = false,
  gameFinished = false
}: GameCardProps) {
  const getCardContent = () => {
    if (revealed) {
      return (
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">
            {formatCurrency(value)}
          </div>
          {burned && (
            <div className="text-xs text-red-600 mt-1 font-medium">
              BURNED
            </div>
          )}
        </div>
      )
    }

    if (isPlayerCase) {
      return (
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">
            YOUR CASE
          </div>
          <div className="text-xs text-primary-500 mt-1">
            Case {idx + 1}
          </div>
          {gameFinished && (
            <div className="text-xs text-primary-400 mt-1">
              {formatCurrency(value)}
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-600">
          Case {idx + 1}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {gameFinished ? formatCurrency(value) : 'Click to reveal'}
        </div>
      </div>
    )
  }

  const getCardStyles = () => {
    if (revealed && burned) {
      return 'bg-red-100 border-red-300 text-red-800'
    }

    if (revealed) {
      return 'bg-green-100 border-green-300 text-green-800'
    }

    if (isPlayerCase) {
      return 'bg-primary-100 border-primary-300 text-primary-800 hover:bg-primary-200'
    }

    return 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'
  }

  return (
    <button
      data-testid={`case-${idx}`}
      className={cn(
        'w-full h-32 rounded-lg border-2 transition-all duration-200 flex items-center justify-center',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
        getCardStyles(),
        {
          'cursor-pointer': !disabled && !revealed && !gameFinished,
          'cursor-not-allowed opacity-50': disabled,
          'cursor-default': revealed || gameFinished,
        }
      )}
      onClick={onClick}
      disabled={disabled || revealed || gameFinished}
      aria-label={
        revealed
          ? `Case ${idx + 1} revealed: ${formatCurrency(value)}`
          : isPlayerCase
            ? `Your case ${idx + 1}`
            : `Case ${idx + 1} - click to reveal`
      }
    >
      {getCardContent()}
    </button>
  )
}
