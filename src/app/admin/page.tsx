'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_ADDRESS } from "@/lib/config";
import { formatCurrency } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AdminBalance {
  admin_address: string;
  pyusd_balance: string;
  balance_formatted: string;
}

interface FailedGame {
  id: string;
  user_id: string;
  final_won_cents: number;
  prize_distribution_error: string;
  created_at: string;
}

export default function AdminPage() {
  const { authenticatedFetch, isAuthenticated, walletAddress } = useAuth();
  const [balance, setBalance] = useState<AdminBalance | null>(null);
  const [failedGames, setFailedGames] = useState<FailedGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryingGame, setRetryingGame] = useState<string | null>(null);

  // Check if user is admin (simple check - in production use proper role-based auth)
  const isAdmin = walletAddress?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadAdminData();
    }
  }, [isAuthenticated, isAdmin]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Load admin balance
      const balanceResponse = await fetch('/api/admin/check-balance');
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setBalance(balanceData);
      }

      // Load failed prize distributions
      const gamesResponse = await authenticatedFetch('/api/admin/failed-distributions');
      if (gamesResponse.ok) {
        const gamesData = await gamesResponse.json();
        setFailedGames(gamesData.games || []);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const retryPrizeDistribution = async (gameId: string) => {
    setRetryingGame(gameId);
    try {
      const response = await fetch('/api/admin/retry-prize-distribution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Prize distribution successful! TX: ${result.txHash}`);
        // Remove the game from failed list
        setFailedGames(prev => prev.filter(game => game.id !== gameId));
      } else {
        alert(`Prize distribution failed: ${result.details}`);
      }
    } catch (error) {
      console.error('Error retrying prize distribution:', error);
      alert('Error retrying prize distribution');
    } finally {
      setRetryingGame(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "rgb(28, 0, 51)" }}>
        <Card variant="pixel" className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <h1 className="text-2xl font-pixel mb-4" style={{ color: "rgb(0, 255, 255)" }}>
              🔐 ADMIN ACCESS
            </h1>
            <p className="font-pixel text-sm" style={{ color: "rgb(255, 255, 255)" }}>
              Please connect your wallet to access admin features
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "rgb(28, 0, 51)" }}>
        <Card variant="pixel" className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <h1 className="text-2xl font-pixel mb-4" style={{ color: "rgb(255, 0, 0)" }}>
              ❌ ACCESS DENIED
            </h1>
            <p className="font-pixel text-sm" style={{ color: "rgb(255, 255, 255)" }}>
              You are not authorized to access admin features
            </p>
            <p className="font-pixel text-xs mt-4" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
              Connected: {walletAddress}
            </p>
            <p className="font-pixel text-xs" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
              Required: {ADMIN_ADDRESS}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "rgb(28, 0, 51)" }}>
      <div className="crt-overlay" />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <Card variant="pixel">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-pixel animate-text-flicker" style={{ color: "rgb(0, 255, 255)" }}>
              🛠️ DEAL MASTER ADMIN
            </CardTitle>
            <p className="font-pixel text-sm" style={{ color: "rgb(255, 255, 255)" }}>
              Prize Distribution Management System
            </p>
          </CardHeader>
        </Card>

        {/* Admin Balance */}
        <Card variant="pixel">
          <CardHeader>
            <CardTitle className="font-pixel" style={{ color: "rgb(255, 0, 255)" }}>
              💰 ADMIN WALLET BALANCE
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="font-pixel" style={{ color: "rgb(0, 255, 255)" }}>
                  Loading balance...
                </div>
              </div>
            ) : balance ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-2 p-4" style={{ borderColor: "rgba(0, 255, 255, 0.5)" }}>
                    <div className="text-sm font-pixel mb-2" style={{ color: "rgb(0, 255, 255)" }}>
                      Admin Address
                    </div>
                    <div className="font-pixel text-xs break-all" style={{ color: "rgb(255, 255, 255)" }}>
                      {balance.admin_address}
                    </div>
                  </div>
                  <div className="border-2 p-4" style={{ borderColor: "rgba(255, 255, 0, 0.5)" }}>
                    <div className="text-sm font-pixel mb-2" style={{ color: "rgb(255, 255, 0)" }}>
                      PYUSD Balance
                    </div>
                    <div className="font-pixel text-lg" style={{ color: "rgb(255, 255, 255)" }}>
                      {balance.balance_formatted}
                    </div>
                  </div>
                </div>
                <Button
                  variant="cyan"
                  onClick={loadAdminData}
                  className="font-pixel"
                >
                  🔄 REFRESH BALANCE
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="font-pixel text-red-500">
                  Failed to load balance
                </div>
                <Button
                  variant="outline"
                  onClick={loadAdminData}
                  className="font-pixel mt-4"
                >
                  🔄 RETRY
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Failed Prize Distributions */}
        <Card variant="pixel">
          <CardHeader>
            <CardTitle className="font-pixel" style={{ color: "rgb(255, 0, 255)" }}>
              ⚠️ FAILED PRIZE DISTRIBUTIONS
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="font-pixel" style={{ color: "rgb(0, 255, 255)" }}>
                  Loading failed distributions...
                </div>
              </div>
            ) : failedGames.length > 0 ? (
              <div className="space-y-4">
                {failedGames.map((game) => (
                  <div
                    key={game.id}
                    className="border-2 p-4 space-y-3"
                    style={{ borderColor: "rgba(255, 0, 0, 0.5)", backgroundColor: "rgba(255, 0, 0, 0.1)" }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs font-pixel mb-1" style={{ color: "rgb(255, 0, 0)" }}>
                          Game ID
                        </div>
                        <div className="font-pixel text-xs" style={{ color: "rgb(255, 255, 255)" }}>
                          {game.id}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-pixel mb-1" style={{ color: "rgb(255, 0, 0)" }}>
                          User Address
                        </div>
                        <div className="font-pixel text-xs break-all" style={{ color: "rgb(255, 255, 255)" }}>
                          {game.user_id}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-pixel mb-1" style={{ color: "rgb(255, 0, 0)" }}>
                          Prize Amount
                        </div>
                        <div className="font-pixel text-sm" style={{ color: "rgb(255, 255, 0)" }}>
                          {formatCurrency(game.final_won_cents)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-pixel mb-1" style={{ color: "rgb(255, 0, 0)" }}>
                        Error Message
                      </div>
                      <div className="font-pixel text-xs p-2 border-2" style={{
                        color: "rgb(255, 0, 0)",
                        borderColor: "rgba(255, 0, 0, 0.3)",
                        backgroundColor: "rgba(255, 0, 0, 0.1)"
                      }}>
                        {game.prize_distribution_error}
                      </div>
                    </div>

                    <Button
                      variant="magenta"
                      onClick={() => retryPrizeDistribution(game.id)}
                      loading={retryingGame === game.id}
                      disabled={retryingGame === game.id}
                      className="font-pixel"
                    >
                      {retryingGame === game.id ? "RETRYING..." : "🔄 RETRY DISTRIBUTION"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="font-pixel" style={{ color: "rgb(0, 255, 0)" }}>
                  ✅ No failed prize distributions
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
