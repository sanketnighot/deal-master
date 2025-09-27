'use client'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle, Trophy, X } from 'lucide-react'

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-center mb-4">
            {isProfit ? (
              <div className="bg-green-100 rounded-full p-4">
                <Trophy className="h-12 w-12 text-green-600" />
              </div>
            ) : isBreakEven ? (
              <div className="bg-yellow-100 rounded-full p-4">
                <CheckCircle className="h-12 w-12 text-yellow-600" />
              </div>
            ) : (
              <div className="bg-red-100 rounded-full p-4">
                <Trophy className="h-12 w-12 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {isProfit ? 'Congratulations!' : isBreakEven ? 'Game Complete!' : 'Better Luck Next Time!'}
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">Final Amount</div>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(finalAmount)}
              </div>
            </div>

            <div className="flex justify-center items-center space-x-4 text-sm">
              <div className="text-gray-600">
                Entry Fee: <span className="font-medium">{formatCurrency(entryFee)}</span>
              </div>
              <div className={`font-bold ${isProfit ? 'text-green-600' : isBreakEven ? 'text-yellow-600' : 'text-red-600'}`}>
                {isProfit ? '+' : ''}{formatCurrency(profit)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {isProfit && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm font-medium text-green-800">
                  🎉 You made a profit of {formatCurrency(profit)}!
                </div>
              </div>
            )}

            {isBreakEven && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-sm font-medium text-yellow-800">
                  You broke even! No profit, no loss.
                </div>
              </div>
            )}

            {!isProfit && !isBreakEven && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-sm font-medium text-red-800">
                  You lost {formatCurrency(Math.abs(profit))}. Try again!
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            {onPlayAgain && (
              <Button
                variant="primary"
                onClick={onPlayAgain}
                className="flex-1"
              >
                Play Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
