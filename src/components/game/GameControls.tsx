'use client'

import { Button } from "@/components/ui/button";
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
        <div
          className="text-xl font-pixel animate-glitch"
          style={{ color: "rgb(0, 255, 0)" }}
        >
          🎉 GAME COMPLETE!
        </div>
        <div
          className="text-sm font-pixel"
          style={{ color: "rgb(0, 255, 255)" }}
        >
          Check the results above to see your final winnings!
        </div>
        <div
          className="text-xs font-pixel animate-text-flicker"
          style={{ color: "rgba(0, 255, 255, 0.7)" }}
        >
          Click on any case to see its revealed value
        </div>
      </div>
    );
  }

  if (phase === "pick") {
    return (
      <div className="text-center space-y-6">
        <div
          className="text-xl lg:text-2xl font-pixel animate-text-flicker"
          style={{ color: "rgb(255, 255, 0)" }}
        >
          🎯 CHOOSE YOUR CASE
        </div>
        <div
          className="text-sm lg:text-base font-pixel max-w-lg mx-auto leading-relaxed"
          style={{ color: "rgb(0, 255, 255)" }}
        >
          Click on any case to select it as yours. You'll keep this case
          throughout the game and face the banker's offers!
        </div>
      </div>
    );
  }

  if (phase === "final") {
    return (
      <div className="text-center space-y-6">
        <div
          className="text-xl lg:text-2xl font-pixel animate-glitch"
          style={{ color: "rgb(255, 0, 255)" }}
        >
          ⚡ FINAL DECISION
        </div>
        <div
          className="text-sm lg:text-base font-pixel mb-4 max-w-lg mx-auto leading-relaxed"
          style={{ color: "rgb(0, 255, 255)" }}
        >
          Only 2 cases remain! You can keep your case or swap it with the other
          remaining case. Choose wisely!
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
          <Button
            variant="magenta"
            size="lg"
            onClick={() => onFinalReveal(false)}
            loading={loading}
            className="w-full"
          >
            👑 KEEP MY CASE
          </Button>
          <Button
            variant="cyan"
            size="lg"
            onClick={() => onFinalReveal(true)}
            loading={loading}
            className="w-full"
          >
            🔄 SWAP CASES
          </Button>
        </div>
        {bankerOffer && (
          <div
            className="border-4 p-6 mt-8 animate-text-flicker max-w-sm mx-auto"
            style={{
              borderColor: "rgb(255, 255, 0)",
              backgroundColor: "rgba(255, 255, 0, 0.1)",
            }}
          >
            <div
              className="text-sm lg:text-base font-pixel mb-3 text-center"
              style={{ color: "rgb(255, 255, 0)" }}
            >
              🏦 BANKER'S FINAL OFFER
            </div>
            <div
              className="text-2xl lg:text-3xl font-pixel mb-4 text-center"
              style={{ color: "rgb(255, 255, 255)" }}
            >
              {formatCurrency(bankerOffer)}
            </div>
            <Button
              variant="outline"
              onClick={onAcceptDeal}
              loading={loading}
              className="w-full"
            >
              💰 ACCEPT DEAL
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (phase === "burn") {
    return (
      <div className="text-center space-y-6">
        <div
          className="text-xl lg:text-2xl font-pixel animate-text-flicker"
          style={{ color: "rgb(255, 0, 0)" }}
        >
          🔥 BURN A CASE
        </div>
        <div
          className="text-sm lg:text-base font-pixel max-w-lg mx-auto leading-relaxed"
          style={{ color: "rgb(0, 255, 255)" }}
        >
          Click on any case (except yours) to reveal its value and eliminate it
          from the game. The banker is watching...
        </div>
        {bankerOffer && (
          <div
            className="border-4 p-6 animate-text-flicker max-w-sm mx-auto"
            style={{
              borderColor: "rgb(255, 255, 0)",
              backgroundColor: "rgba(255, 255, 0, 0.1)",
            }}
          >
            <div
              className="text-sm lg:text-base font-pixel mb-3 text-center"
              style={{ color: "rgb(255, 255, 0)" }}
            >
              🏦 BANKER'S OFFER
            </div>
            <div
              className="text-2xl lg:text-3xl font-pixel mb-4 text-center"
              style={{ color: "rgb(255, 255, 255)" }}
            >
              {formatCurrency(bankerOffer)}
            </div>
            <Button
              variant="outline"
              onClick={onAcceptDeal}
              loading={loading}
              className="w-full"
            >
              💰 ACCEPT DEAL
            </Button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
