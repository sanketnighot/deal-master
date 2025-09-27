'use client'

import { TopBar } from "@/components/layout/TopBar";
import { PYUSDPaymentModal } from "@/components/payment/PYUSDPaymentModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { useGameApi } from "@/lib/api";
import { ENTRY_FEE_CENTS, MAX_PRIZE_CENTS } from "@/lib/config";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  Plus,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Disable static generation for this page
export const dynamic = "force-dynamic";

interface Game {
  id: string;
  status: string;
  entry_fee_cents: number;
  created_at: string;
  final_won_cents?: number;
  banker_offer_cents?: number;
}

export default function Dashboard() {
  const { isAuthenticated, isLoading, walletAddress, authenticatedFetch } =
    useAuth();
  const { createGame, getGames } = useGameApi();
  const router = useRouter();
  const { addToast } = useToast();
  const [games, setGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [creatingGame, setCreatingGame] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // Load games from API
  const loadGames = async (page: number = 1) => {
    try {
      setLoadingGames(true);
      const response = await getGames(page, 10);

      if (response.success) {
        setGames(response.games);
        setPagination(response.pagination);
      } else {
        addToast({
          type: "error",
          title: "Failed to Load Games",
          message: response.error || "Please try again later",
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to Load Games",
        message: "Please try again later",
      });
    } finally {
      setLoadingGames(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadGames(1);
    }
  }, [isAuthenticated]);

  const handleCreateGame = () => {
    if (!walletAddress) {
      addToast({
        type: "error",
        title: "Wallet Not Connected",
        message: "Please connect your wallet to create a game",
      });
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (
    txHash: string,
    walletAddress: string
  ) => {
    try {
      setCreatingGame(true);
      setShowPaymentModal(false);

      const response = await createGame(ENTRY_FEE_CENTS, txHash, walletAddress);

      if (response.success) {
        addToast({
          type: "success",
          title: "Game Created!",
          message: "Redirecting to your new game...",
        });
        // Reload games to show the new one
        await loadGames(1);
        router.push(`/game/${response.game.id}`);
      } else {
        addToast({
          type: "error",
          title: "Failed to Create Game",
          message: response.error || "Please try again later",
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to Create Game",
        message: "Please try again later",
      });
    } finally {
      setCreatingGame(false);
    }
  };

  const handlePlayGame = (gameId: string) => {
    router.push(`/game/${gameId}`);
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "rgb(28, 0, 51)" }}
      >
        <div
          className="animate-text-flicker font-pixel text-xl"
          style={{ color: "rgb(0, 255, 255)" }}
        >
          LOADING...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to home
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: "rgb(28, 0, 51)" }}
    >
      {/* CRT Overlay */}
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

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8 text-center">
          <h1
            className="text-4xl font-pixel mb-4 animate-glitch"
            style={{ color: "rgb(255, 0, 255)" }}
          >
            YOUR GAMES
          </h1>
          <p
            className="font-pixel text-sm"
            style={{ color: "rgb(0, 255, 255)" }}
          >
            Manage your Deal Master games and track your winnings
          </p>
        </div>

        {/* Create New Game */}
        <div className="mb-8">
          <Card variant="pixel">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3
                    className="text-lg font-pixel mb-2"
                    style={{ color: "rgb(255, 255, 0)" }}
                  >
                    🎮 START A NEW GAME
                  </h3>
                  <p
                    className="font-pixel text-sm mb-3"
                    style={{ color: "rgb(0, 255, 255)" }}
                  >
                    Create a new Deal Master game with PYUSD payment
                  </p>
                  <div
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-pixel"
                    style={{ color: "rgb(0, 255, 255)" }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>💰 Entry Fee:</span>
                      <span style={{ color: "rgb(255, 255, 255)" }}>
                        {formatCurrency(ENTRY_FEE_CENTS)} PYUSD
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>🏆 Max Prize:</span>
                      <span style={{ color: "rgb(255, 255, 255)" }}>
                        {formatCurrency(MAX_PRIZE_CENTS)} PYUSD
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    variant="cyan"
                    size="lg"
                    onClick={handleCreateGame}
                    loading={creatingGame}
                    className="flex items-center space-x-2 w-full md:w-auto"
                  >
                    <Plus className="h-5 w-5" />
                    <span>NEW GAME</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Games List */}
        <div className="space-y-4">
          <h2
            className="text-xl font-pixel"
            style={{ color: "rgb(255, 255, 0)" }}
          >
            Recent Games
          </h2>

          {loadingGames ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} variant="pixel">
                  <CardContent className="p-6">
                    <div className="animate-text-flicker">
                      <div className="flex items-center space-x-3 mb-4">
                        <div
                          className="h-4 w-32 border-2"
                          style={{
                            borderColor: "rgba(0, 255, 255, 0.3)",
                            backgroundColor: "rgba(0, 255, 255, 0.1)",
                          }}
                        ></div>
                        <div
                          className="h-6 w-20 border-2"
                          style={{
                            borderColor: "rgba(255, 255, 0, 0.3)",
                            backgroundColor: "rgba(255, 255, 0, 0.1)",
                          }}
                        ></div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((j) => (
                          <div key={j}>
                            <div
                              className="h-3 w-16 mb-1 border"
                              style={{
                                borderColor: "rgba(0, 255, 255, 0.2)",
                                backgroundColor: "rgba(0, 255, 255, 0.05)",
                              }}
                            ></div>
                            <div
                              className="h-3 w-12 border"
                              style={{
                                borderColor: "rgba(255, 255, 255, 0.2)",
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                              }}
                            ></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : games.length === 0 ? (
            <Card variant="pixel">
              <CardContent className="p-8 text-center">
                <div
                  className="w-16 h-16 mx-auto mb-4 border-4 flex items-center justify-center animate-text-flicker"
                  style={{
                    borderColor: "rgb(255, 255, 0)",
                    backgroundColor: "rgba(255, 255, 0, 0.1)",
                  }}
                >
                  <Trophy
                    className="h-8 w-8"
                    style={{ color: "rgb(255, 255, 0)" }}
                  />
                </div>
                <h3
                  className="text-xl font-pixel mb-3"
                  style={{ color: "rgb(255, 255, 0)" }}
                >
                  🎮 NO GAMES YET
                </h3>
                <p
                  className="font-pixel text-sm mb-6 max-w-md mx-auto"
                  style={{ color: "rgb(0, 255, 255)" }}
                >
                  Ready to test your luck? Create your first Deal Master game
                  and face the banker in this epic battle of nerves!
                </p>
                <Button
                  variant="cyan"
                  size="lg"
                  onClick={handleCreateGame}
                  className="flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-5 w-5" />
                  <span>🚀 CREATE FIRST GAME</span>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {games.map((game) => (
                <Card
                  key={game.id}
                  variant="pixel"
                  className="hover:shadow-neon-glow-cyan transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                          <h3
                            className="text-lg font-pixel"
                            style={{ color: "rgb(255, 255, 0)" }}
                          >
                            🎯 Game #{game.id.slice(0, 8)}...{game.id.slice(-4)}
                          </h3>
                          <span
                            className="px-2 py-1 text-xs font-pixel border-2 w-fit"
                            style={{
                              borderColor:
                                game.status === "PLAYING"
                                  ? "rgb(255, 255, 0)"
                                  : game.status === "FINISHED"
                                    ? "rgb(0, 255, 0)"
                                    : "rgb(128, 128, 128)",
                              color:
                                game.status === "PLAYING"
                                  ? "rgb(255, 255, 0)"
                                  : game.status === "FINISHED"
                                    ? "rgb(0, 255, 0)"
                                    : "rgb(128, 128, 128)",
                              backgroundColor:
                                game.status === "PLAYING"
                                  ? "rgba(255, 255, 0, 0.1)"
                                  : game.status === "FINISHED"
                                    ? "rgba(0, 255, 0, 0.1)"
                                    : "rgba(128, 128, 128, 0.1)",
                            }}
                          >
                            {game.status === "PLAYING"
                              ? "IN PROGRESS"
                              : game.status === "FINISHED"
                                ? "COMPLETED"
                                : game.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-pixel">
                          <div>
                            <span style={{ color: "rgb(0, 255, 255)" }}>
                              Entry Fee:
                            </span>
                            <br />
                            <span style={{ color: "rgb(255, 255, 255)" }}>
                              {formatCurrency(game.entry_fee_cents)}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: "rgb(0, 255, 255)" }}>
                              Created:
                            </span>
                            <br />
                            <span style={{ color: "rgb(255, 255, 255)" }}>
                              {formatDate(game.created_at)}
                            </span>
                          </div>
                          {game.final_won_cents && (
                            <div>
                              <span style={{ color: "rgb(0, 255, 255)" }}>
                                {game.final_won_cents >= game.entry_fee_cents
                                  ? "Won:"
                                  : "Lost:"}
                              </span>
                              <br />
                              <span
                                style={{
                                  color:
                                    game.final_won_cents >= game.entry_fee_cents
                                      ? "rgb(0, 255, 0)"
                                      : "rgb(255, 0, 0)",
                                }}
                              >
                                {formatCurrency(game.final_won_cents)}
                              </span>
                            </div>
                          )}
                          {game.banker_offer_cents &&
                            game.status === "PLAYING" && (
                              <div>
                                <span style={{ color: "rgb(0, 255, 255)" }}>
                                  Current Offer:
                                </span>
                                <br />
                                <span style={{ color: "rgb(255, 0, 255)" }}>
                                  {formatCurrency(game.banker_offer_cents)}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <Button
                          variant="magenta"
                          onClick={() => handlePlayGame(game.id)}
                          className="flex items-center space-x-2 w-full lg:w-auto"
                        >
                          <Play className="h-4 w-4" />
                          <span>
                            {game.status === "PLAYING"
                              ? " CONTINUE"
                              : " VIEW GAME"}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadGames(pagination.page - 1)}
              disabled={!pagination.hasPrev || loadingGames}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>PREVIOUS</span>
            </Button>

            <div className="flex items-center space-x-2 font-pixel text-xs">
              <span style={{ color: "rgb(0, 255, 255)" }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <span style={{ color: "rgba(0, 255, 255, 0.7)" }}>
                ({pagination.total} total games)
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadGames(pagination.page + 1)}
              disabled={!pagination.hasNext || loadingGames}
              className="flex items-center space-x-1"
            >
              <span>NEXT</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card variant="pixel">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-pixel text-sm">
                <Trophy
                  className="h-5 w-5"
                  style={{ color: "rgb(255, 255, 0)" }}
                />
                <span style={{ color: "rgb(255, 255, 0)" }}>
                  🎯 Total Games
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-3xl font-pixel"
                style={{ color: "rgb(0, 255, 255)" }}
              >
                {pagination.total}
              </div>
              <p
                className="text-xs font-pixel mt-1"
                style={{ color: "rgba(0, 255, 255, 0.7)" }}
              >
                Games played
              </p>
            </CardContent>
          </Card>

          <Card variant="pixel">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-pixel text-sm">
                <Clock
                  className="h-5 w-5"
                  style={{ color: "rgb(0, 255, 255)" }}
                />
                <span style={{ color: "rgb(255, 255, 0)" }}>
                  ⚡ Active Games
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-3xl font-pixel"
                style={{ color: "rgb(0, 255, 255)" }}
              >
                {games.filter((g) => g.status === "PLAYING").length}
              </div>
              <p
                className="text-xs font-pixel mt-1"
                style={{ color: "rgba(0, 255, 255, 0.7)" }}
              >
                Currently playing
              </p>
            </CardContent>
          </Card>

          <Card variant="pixel">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-pixel text-sm">
                <Trophy
                  className="h-5 w-5"
                  style={{ color: "rgb(0, 255, 0)" }}
                />
                <span style={{ color: "rgb(255, 255, 0)" }}>💰 Net Profit</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-3xl font-pixel"
                style={{
                  color:
                    games
                      .filter((g) => g.final_won_cents)
                      .reduce(
                        (sum, g) =>
                          sum + ((g.final_won_cents || 0) - g.entry_fee_cents),
                        0
                      ) >= 0
                      ? "rgb(0, 255, 0)"
                      : "rgb(255, 0, 0)",
                }}
              >
                {formatCurrency(
                  games
                    .filter((g) => g.final_won_cents)
                    .reduce(
                      (sum, g) =>
                        sum + ((g.final_won_cents || 0) - g.entry_fee_cents),
                      0
                    )
                )}
              </div>
              <p
                className="text-xs font-pixel mt-1"
                style={{ color: "rgba(0, 255, 255, 0.7)" }}
              >
                From completed games
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PYUSD Payment Modal */}
      <PYUSDPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        entryFeeCents={ENTRY_FEE_CENTS}
      />
    </div>
  );
}
