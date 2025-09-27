'use client'

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, Wallet } from "lucide-react";

interface TopBarProps {
  className?: string
}

export function TopBar({ className }: TopBarProps) {
  const { user, isAuthenticated, disconnect, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Deal Master</h1>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                {/* User Info */}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  {user.email ? (
                    <>
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{user.email}</span>
                    </>
                  ) : (user as any).verifierId ? (
                    <>
                      <Wallet className="h-4 w-4" />
                      <span className="hidden sm:inline font-mono text-xs">
                        {(user as any).verifierId.slice(0, 6)}...
                        {(user as any).verifierId.slice(-4)}
                      </span>
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">User</span>
                    </>
                  )}
                </div>

                {/* Logout Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Not logged in</div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
