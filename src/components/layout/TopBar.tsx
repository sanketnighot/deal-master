'use client'

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Wallet } from "lucide-react";
import Link from "next/link";

interface TopBarProps {
  className?: string;
}

export function TopBar({ className }: TopBarProps) {
  const { user, isAuthenticated, disconnect, isLoading, walletAddress } =
    useAuth();
  const handleLogout = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header
      className={`border-b-4 relative z-20 ${className}`}
      style={{
        backgroundColor: "rgb(28, 0, 51)",
        borderBottomColor: "rgb(255, 0, 255)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link className="flex items-center cursor-pointer" href="/">
            <h1
              className="text-xl font-pixel animate-text-flicker"
              style={{ color: "rgb(255, 0, 255)" }}
            >
              DEAL MASTER
            </h1>
          </Link>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div
                  className="animate-text-flicker font-pixel text-sm"
                  style={{ color: "rgb(0, 255, 255)" }}
                >
                  LOADING...
                </div>
              </div>
            ) : isAuthenticated ? (
              walletAddress ? (
                <div className="flex items-center space-x-4">
                  {/* User Info */}
                  <div
                    className="flex items-center space-x-2 text-sm"
                    style={{ color: "rgb(0, 255, 255)" }}
                  >
                    <Wallet className="h-4 w-4" />
                    <span className="hidden sm:inline font-pixel text-xs">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  </div>

                  {/* Logout Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center space-x-1 relative z-30 pointer-events-auto"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">LOGOUT</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div
                    className="animate-text-flicker font-pixel text-sm"
                    style={{ color: "rgb(0, 255, 255)" }}
                  >
                    LOADING WALLET...
                  </div>
                </div>
              )
            ) : (
              <div
                className="text-sm font-pixel"
                style={{ color: "rgba(0, 255, 255, 0.5)" }}
              >
                NOT CONNECTED
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
