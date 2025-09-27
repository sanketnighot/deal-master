'use client'

import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { useGameApi } from "@/lib/api";
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  Plus,
  Trophy,
} from "lucide-react";
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// Disable static generation for this page
export const dynamic = 'force-dynamic'

interface Game {
  id: string
  status: string
  entry_fee_cents: number
  created_at: string
  final_won_cents?: number
  banker_offer_cents?: number
}

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { createGame, getGames } = useGameApi();
  const router = useRouter();
  const { addToast } = useToast();
  const [games, setGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [creatingGame, setCreatingGame] = useState(false);
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

  const handleCreateGame = async () => {
    try {
      setCreatingGame(true);
      const response = await createGame(2000); // $20 entry fee

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to home
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Games</h1>
          <p className="text-gray-600">
            Manage your Deal or No Deal games and track your winnings
          </p>
        </div>

        {/* Create New Game */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Start a New Game
                  </h3>
                  <p className="text-gray-600">
                    Create a new Deal or No Deal game with a custom entry fee
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCreateGame}
                  loading={creatingGame}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>New Game</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Games List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Games</h2>

          {loadingGames ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : games.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Games Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first game to start playing Deal or No Deal!
                </p>
                <Button
                  variant="primary"
                  onClick={handleCreateGame}
                  className="flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Game</span>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {games.map((game) => (
                <Card
                  key={game.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Game #{game.id}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              game.status === "PLAYING"
                                ? "bg-yellow-100 text-yellow-800"
                                : game.status === "FINISHED"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {game.status === "PLAYING"
                              ? "In Progress"
                              : game.status === "FINISHED"
                                ? "Completed"
                                : game.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Entry Fee:</span>
                            <br />
                            {formatCurrency(game.entry_fee_cents)}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span>
                            <br />
                            {formatDate(game.created_at)}
                          </div>
                          {game.final_won_cents && (
                            <div>
                              <span className="font-medium">
                                {game.final_won_cents >= game.entry_fee_cents
                                  ? "Won:"
                                  : "Lost:"}
                              </span>
                              <br />
                              <span
                                className={`font-semibold ${
                                  game.final_won_cents >= game.entry_fee_cents
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {formatCurrency(game.final_won_cents)}
                              </span>
                            </div>
                          )}
                          {game.banker_offer_cents &&
                            game.status === "PLAYING" && (
                              <div>
                                <span className="font-medium">
                                  Current Offer:
                                </span>
                                <br />
                                <span className="text-primary-600 font-semibold">
                                  {formatCurrency(game.banker_offer_cents)}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="ml-4">
                        <Button
                          variant="outline"
                          onClick={() => handlePlayGame(game.id)}
                          className="flex items-center space-x-2"
                        >
                          <Play className="h-4 w-4" />
                          <span>
                            {game.status === "PLAYING" ? "Continue" : "View"}
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
              <span>Previous</span>
            </Button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <span className="text-sm text-gray-500">
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
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span>Total Games</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {pagination.total}
              </div>
              <p className="text-sm text-gray-600 mt-1">Games played</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span>Active Games</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {games.filter((g) => g.status === "PLAYING").length}
              </div>
              <p className="text-sm text-gray-600 mt-1">Currently playing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-green-500" />
                <span>Net Profit</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${
                  games
                    .filter((g) => g.final_won_cents)
                    .reduce(
                      (sum, g) =>
                        sum + ((g.final_won_cents || 0) - g.entry_fee_cents),
                      0
                    ) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
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
              <p className="text-sm text-gray-600 mt-1">From completed games</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
