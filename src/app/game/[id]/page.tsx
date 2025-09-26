'use client'

import { BankerModal } from '@/components/game/BankerModal'
import { CardGrid } from '@/components/game/CardGrid'
import { GameControls } from '@/components/game/GameControls'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, DollarSign, Trophy } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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

export default function GamePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { addToast } = useToast()
  const gameId = params.id as string

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showBankerModal, setShowBankerModal] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  // Load game state
  useEffect(() => {
    if (gameId) {
      loadGameState()
    }
  }, [gameId])

  const loadGameState = async () => {
    try {
      setLoading(true)
      // In a real app, this would call the API
      // For now, simulate loading with mock data
      setTimeout(() => {
        setGameState({
          id: gameId,
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
        setLoading(false)
      }, 1000)
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Load Game',
        message: 'Please try again later'
      })
      setLoading(false)
    }
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
        message: `You chose Case ${idx + 1}!`
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
          title: 'Game Complete!',
          message: `You won ${formatCurrency(finalCard?.value_cents || 0)}!`
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

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to home
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
                The game you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 mx-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const unrevealedCount = gameState.cards.filter(c => !c.revealed).length

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />

      <div className="container mx-auto px-4 py-8">
        {/* Game Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>

            <div className="text-sm text-gray-600">
              Game #{gameState.id}
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
                  {formatCurrency(gameState.entry_fee_cents)}
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

            {gameState.final_won_cents && (
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
        </div>

        {/* Banker Modal */}
        <BankerModal
          isOpen={showBankerModal}
          offer={gameState.banker_offer_cents || 0}
          onAccept={handleAcceptDeal}
          onReject={handleRejectDeal}
          loading={actionLoading}
        />
      </div>
    </div>
  )
}
