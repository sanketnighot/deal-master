'use client'

import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Trophy, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Disable static generation for this page
export const dynamic = "force-dynamic";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

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

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: "rgb(28, 0, 51)" }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-2 h-2 bg-neon-magenta animate-text-flicker"></div>
        <div className="absolute top-32 right-20 w-2 h-2 bg-neon-cyan animate-text-flicker"></div>
        <div className="absolute bottom-20 left-32 w-2 h-2 bg-neon-yellow animate-text-flicker"></div>
        <div className="absolute bottom-40 right-10 w-2 h-2 bg-neon-magenta animate-text-flicker"></div>
      </div>

      {/* CRT Overlay */}
      <div className="crt-overlay" />

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16">
          {/* Animated Title */}
          <div className="mb-8">
            <h1
              className="text-7xl md:text-8xl font-pixel mb-4 animate-glitch"
              style={{
                color: "rgb(255, 0, 255)",
                textShadow: "0 0 20px rgb(255, 0, 255)",
              }}
            >
              DEAL MASTER
            </h1>
            <div className="flex justify-center items-center space-x-4 mb-6">
              <div
                className="h-1 w-16 animate-text-flicker"
                style={{ backgroundColor: "rgb(0, 255, 255)" }}
              ></div>
              <p
                className="text-xl font-pixel animate-text-flicker"
                style={{ color: "rgb(0, 255, 255)" }}
              >
                DEAL OR NO DEAL • WEB3 EDITION
              </p>
              <div
                className="h-1 w-16 animate-text-flicker"
                style={{ backgroundColor: "rgb(0, 255, 255)" }}
              ></div>
            </div>
          </div>

          {/* Epic Tagline */}
          <div className="mb-12">
            <div
              className="text-2xl font-pixel mb-4 max-w-4xl mx-auto leading-relaxed"
              style={{ color: "rgb(255, 255, 0)" }}
            >
              🎮 ENTER THE RETRO DIMENSION 🎮
            </div>
            <div
              className="text-lg font-pixel mb-2 max-w-3xl mx-auto"
              style={{ color: "rgb(0, 255, 255)" }}
            >
              💰 CHOOSE YOUR CASE • FACE THE BANKER • WIN PYUSD PRIZES 💰
            </div>
          </div>

          {/* Stats Banner */}
          <div className="mb-12">
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div
                className="border-4 p-4 animate-text-flicker"
                style={{
                  borderColor: "rgb(255, 0, 255)",
                  backgroundColor: "rgba(255, 0, 255, 0.1)",
                }}
              >
                <div
                  className="text-2xl font-pixel"
                  style={{ color: "rgb(255, 255, 255)" }}
                >
                  $20
                </div>
                <div
                  className="text-xs font-pixel"
                  style={{ color: "rgb(255, 0, 255)" }}
                >
                  ENTRY FEE
                </div>
              </div>
              <div
                className="border-4 p-4 animate-text-flicker"
                style={{
                  borderColor: "rgb(0, 255, 255)",
                  backgroundColor: "rgba(0, 255, 255, 0.1)",
                }}
              >
                <div
                  className="text-2xl font-pixel"
                  style={{ color: "rgb(255, 255, 255)" }}
                >
                  $50
                </div>
                <div
                  className="text-xs font-pixel"
                  style={{ color: "rgb(0, 255, 255)" }}
                >
                  MAX PRIZE
                </div>
              </div>
              <div
                className="border-4 p-4 animate-text-flicker"
                style={{
                  borderColor: "rgb(255, 255, 0)",
                  backgroundColor: "rgba(255, 255, 0, 0.1)",
                }}
              >
                <div
                  className="text-2xl font-pixel"
                  style={{ color: "rgb(255, 255, 255)" }}
                >
                  26
                </div>
                <div
                  className="text-xs font-pixel"
                  style={{ color: "rgb(255, 255, 0)" }}
                >
                  CASES
                </div>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="max-w-md mx-auto mb-12">
            <LoginForm />
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2
            className="text-4xl font-pixel text-center mb-12 animate-glitch"
            style={{ color: "rgb(255, 255, 0)" }}
          >
            🎯 GAME FEATURES 🎯
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card
              variant="pixel"
              className="text-center hover:shadow-neon-glow-cyan transition-all"
            >
              <CardHeader>
                <div
                  className="mx-auto w-16 h-16 border-4 flex items-center justify-center mb-4 animate-text-flicker"
                  style={{
                    borderColor: "rgb(0, 255, 255)",
                    backgroundColor: "rgba(0, 255, 255, 0.1)",
                  }}
                >
                  <Shield
                    className="h-8 w-8"
                    style={{ color: "rgb(0, 255, 255)" }}
                  />
                </div>
                <CardTitle
                  className="font-pixel text-lg"
                  style={{ color: "rgb(255, 255, 0)" }}
                >
                  🔐 SECURE AUTH
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className="font-pixel text-xs leading-relaxed"
                  style={{ color: "rgb(0, 255, 255)" }}
                >
                  WALLET CONNECTION VIA WEB3AUTH • DECENTRALIZED SECURITY •
                  SOCIAL LOGIN SUPPORT • EMBEDDED WALLET CREATION
                </p>
              </CardContent>
            </Card>

            <Card
              variant="pixel"
              className="text-center hover:shadow-neon-glow-magenta transition-all"
            >
              <CardHeader>
                <div
                  className="mx-auto w-16 h-16 border-4 flex items-center justify-center mb-4 animate-text-flicker"
                  style={{
                    borderColor: "rgb(255, 0, 255)",
                    backgroundColor: "rgba(255, 0, 255, 0.1)",
                  }}
                >
                  <Trophy
                    className="h-8 w-8"
                    style={{ color: "rgb(255, 0, 255)" }}
                  />
                </div>
                <CardTitle
                  className="font-pixel text-lg"
                  style={{ color: "rgb(255, 255, 0)" }}
                >
                  🎮 CLASSIC GAME
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className="font-pixel text-xs leading-relaxed"
                  style={{ color: "rgb(0, 255, 255)" }}
                >
                  5 MYSTERY CASES • BANKER OFFERS • STRATEGIC DECISIONS •
                  PSYCHOLOGICAL GAMEPLAY • RISK VS REWARD
                </p>
              </CardContent>
            </Card>

            <Card
              variant="pixel"
              className="text-center hover:shadow-neon-glow-yellow transition-all"
            >
              <CardHeader>
                <div
                  className="mx-auto w-16 h-16 border-4 flex items-center justify-center mb-4 animate-text-flicker"
                  style={{
                    borderColor: "rgb(255, 255, 0)",
                    backgroundColor: "rgba(255, 255, 0, 0.1)",
                  }}
                >
                  <Zap
                    className="h-8 w-8"
                    style={{ color: "rgb(255, 255, 0)" }}
                  />
                </div>
                <CardTitle
                  className="font-pixel text-lg"
                  style={{ color: "rgb(255, 255, 0)" }}
                >
                  ⚡ FAIR PLAY
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className="font-pixel text-xs leading-relaxed"
                  style={{ color: "rgb(0, 255, 255)" }}
                >
                  SERVER-SIDE LOGIC • CRYPTOGRAPHIC RANDOMNESS • TRANSPARENT
                  BLOCKCHAIN • PROVABLY FAIR RESULTS
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How to Play */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card
            variant="pixel"
            className="hover:shadow-neon-glow-magenta transition-all"
          >
            <CardHeader>
              <CardTitle
                className="text-center font-pixel text-2xl animate-glitch"
                style={{ color: "rgb(255, 255, 0)" }}
              >
                🎯 HOW TO CONQUER THE CASE 🎯
              </CardTitle>
              <p
                className="text-center font-pixel text-sm mt-4"
                style={{ color: "rgb(0, 255, 255)" }}
              >
                MASTER THE ART OF RISK • OUTSMART THE BANKER • CLAIM YOUR PRIZE
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="flex items-start space-x-6">
                  <div
                    className="flex-shrink-0 w-12 h-12 border-4 flex items-center justify-center text-lg font-pixel font-bold animate-text-flicker"
                    style={{
                      borderColor: "rgb(0, 255, 255)",
                      backgroundColor: "rgb(0, 255, 255)",
                      color: "rgb(28, 0, 51)",
                    }}
                  >
                    1
                  </div>
                  <div>
                    <h3
                      className="font-pixel text-lg mb-3"
                      style={{ color: "rgb(255, 255, 0)" }}
                    >
                      🎯 CHOOSE YOUR CASE
                    </h3>
                    <p
                      className="font-pixel text-sm leading-relaxed"
                      style={{ color: "rgb(0, 255, 255)" }}
                    >
                      SELECT ONE OF 5 MYSTERY CASES TO KEEP THROUGHOUT THE GAME
                      • YOUR CASE CONTAINS A HIDDEN PRIZE VALUE • CHOOSE WISELY!
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-6">
                  <div
                    className="flex-shrink-0 w-12 h-12 border-4 flex items-center justify-center text-lg font-pixel font-bold animate-text-flicker"
                    style={{
                      borderColor: "rgb(255, 0, 255)",
                      backgroundColor: "rgb(255, 0, 255)",
                      color: "rgb(28, 0, 51)",
                    }}
                  >
                    2
                  </div>
                  <div>
                    <h3
                      className="font-pixel text-lg mb-3"
                      style={{ color: "rgb(255, 255, 0)" }}
                    >
                      💥 ELIMINATE CASES
                    </h3>
                    <p
                      className="font-pixel text-sm leading-relaxed"
                      style={{ color: "rgb(0, 255, 255)" }}
                    >
                      REVEAL AND REMOVE OTHER CASES TO NARROW DOWN POSSIBILITIES
                      • EACH ELIMINATION GIVES YOU MORE INFORMATION • BUILD YOUR
                      STRATEGY!
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-6">
                  <div
                    className="flex-shrink-0 w-12 h-12 border-4 flex items-center justify-center text-lg font-pixel font-bold animate-text-flicker"
                    style={{
                      borderColor: "rgb(255, 255, 0)",
                      backgroundColor: "rgb(255, 255, 0)",
                      color: "rgb(28, 0, 51)",
                    }}
                  >
                    3
                  </div>
                  <div>
                    <h3
                      className="font-pixel text-lg mb-3"
                      style={{ color: "rgb(255, 255, 0)" }}
                    >
                      🤖 BANKER OFFERS
                    </h3>
                    <p
                      className="font-pixel text-sm leading-relaxed"
                      style={{ color: "rgb(0, 255, 255)" }}
                    >
                      THE MYSTERIOUS BANKER MAKES OFFERS BASED ON REMAINING
                      CASES • ACCEPT THE DEAL OR RISK IT ALL • PSYCHOLOGICAL
                      WARFARE BEGINS!
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-6">
                  <div
                    className="flex-shrink-0 w-12 h-12 border-4 flex items-center justify-center text-lg font-pixel font-bold animate-text-flicker"
                    style={{
                      borderColor: "rgb(0, 255, 0)",
                      backgroundColor: "rgb(0, 255, 0)",
                      color: "rgb(28, 0, 51)",
                    }}
                  >
                    4
                  </div>
                  <div>
                    <h3
                      className="font-pixel text-lg mb-3"
                      style={{ color: "rgb(255, 255, 0)" }}
                    >
                      🏆 FINAL CHOICE
                    </h3>
                    <p
                      className="font-pixel text-sm leading-relaxed"
                      style={{ color: "rgb(0, 255, 255)" }}
                    >
                      WITH 2 CASES LEFT, KEEP YOUR CASE OR SWAP WITH THE OTHER •
                      THE ULTIMATE DECISION • TRUST YOUR INSTINCTS OR CHANGE
                      YOUR FATE!
                    </p>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="mt-12 text-center">
                <div
                  className="border-4 p-6 animate-text-flicker"
                  style={{
                    borderColor: "rgb(255, 0, 255)",
                    backgroundColor: "rgba(255, 0, 255, 0.1)",
                  }}
                >
                  <p
                    className="font-pixel text-lg mb-4"
                    style={{ color: "rgb(255, 255, 0)" }}
                  >
                    🎮 READY TO ENTER THE CASE? 🎮
                  </p>
                  <p
                    className="font-pixel text-sm"
                    style={{ color: "rgb(0, 255, 255)" }}
                  >
                    CONNECT YOUR WALLET • PAY $20 PYUSD • WIN UP TO $50 • GLORY
                    AWAITS!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
