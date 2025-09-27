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
        <div className="text-center px-1">
          <div
            className="text-sm lg:text-base font-pixel mb-1 leading-tight"
            style={{ color: burned ? "rgb(255, 0, 0)" : "rgb(0, 255, 0)" }}
          >
            {formatCurrency(value)}
          </div>
          {burned && (
            <div
              className="text-xs font-pixel animate-text-flicker"
              style={{ color: "rgb(255, 0, 0)" }}
            >
              💀 BURNED
            </div>
          )}
        </div>
      );
    }

    if (isPlayerCase) {
      return (
        <div className="text-center px-1">
          <div
            className="text-xs lg:text-sm font-pixel mb-1 animate-text-flicker leading-tight"
            style={{ color: "rgb(255, 0, 255)" }}
          >
            👑 YOUR CASE
          </div>
          <div
            className="text-xs font-pixel"
            style={{ color: "rgb(255, 0, 255)" }}
          >
            Case {idx + 1}
          </div>
          {gameFinished && (
            <div
              className="text-xs font-pixel mt-1"
              style={{ color: "rgb(255, 255, 255)" }}
            >
              {formatCurrency(value)}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-center px-1">
        <div
          className="text-sm lg:text-base font-pixel mb-1 leading-tight"
          style={{ color: "rgb(0, 255, 255)" }}
        >
          Case {idx + 1}
        </div>
        <div
          className="text-xs font-pixel leading-tight"
          style={{ color: "rgba(0, 255, 255, 0.7)" }}
        >
          {gameFinished ? formatCurrency(value) : "Click to reveal"}
        </div>
      </div>
    );
  };

  const getCardStyles = () => {
    const baseStyle = {
      backgroundColor: "rgba(28, 0, 51, 0.8)",
      border: "4px solid",
      backdropFilter: "blur(10px)",
    };

    if (revealed && burned) {
      return {
        ...baseStyle,
        borderColor: "rgb(255, 0, 0)",
        boxShadow: "inset 0 0 10px rgb(255, 0, 0), 0 0 20px rgb(255, 0, 0)",
      };
    }

    if (revealed) {
      return {
        ...baseStyle,
        borderColor: "rgb(0, 255, 0)",
        boxShadow: "inset 0 0 10px rgb(0, 255, 0), 0 0 20px rgb(0, 255, 0)",
      };
    }

    if (isPlayerCase) {
      return {
        ...baseStyle,
        borderColor: "rgb(255, 0, 255)",
        boxShadow: "inset 0 0 10px rgb(255, 0, 255), 0 0 20px rgb(255, 0, 255)",
      };
    }

    return {
      ...baseStyle,
      borderColor: "rgb(0, 255, 255)",
      boxShadow: "inset 0 0 10px rgb(0, 255, 255)",
    };
  };

  const cardStyles = getCardStyles();

  return (
    <button
      data-testid={`case-${idx}`}
      className={cn(
        "w-full h-28 lg:h-32 transition-all duration-200 flex items-center justify-center font-pixel",
        "focus:outline-none hover:scale-105 active:scale-95",
        {
          "cursor-pointer animate-text-flicker":
            !disabled && !revealed && !gameFinished && !isPlayerCase,
          "cursor-not-allowed opacity-50": disabled,
          "cursor-default": revealed || gameFinished,
          "animate-text-flicker": isPlayerCase,
        }
      )}
      style={cardStyles}
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
  );
}
