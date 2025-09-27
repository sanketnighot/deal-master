'use client'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

interface BankerModalProps {
  isOpen: boolean;
  offer: number;
  lastBurnedCase?: { idx: number; value_cents: number } | null;
  onAccept: () => void;
  onReject: () => void;
  loading?: boolean;
}

export function BankerModal({
  isOpen,
  offer,
  lastBurnedCase,
  onAccept,
  onReject,
  loading = false,
}: BankerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            🏦 The Banker's Offer
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          {lastBurnedCase && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm font-medium text-red-800 mb-1">
                Last Case Opened
              </div>
              <div className="text-lg font-bold text-red-900">
                Case {lastBurnedCase.idx + 1}:{" "}
                {formatCurrency(lastBurnedCase.value_cents)}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-gray-600">
              The banker has made you an offer for your case:
            </p>
            <div className="text-4xl font-bold text-primary-600">
              {formatCurrency(offer)}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Do you want to accept this offer, or continue playing?
            </p>

            <div className="flex gap-3">
              <Button
                variant="primary"
                size="lg"
                className="flex-1 text-black"
                onClick={onAccept}
                loading={loading}
              >
                Accept Deal
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={onReject}
                disabled={loading}
              >
                No Deal
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-400">
            Remember: You can only accept or reject once!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
