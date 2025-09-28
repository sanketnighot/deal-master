'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Trophy, X } from "lucide-react";

interface WinModalProps {
  isOpen: boolean
  finalAmount: number
  entryFee: number
  onClose: () => void
  onPlayAgain?: () => void
}

export function WinModal({
  isOpen,
  finalAmount,
  entryFee,
  onClose,
  onPlayAgain
}: WinModalProps) {
  if (!isOpen) return null

  const profit = finalAmount - entryFee
  const isProfit = profit > 0
  const isBreakEven = profit === 0

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
    >
      <div className="crt-overlay" />

      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute top-20 left-20 w-3 h-3 animate-text-flicker"
          style={{
            backgroundColor: isProfit ? "rgb(0, 255, 0)" : "rgb(255, 0, 0)",
          }}
        ></div>
        <div
          className="absolute top-40 right-32 w-2 h-2 animate-text-flicker"
          style={{ backgroundColor: "rgb(255, 255, 0)" }}
        ></div>
        <div
          className="absolute bottom-32 left-40 w-2 h-2 animate-text-flicker"
          style={{ backgroundColor: "rgb(0, 255, 255)" }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-3 h-3 animate-text-flicker"
          style={{ backgroundColor: "rgb(255, 0, 255)" }}
        ></div>
      </div>

      <Card
        variant="pixel"
        className="w-full max-w-lg mx-auto animate-text-flicker relative z-10"
        style={{
          backgroundColor: "rgba(28, 0, 51, 0.95)",
          backdropFilter: "blur(15px)",
        }}
      >
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-20">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="p-2 h-8 w-8 font-pixel"
            style={{
              borderColor: "rgb(0, 255, 255)",
              color: "rgb(0, 255, 255)",
              backgroundColor: "rgba(0, 255, 255, 0.1)",
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <CardHeader className="text-center pb-6 pt-8">
          {/* Trophy Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 border-4 flex items-center justify-center animate-text-flicker"
              style={{
                borderColor: isProfit
                  ? "rgb(0, 255, 0)"
                  : isBreakEven
                    ? "rgb(255, 255, 0)"
                    : "rgb(255, 0, 0)",
                backgroundColor: isProfit
                  ? "rgba(0, 255, 0, 0.1)"
                  : isBreakEven
                    ? "rgba(255, 255, 0, 0.1)"
                    : "rgba(255, 0, 0, 0.1)",
              }}
            >
              <Trophy
                className="h-12 w-12"
                style={{
                  color: isProfit
                    ? "rgb(0, 255, 0)"
                    : isBreakEven
                      ? "rgb(255, 255, 0)"
                      : "rgb(255, 0, 0)",
                }}
              />
            </div>
          </div>

          {/* Title */}
          <CardTitle
            className="text-3xl font-pixel animate-glitch mb-4"
            style={{
              color: isProfit
                ? "rgb(0, 255, 0)"
                : isBreakEven
                  ? "rgb(255, 255, 0)"
                  : "rgb(255, 0, 0)",
            }}
          >
            {isProfit
              ? "🎉 CONGRATULATIONS!"
              : isBreakEven
                ? "🎯 GAME COMPLETE!"
                : "💀 GAME OVER!"}
          </CardTitle>

          {/* Subtitle */}
          <div
            className="text-lg font-pixel"
            style={{ color: "rgb(0, 255, 255)" }}
          >
            {isProfit
              ? "You made a profit!"
              : isBreakEven
                ? "You broke even!"
                : "Better luck next time!"}
          </div>
        </CardHeader>

        <CardContent className="text-center space-y-8 p-8">
          {/* Final Amount Display */}
          <div
            className="border-4 p-6 animate-text-flicker"
            style={{
              borderColor: isProfit
                ? "rgb(0, 255, 0)"
                : isBreakEven
                  ? "rgb(255, 255, 0)"
                  : "rgb(255, 0, 0)",
              backgroundColor: isProfit
                ? "rgba(0, 255, 0, 0.1)"
                : isBreakEven
                  ? "rgba(255, 255, 0, 0.1)"
                  : "rgba(255, 0, 0, 0.1)",
            }}
          >
            <div
              className="text-sm font-pixel mb-3"
              style={{ color: "rgb(0, 255, 255)" }}
            >
              💰 FINAL AMOUNT
            </div>
            <div
              className="text-4xl font-pixel mb-4"
              style={{ color: "rgb(255, 255, 255)" }}
            >
              {formatCurrency(finalAmount)}
            </div>

            {/* Profit/Loss Indicator */}
            <div
              className="text-2xl font-pixel border-t-4 pt-4"
              style={{
                borderTopColor: isProfit
                  ? "rgb(0, 255, 0)"
                  : isBreakEven
                    ? "rgb(255, 255, 0)"
                    : "rgb(255, 0, 0)",
                color: isProfit
                  ? "rgb(0, 255, 0)"
                  : isBreakEven
                    ? "rgb(255, 255, 0)"
                    : "rgb(255, 0, 0)",
              }}
            >
              {isProfit ? "📈 +" : isBreakEven ? "➖ " : "📉 "}
              {formatCurrency(Math.abs(profit))}
            </div>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className="border-2 p-4"
              style={{
                borderColor: "rgba(0, 255, 255, 0.5)",
                backgroundColor: "rgba(0, 255, 255, 0.05)",
              }}
            >
              <div
                className="text-xs font-pixel mb-2"
                style={{ color: "rgb(0, 255, 255)" }}
              >
                💳 Entry Fee
              </div>
              <div
                className="text-lg font-pixel"
                style={{ color: "rgb(255, 255, 255)" }}
              >
                {formatCurrency(entryFee)}
              </div>
            </div>

            <div
              className="border-2 p-4"
              style={{
                borderColor: "rgba(255, 0, 255, 0.5)",
                backgroundColor: "rgba(255, 0, 255, 0.05)",
              }}
            >
              <div
                className="text-xs font-pixel mb-2"
                style={{ color: "rgb(255, 0, 255)" }}
              >
                {isProfit ? "🏆 Profit" : isBreakEven ? "⚖️ Result" : "💸 Loss"}
              </div>
              <div
                className="text-lg font-pixel"
                style={{
                  color: isProfit
                    ? "rgb(0, 255, 0)"
                    : isBreakEven
                      ? "rgb(255, 255, 0)"
                      : "rgb(255, 0, 0)",
                }}
              >
                {isProfit ? "+" : ""}
                {formatCurrency(profit)}
              </div>
            </div>
          </div>

          {/* Result Message */}
          <div
            className="border-4 p-4 animate-text-flicker"
            style={{
              borderColor: isProfit
                ? "rgb(0, 255, 0)"
                : isBreakEven
                  ? "rgb(255, 255, 0)"
                  : "rgb(255, 0, 0)",
              backgroundColor: isProfit
                ? "rgba(0, 255, 0, 0.1)"
                : isBreakEven
                  ? "rgba(255, 255, 0, 0.1)"
                  : "rgba(255, 0, 0, 0.1)",
            }}
          >
            <div
              className="text-sm font-pixel"
              style={{
                color: isProfit
                  ? "rgb(0, 255, 0)"
                  : isBreakEven
                    ? "rgb(255, 255, 0)"
                    : "rgb(255, 0, 0)",
              }}
            >
              {isProfit &&
                `🎊 Amazing! You made a profit of ${formatCurrency(profit)}!`}
              {isBreakEven &&
                "🎯 Perfect balance! You broke even with no profit or loss."}
              {!isProfit &&
                !isBreakEven &&
                `💪 Don't give up! You lost ${formatCurrency(Math.abs(profit))}, but every game is a new chance!`}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 font-pixel"
            >
              CLOSE
            </Button>
            {onPlayAgain && (
              <Button
                variant={isProfit ? "cyan" : "magenta"}
                onClick={onPlayAgain}
                className="flex-1 font-pixel"
              >
                PLAY AGAIN
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
