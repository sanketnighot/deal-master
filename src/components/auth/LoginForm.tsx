'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn } from "lucide-react";

interface LoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function LoginForm({ onSuccess, className }: LoginFormProps) {
  const { connect, isLoading, connectError } = useAuth();
  const { addToast } = useToast();

  const handleSignIn = async () => {
    try {
      await connect();
      addToast({
        type: "success",
        title: "Login Successful",
        message: "Welcome to Deal Master!",
      });
      onSuccess?.();
    } catch (error) {
      addToast({
        type: "error",
        title: "Login Failed",
        message: error instanceof Error ? error.message : "Failed to sign in",
      });
    }
  };

  return (
    <div className="crt-overlay">
      <Card variant="pixel" className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">DEAL MASTER</CardTitle>
          <p className="text-neon-magenta font-pixel text-sm mt-2">
            CONNECT TO ENTER THE GAME
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {connectError && (
            <div className="border-2 border-red-500 bg-red-500/10 p-3">
              <p className="text-sm text-red-400 font-pixel">
                {connectError.message}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              variant="cyan"
              size="lg"
              onClick={handleSignIn}
              loading={isLoading}
              className="w-full flex items-center justify-center space-x-2"
            >
              <LogIn className="h-5 w-5" />
              <span>CONNECT WALLET</span>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-neon-cyan/70 font-pixel">
              ENTER THE RETRO GAMING EXPERIENCE
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
