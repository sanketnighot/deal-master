'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BankerChat } from "./BankerChat";
import { formatCurrency } from "@/lib/utils";

interface BankerModalProps {
  isOpen: boolean;
  offer: number;
  lastBurnedCase?: { idx: number; value_cents: number } | null;
  onAccept: (offer?: number) => void;
  onReject: () => void;
  loading?: boolean;
}

export function BankerModal({
  isOpen,
  offer,
  lastBurnedCase,
  onAccept,
  onReject,
  loading = false,
}: BankerModalProps) {
  const [showChat, setShowChat] = useState(false);

  if (!isOpen) return null;

  const handleAccept = (negotiatedOffer?: number) => {
    onAccept(negotiatedOffer || offer);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
    >
      <div className="crt-overlay" />
      
      {showChat ? (
        <BankerChat
          initialOffer={offer}
          lastBurnedCase={lastBurnedCase}
          onAccept={handleAccept}
          onReject={onReject}
          loading={loading}
        />
      ) : (
        <Card
          variant="pixel"
          className="w-full max-w-lg mx-auto animate-text-flicker relative z-10"
          style={{
            backgroundColor: "rgba(28, 0, 51, 0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          <CardHeader
            className="text-center border-b-4"
            style={{ borderBottomColor: "rgb(0, 255, 255)" }}
          >
            <CardTitle
              className="text-2xl font-pixel animate-text-flicker"
              style={{ color: "rgb(0, 255, 255)" }}
            >
              🏦 THE BANKER'S OFFER
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-6 p-6">
            {lastBurnedCase && (
              <div
                className="border-4 p-4 animate-text-flicker"
                style={{
                  borderColor: "rgb(255, 0, 0)",
                  backgroundColor: "rgba(255, 0, 0, 0.1)",
                }}
              >
                <div
                  className="text-sm font-pixel mb-2"
                  style={{ color: "rgb(255, 0, 0)" }}
                >
                  Last Case Opened
                </div>
                <div
                  className="text-lg font-pixel"
                  style={{ color: "rgb(255, 255, 255)" }}
                >
                  Case {lastBurnedCase.idx + 1}:{" "}
                  {formatCurrency(lastBurnedCase.value_cents)}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <p
                className="font-pixel text-sm"
                style={{ color: "rgb(0, 255, 255)" }}
              >
                The banker has made you an offer for your case!
              </p>
              <div
                className="text-4xl font-pixel animate-text-flicker border-4 py-4"
                style={{
                  color: "rgb(255, 255, 0)",
                  borderColor: "rgb(255, 255, 0)",
                  backgroundColor: "rgba(255, 255, 0, 0.1)",
                }}
              >
                {formatCurrency(offer)}
              </div>
            </div>

            <div className="space-y-4">
              <p
                className="text-sm font-pixel"
                style={{ color: "rgb(0, 255, 255)" }}
              >
                Do you want to accept this offer, negotiate, or continue playing?
              </p>

              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="cyan"
                  size="lg"
                  className="font-pixel"
                  onClick={() => handleAccept()}
                  loading={loading}
                >
                  ACCEPT
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="font-pixel"
                  onClick={() => setShowChat(true)}
                  disabled={loading}
                  style={{
                    borderColor: "rgb(255, 255, 0)",
                    color: "rgb(255, 255, 0)",
                    backgroundColor: "rgba(255, 255, 0, 0.1)"
                  }}
                >
                  NEGOTIATE
                </Button>

                <Button
                  variant="magenta"
                  size="lg"
                  className="font-pixel"
                  onClick={onReject}
                  disabled={loading}
                >
                  NO DEAL
                </Button>
              </div>
            </div>

            <div
              className="text-xs font-pixel animate-text-flicker"
              style={{ color: "rgba(0, 255, 255, 0.7)" }}
            >
              Remember: You can only accept or reject once!
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
