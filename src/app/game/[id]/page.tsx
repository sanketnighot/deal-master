'use client'

import { BankerModal } from "@/components/game/BankerModal";
import { CardGrid } from "@/components/game/CardGrid";
import { GameControls } from "@/components/game/GameControls";
import { WinModal } from "@/components/game/WinModal";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: "rgb(28, 0, 51)" }}
    >
      <div className="crt-overlay" />

      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute top-10 left-10 w-2 h-2 animate-text-flicker"
          style={{ backgroundColor: "rgb(255, 0, 255)" }}
        ></div>
        <div
          className="absolute top-32 right-20 w-2 h-2 animate-text-flicker"
          style={{ backgroundColor: "rgb(0, 255, 255)" }}
        ></div>
        <div
          className="absolute bottom-20 left-32 w-2 h-2 animate-text-flicker"
          style={{ backgroundColor: "rgb(255, 255, 0)" }}
        ></div>
        <div
          className="absolute bottom-40 right-16 w-2 h-2 animate-text-flicker"
          style={{ backgroundColor: "rgb(255, 0, 255)" }}
        ></div>
      </div>

      <TopBar />

      <div className="container mx-auto px-4 py-6 relative z-10 max-w-6xl">
        {/* Game Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <Button
              variant="cyan"
              onClick={() => router.push("/dashboard")}
              className="flex items-center space-x-2 w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>← BACK TO DASHBOARD</span>
            </Button>

            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
              <div
                className="text-base font-pixel"
                style={{ color: "rgb(0, 255, 255)" }}
              >
                Game #{gameState.id.slice(0, 8)}...{gameState.id.slice(-4)}
              </div>
              {gameState.status === "FINISHED" && (
                <div
                  className="px-4 py-2 text-sm font-pixel border-2 w-fit animate-text-flicker"
                  style={{
                    borderColor: "rgb(0, 255, 0)",
                    color: "rgb(0, 255, 0)",
                    backgroundColor: "rgba(0, 255, 0, 0.1)",
                  }}
                >
                  ✅ COMPLETED
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex flex-col lg:flex-row gap-6 mb-10 justify-center items-stretch">
            {/* Entry Fee and Cases Left - Always side by side */}
            <div className="grid grid-cols-2 gap-4 flex-1 max-w-2xl mx-auto lg:mx-0">
              <Card
                variant="pixel"
                className="hover:shadow-neon-glow-cyan transition-all"
              >
                <CardContent className="p-4 lg:p-6 text-center">
                  <div
                    className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 border-4 flex items-center justify-center animate-text-flicker"
                    style={{
                      borderColor: "rgb(0, 255, 255)",
                      backgroundColor: "rgba(0, 255, 255, 0.1)",
                    }}
                  >
                    <DollarSign
                      className="h-5 w-5 lg:h-6 lg:w-6"
                      style={{ color: "rgb(0, 255, 255)" }}
                    />
                  </div>
                  <div
                    className="font-pixel text-xs lg:text-sm mb-2"
                    style={{ color: "rgb(0, 255, 255)" }}
                  >
                    💰 Entry Fee
                  </div>
                  <div
                    className="text-lg lg:text-2xl font-pixel"
                    style={{ color: "rgb(255, 255, 255)" }}
                  >
                    {formatCurrency(gameState.entry_fee_cents)}
                  </div>
                </CardContent>
              </Card>

              <Card
                variant="pixel"
                className="hover:shadow-neon-glow-yellow transition-all"
              >
                <CardContent className="p-4 lg:p-6 text-center">
                  <div
                    className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 border-4 flex items-center justify-center animate-text-flicker"
                    style={{
                      borderColor: "rgb(255, 255, 0)",
                      backgroundColor: "rgba(255, 255, 0, 0.1)",
                    }}
                  >
                    <Trophy
                      className="h-5 w-5 lg:h-6 lg:w-6"
                      style={{ color: "rgb(255, 255, 0)" }}
                    />
                  </div>
                  <div
                    className="font-pixel text-xs lg:text-sm mb-2"
                    style={{ color: "rgb(255, 255, 0)" }}
                  >
                    🎯 Cases Left
                  </div>
                  <div
                    className="text-lg lg:text-2xl font-pixel"
                    style={{ color: "rgb(255, 255, 255)" }}
                  >
                    {unrevealedCount}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Win/Loss Card - Separate when present */}
            {gameState.final_won_cents !== null && (
              <div className="flex-shrink-0 max-w-xs mx-auto lg:mx-0">
                <Card
                  variant="pixel"
                  className="hover:shadow-neon-glow-magenta transition-all"
                >
                  <CardContent className="p-4 lg:p-6 text-center">
                    <div
                      className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 border-4 flex items-center justify-center animate-text-flicker"
                      style={{
                        borderColor:
                          gameState.final_won_cents >= gameState.entry_fee_cents
                            ? "rgb(0, 255, 0)"
                            : "rgb(255, 0, 0)",
                        backgroundColor:
                          gameState.final_won_cents >= gameState.entry_fee_cents
                            ? "rgba(0, 255, 0, 0.1)"
                            : "rgba(255, 0, 0, 0.1)",
                      }}
                    >
                      <Trophy
                        className="h-5 w-5 lg:h-6 lg:w-6"
                        style={{
                          color:
                            gameState.final_won_cents >=
                            gameState.entry_fee_cents
                              ? "rgb(0, 255, 0)"
                              : "rgb(255, 0, 0)",
                        }}
                      />
                    </div>
                    <div
                      className="font-pixel text-xs lg:text-sm mb-2"
                      style={{
                        color:
                          gameState.final_won_cents >= gameState.entry_fee_cents
                            ? "rgb(0, 255, 0)"
                            : "rgb(255, 0, 0)",
                      }}
                    >
                      {gameState.final_won_cents >= gameState.entry_fee_cents
                        ? "🏆 You Won"
                        : "💸 You Lost"}
                    </div>
                    <div
                      className="text-lg lg:text-2xl font-pixel"
                      style={{
                        color:
                          gameState.final_won_cents >= gameState.entry_fee_cents
                            ? "rgb(0, 255, 0)"
                            : "rgb(255, 0, 0)",
                      }}
                    >
                      {formatCurrency(gameState.final_won_cents)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Game Results Banner */}
        {(gameState.status === "FINISHED" ||
          gameState.status === "COMPLETED" ||
          gameState.status === "CONTRACT_COMPLETED") && (
          <div className="max-w-4xl mx-auto mb-8">
            <Card
              variant="pixel"
              className={`animate-text-flicker ${
                (gameState.final_won_cents || 0) >= gameState.entry_fee_cents
                  ? "hover:shadow-neon-glow-cyan"
                  : "hover:shadow-neon-glow-magenta"
              } transition-all`}
            >
              <CardContent className="p-8 text-center">
                <div
                  className="text-3xl font-pixel mb-4 animate-glitch"
                  style={{
                    color:
                      (gameState.final_won_cents || 0) >=
                      gameState.entry_fee_cents
                        ? "rgb(0, 255, 0)"
                        : "rgb(255, 0, 0)",
                  }}
                >
                  {(gameState.final_won_cents || 0) >= gameState.entry_fee_cents
                    ? "🎉 VICTORY!"
                    : "💀 GAME OVER"}
                </div>
                <div
                  className="text-xl font-pixel mb-4"
                  style={{ color: "rgb(0, 255, 255)" }}
                >
                  Final Amount:{" "}
                  <span
                    style={{
                      color:
                        (gameState.final_won_cents || 0) >=
                        gameState.entry_fee_cents
                          ? "rgb(0, 255, 0)"
                          : "rgb(255, 0, 0)",
                    }}
                  >
                    {formatCurrency(gameState.final_won_cents || 0)}
                  </span>
                </div>
                <div
                  className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm font-pixel"
                  style={{ color: "rgb(0, 255, 255)" }}
                >
                  <div className="flex items-center space-x-2">
                    <span>💰 Entry Fee:</span>
                    <span style={{ color: "rgb(255, 255, 255)" }}>
                      {formatCurrency(gameState.entry_fee_cents)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>
                      {(gameState.final_won_cents || 0) >=
                      gameState.entry_fee_cents
                        ? "📈 Profit:"
                        : "📉 Loss:"}
                    </span>
                    <span
                      style={{
                        color:
                          (gameState.final_won_cents || 0) >=
                          gameState.entry_fee_cents
                            ? "rgb(0, 255, 0)"
                            : "rgb(255, 0, 0)",
                      }}
                    >
                      {formatCurrency(
                        Math.abs(
                          (gameState.final_won_cents || 0) -
                            gameState.entry_fee_cents
                        )
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Game Board */}
        <div className="w-full">
          {/* Cases Grid */}
          <div className="mb-8">
            <CardGrid
              cards={gameState.cards}
              playerCase={gameState.player_case}
              onCardClick={handleCardClick}
              gameStatus={gameState.status}
              className="mb-8"
            />
          </div>

          {/* Game Controls */}
          <div className="max-w-2xl mx-auto">
            <Card
              variant="pixel"
              className="hover:shadow-neon-glow-magenta transition-all"
            >
              <CardContent className="p-6 lg:p-8">
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
