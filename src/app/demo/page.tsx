'use client'

import { BankerModal } from '@/components/game/BankerModal'
import { CardGrid } from '@/components/game/CardGrid'
import { GameControls } from '@/components/game/GameControls'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, DollarSign, Play, Trophy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface GameState {
  id: string
  status: string
  entry_fee_cents: number
  player_case: number | null
  banker_offer_cents: number | null
  accepted_deal: boolean
  final_won_cents: number | null
  cards: Array<{
    idx: number
    value_cents: number
    revealed: boolean
    burned: boolean
  }>
}

export default function DemoPage() {
  const router = useRouter()
  const { addToast } = useToast()

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showBankerModal, setShowBankerModal] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  const startDemo = () => {
    setGameState({
      id: 'demo',
      status: 'PLAYING',
      entry_fee_cents: 2000,
      player_case: null,
      banker_offer_cents: null,
      accepted_deal: false,
      final_won_cents: null,
      cards: [
        { idx: 0, value_cents: 500, revealed: false, burned: false },
        { idx: 1, value_cents: 1000, revealed: false, burned: false },
        { idx: 2, value_cents: 2000, revealed: false, burned: false },
        { idx: 3, value_cents: 5000, revealed: false, burned: false },
        { idx: 4, value_cents: 10000, revealed: false, burned: false },
      ]
    })
    setGameStarted(true)

    addToast({
      type: 'success',
      title: 'Demo Started',
      message: 'Choose your case to begin!'
    })
  }

  const handleCardClick = async (idx: number) => {
    if (!gameState || actionLoading) return

    try {
      setActionLoading(true)

      if (gameState.player_case === null) {
        // Pick case
        await pickCase(idx)
      } else if (gameState.player_case !== idx && !gameState.cards.find(c => c.idx === idx)?.revealed) {
        // Burn case
        await burnCase(idx)
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: 'Please try again'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const pickCase = async (idx: number) => {
    // Simulate API call
    setTimeout(() => {
      setGameState(prev => prev ? {
        ...prev,
        player_case: idx
      } : null)

      addToast({
        type: 'success',
        title: 'Case Selected',
        message: `You chose Case ${idx + 1}! Now burn other cases.`
      })
    }, 500)
  }

  const burnCase = async (idx: number) => {
    // Simulate API call
    setTimeout(() => {
      const card = gameState?.cards.find(c => c.idx === idx)
      if (!card) return

      setGameState(prev => prev ? {
        ...prev,
        cards: prev.cards.map(c =>
          c.idx === idx ? { ...c, revealed: true, burned: true } : c
        ),
        banker_offer_cents: 1500 // Simulate banker offer
      } : null)

      addToast({
        type: 'info',
        title: 'Case Burned',
        message: `Case ${idx + 1} contained ${formatCurrency(card.value_cents)}`
      })

      // Show banker modal after a delay
      setTimeout(() => {
        setShowBankerModal(true)
      }, 1000)
    }, 500)
  }

  const handleAcceptDeal = async () => {
    try {
      setActionLoading(true)

      // Simulate API call
      setTimeout(() => {
        setGameState(prev => prev ? {
          ...prev,
          accepted_deal: true,
          final_won_cents: prev.banker_offer_cents,
          status: 'FINISHED'
        } : null)

        setShowBankerModal(false)

        addToast({
          type: 'success',
          title: 'Deal Accepted!',
          message: `You won ${formatCurrency(gameState?.banker_offer_cents || 0)}!`
        })
      }, 500)
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Accept Deal',
        message: 'Please try again'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectDeal = () => {
    setShowBankerModal(false)
    addToast({
      type: 'info',
      title: 'Deal Rejected',
      message: 'Continue playing to the final reveal!'
    })
  }

  const handleFinalReveal = async (swap: boolean) => {
    try {
      setActionLoading(true)

      // Simulate API call
      setTimeout(() => {
        const playerCard = gameState?.cards.find(c => c.idx === gameState.player_case)
        const otherCard = gameState?.cards.find(c => c.idx !== gameState.player_case && !c.revealed)

        const finalCard = swap ? otherCard : playerCard

        setGameState(prev => prev ? {
          ...prev,
          cards: prev.cards.map(c =>
            c.idx === finalCard?.idx ? { ...c, revealed: true } : c
          ),
          final_won_cents: finalCard?.value_cents || 0,
          status: 'FINISHED'
        } : null)

        addToast({
          type: 'success',
          title: 'Demo Complete!',
          message: `You won ${formatCurrency(finalCard?.value_cents || 0)}! Sign up to play for real.`
        })
      }, 500)
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Reveal',
        message: 'Please try again'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const resetDemo = () => {
    setGameState(null)
    setGameStarted(false)
    setShowBankerModal(false)
    setActionLoading(false)
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Demo Mode
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Try Deal or No Deal without signing up! This is a fully functional demo with simulated gameplay.
            </p>

            <Card className="max-w-2xl mx-auto mb-8">
              <CardHeader>
                <CardTitle>Demo Features</CardTitle>
              </CardHeader>
              <CardContent className="text-left space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold">Choose Your Case</h3>
                    <p className="text-gray-600">Select one of 5 cases to keep throughout the game.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold">Burn Cases</h3>
                    <p className="text-gray-600">Reveal and remove other cases to narrow down the possibilities.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold">Banker's Offers</h3>
                    <p className="text-gray-600">The banker will make offers based on remaining cases. Accept or continue playing.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold">Final Decision</h3>
                    <p className="text-gray-600">When only 2 cases remain, choose to keep your case or swap with the other.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Button
                variant="primary"
                size="lg"
                onClick={startDemo}
                className="flex items-center space-x-2 mx-auto"
              >
                <Play className="h-5 w-5" />
                <span>Start Demo Game</span>
              </Button>

              <div>
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="flex items-center space-x-2 mx-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Home</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const unrevealedCount = gameState?.cards.filter(c => !c.revealed).length || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />

      <div className="container mx-auto px-4 py-8">
        {/* Demo Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>

            <div className="flex items-center space-x-4">
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                DEMO MODE
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetDemo}
              >
                Reset Demo
              </Button>
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
                  {formatCurrency(gameState?.entry_fee_cents || 0)}
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

            {gameState?.final_won_cents && (
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

        {/* Game Board */}
        <div className="max-w-4xl mx-auto">
          {gameState && (
            <>
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
            </>
          )}
        </div>

        {/* Banker Modal */}
        {gameState && (
          <BankerModal
            isOpen={showBankerModal}
            offer={gameState.banker_offer_cents || 0}
            onAccept={handleAcceptDeal}
            onReject={handleRejectDeal}
            loading={actionLoading}
          />
        )}

        {/* Demo CTA */}
        {gameState?.status === 'FINISHED' && (
          <div className="mt-8 max-w-2xl mx-auto">
            <Card className="bg-primary-50 border-primary-200">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-primary-900 mb-2">
                  Ready to Play for Real?
                </h3>
                <p className="text-primary-700 mb-4">
                  Sign up with Web3Auth to create real games, track your winnings, and compete with other players!
                </p>
                <Button
                  variant="primary"
                  onClick={() => router.push('/')}
                  className="flex items-center space-x-2 mx-auto"
                >
                  <span>Sign Up Now</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
