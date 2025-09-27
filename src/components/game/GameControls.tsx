'use client'

import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

interface GameControlsProps {
  gameStatus: string;
  playerCase: number | null;
  bankerOffer: number | null;
  unrevealedCount: number;
  onPickCase: (idx: number) => void;
  onBurnCase: (idx: number) => void;
  onAcceptDeal: () => void;
  onFinalReveal: (swap: boolean) => void;
  loading?: boolean;
}

export function GameControls({
  gameStatus,
  playerCase,
  bankerOffer,
  unrevealedCount,
  onPickCase,
  onBurnCase,
  onAcceptDeal,
  onFinalReveal,
  loading = false,
}: GameControlsProps) {
  const getGamePhase = () => {
    if (gameStatus !== "PLAYING") return "finished";
    if (playerCase === null) return "pick";
    if (unrevealedCount === 2) return "final";
    return "burn";
  };

  const phase = getGamePhase();

  if (phase === "finished") {
    return (
      <div className="text-center space-y-4">
        <div className="text-lg font-semibold text-gray-600">
          🎉 Game Complete!
        </div>
        <div className="text-sm text-gray-500">
          Check the results above to see your final winnings!
        </div>
        <div className="text-xs text-gray-400">
          Click on any case to see its revealed value
        </div>
      </div>
    );
  }

  if (phase === "pick") {
    return (
      <div className="text-center space-y-4">
        <div className="text-lg font-semibold text-gray-800">
          Choose Your Case
        </div>
        <div className="text-sm text-gray-600">
          Click on any case to select it as yours. You'll keep this case
          throughout the game.
        </div>
      </div>
    );
  }

  if (phase === "final") {
    return (
      <div className="text-center space-y-4">
        <div className="text-lg font-semibold text-gray-800">
          Final Decision
        </div>
        <div className="text-sm text-gray-600 mb-4">
          Only 2 cases remain! You can keep your case or swap it with the other
          remaining case.
        </div>
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => onFinalReveal(false)}
            loading={loading}
            className="w-full"
          >
            Keep My Case
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onFinalReveal(true)}
            loading={loading}
            className="w-full"
          >
            Swap Cases
          </Button>
        </div>
        {bankerOffer && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <div className="text-sm font-medium text-yellow-800 mb-2">
              🏦 Banker's Offer
            </div>
            <div className="text-2xl font-bold text-yellow-900 mb-3">
              {formatCurrency(bankerOffer)}
            </div>
            <Button
              variant="secondary"
              onClick={onAcceptDeal}
              loading={loading}
              className="w-full"
            >
              Accept Deal
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (phase === "burn") {
    return (
      <div className="text-center space-y-4">
        <div className="text-lg font-semibold text-gray-800">Burn a Case</div>
        <div className="text-sm text-gray-600">
          Click on any case (except yours) to reveal its value and remove it
          from the game.
        </div>
        {bankerOffer && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-sm font-medium text-yellow-800 mb-2">
              🏦 Banker's Offer
            </div>
            <div className="text-2xl font-bold text-yellow-900 mb-3">
              {formatCurrency(bankerOffer)}
            </div>
            <Button
              variant="primary"
              onClick={onAcceptDeal}
              loading={loading}
              className="w-full"
            >
              Accept Deal
            </Button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
