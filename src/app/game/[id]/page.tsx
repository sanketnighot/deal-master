'use client'

import { BankerModal } from "@/components/game/BankerModal";
import { CardGrid } from "@/components/game/CardGrid";
import { GameControls } from "@/components/game/GameControls";
import { WinModal } from "@/components/game/WinModal";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { useGameApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, DollarSign, Trophy } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Disable static generation for this page
export const dynamic = "force-dynamic";

interface GameState {
  id: string;
  status: string;
  entry_fee_cents: number;
  player_case: number | null;
  banker_offer_cents: number | null;
  accepted_deal: boolean;
  final_won_cents: number | null;
  cards: Array<{
    idx: number;
    value_cents: number;
    revealed: boolean;
    burned: boolean;
  }>;
}

export default function GamePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { getGameState, pickCase, burnCase, acceptDeal, finalReveal } =
    useGameApi();
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const gameId = params.id as string;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showBankerModal, setShowBankerModal] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [lastBurnedCase, setLastBurnedCase] = useState<{
    idx: number;
    value_cents: number;
  } | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // Load game state
  useEffect(() => {
    if (gameId) {
      loadGameState();
    }
  }, [gameId]);

  // Show win modal when game is finished
  useEffect(() => {
    if (
      gameState?.status === "FINISHED" &&
      gameState.final_won_cents !== null
    ) {
      setShowWinModal(true);
    }
  }, [gameState?.status, gameState?.final_won_cents]);

  // Show win modal immediately if game is already finished when page loads
  useEffect(() => {
    if (
      gameState?.status === "FINISHED" &&
      gameState.final_won_cents !== null &&
      !showWinModal
    ) {
      setShowWinModal(true);
    }
  }, [gameState, showWinModal]);

  const loadGameState = async () => {
    try {
      setLoading(true);
      const response = await getGameState(gameId);

      if (response.success) {
        setGameState(response.game);
      } else {
        addToast({
          type: "error",
          title: "Failed to Load Game",
          message: response.error || "Please try again later",
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to Load Game",
        message: "Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (idx: number) => {
    if (!gameState || actionLoading) return;

    try {
      setActionLoading(true);

      if (gameState.player_case === null) {
        // Pick case
        const response = await pickCase(gameId, idx);
        if (response.success) {
          await loadGameState(); // Reload state
          addToast({
            type: "success",
            title: "Case Selected",
            message: `You chose Case ${idx + 1}!`,
          });
        } else {
          addToast({
            type: "error",
            title: "Failed to Pick Case",
            message: response.error || "Please try again",
          });
        }
      } else if (
        gameState.player_case !== idx &&
        !gameState.cards.find((c) => c.idx === idx)?.revealed
      ) {
        // Burn case
        const response = await burnCase(gameId, idx);
        if (response.success) {
          await loadGameState(); // Reload state

          // Check if game was auto-completed
          if (response.game_completed) {
            addToast({
              type: "success",
              title: "Game Complete!",
              message: response.message || "Congratulations!",
            });
            // The win modal will be shown automatically by the useEffect
          } else {
            addToast({
              type: "success",
              title: "Case Burned",
              message: response.message || `Case ${idx + 1} burned!`,
            });

            // Show banker modal if offer is available
            if (response.banker_offer) {
              setLastBurnedCase(response.burned_case);
              setShowBankerModal(true);
            }
          }
        } else {
          addToast({
            type: "error",
            title: "Failed to Burn Case",
            message: response.error || "Please try again",
          });
        }
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Action Failed",
        message: "Please try again",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptDeal = async () => {
    try {
      setActionLoading(true);
      const response = await acceptDeal(gameId);

      if (response.success) {
        await loadGameState(); // Reload state
        setShowBankerModal(false);
        addToast({
          type: "success",
          title: "Deal Accepted!",
          message: `You won ${response.final_won_display}!`,
        });
      } else {
        addToast({
          type: "error",
          title: "Failed to Accept Deal",
          message: response.error || "Please try again",
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to Accept Deal",
        message: "Please try again",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDeal = () => {
    setShowBankerModal(false);
    addToast({
      type: "info",
      title: "Deal Rejected",
      message: "Continue playing to the final reveal!",
    });
  };

  const handleFinalReveal = async (swap: boolean) => {
    try {
      setActionLoading(true);
      const response = await finalReveal(gameId, swap);

      if (response.success) {
        await loadGameState(); // Reload state
        addToast({
          type: "success",
          title: "Game Complete!",
          message: `You won ${response.final_won_display}!`,
        });
      } else {
        addToast({
          type: "error",
          title: "Failed to Reveal",
          message: response.error || "Please try again",
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to Reveal",
        message: "Please try again",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to home
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Game Not Found
              </h2>
              <p className="text-gray-600 mb-4">
                The game you're looking for doesn't exist or you don't have
                access to it.
              </p>
              <Button
                variant="primary"
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2 mx-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const unrevealedCount = gameState.cards.filter((c) => !c.revealed).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />

      <div className="container mx-auto px-4 py-8">
        {/* Game Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>

            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-600">Game #{gameState.id}</div>
              {gameState.status === "FINISHED" && (
                <div className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Completed
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <DollarSign className="h-5 w-5 text-primary-600" />
                  <span className="font-semibold">Entry Fee</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(gameState.entry_fee_cents)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold">Cases Left</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {unrevealedCount}
                </div>
              </CardContent>
            </Card>

            {gameState.final_won_cents && (
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Trophy className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">You Won</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(gameState.final_won_cents)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Game Results Banner */}
        {gameState.status === "FINISHED" && (
          <div className="max-w-4xl mx-auto mb-6">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-800 mb-2">
                  🎉 Game Complete!
                </div>
                <div className="text-lg text-green-700">
                  You won{" "}
                  <span className="font-bold">
                    {formatCurrency(gameState.final_won_cents || 0)}
                  </span>
                </div>
                <div className="text-sm text-green-600 mt-2">
                  Entry Fee: {formatCurrency(gameState.entry_fee_cents)} |
                  Profit:{" "}
                  {formatCurrency(
                    (gameState.final_won_cents || 0) - gameState.entry_fee_cents
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Game Board */}
        <div className="max-w-4xl mx-auto">
          <CardGrid
            cards={gameState.cards}
            playerCase={gameState.player_case}
            onCardClick={handleCardClick}
            gameStatus={gameState.status}
            className="mb-8"
          />

          {/* Game Controls */}
          <Card>
            <CardContent className="p-6">
              <GameControls
                gameStatus={gameState.status}
                playerCase={gameState.player_case}
                bankerOffer={gameState.banker_offer_cents}
                unrevealedCount={unrevealedCount}
                onPickCase={handleCardClick}
                onBurnCase={handleCardClick}
                onAcceptDeal={handleAcceptDeal}
                onFinalReveal={handleFinalReveal}
                loading={actionLoading}
              />
            </CardContent>
          </Card>
        </div>

        {/* Banker Modal */}
        <BankerModal
          isOpen={showBankerModal}
          offer={gameState.banker_offer_cents || 0}
          lastBurnedCase={lastBurnedCase}
          onAccept={handleAcceptDeal}
          onReject={handleRejectDeal}
          loading={actionLoading}
        />

        {/* Win Modal */}
        {gameState.final_won_cents !== null && (
          <WinModal
            isOpen={showWinModal}
            finalAmount={gameState.final_won_cents}
            entryFee={gameState.entry_fee_cents}
            onClose={() => {
              setShowWinModal(false);
              router.push("/dashboard");
            }}
            onPlayAgain={() => {
              setShowWinModal(false);
              router.push("/dashboard");
            }}
          />
        )}
      </div>
    </div>
  );
}
