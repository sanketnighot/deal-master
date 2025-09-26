import { getFullGameState, getPublicGameState } from '@/lib/server'
import { getGameWithDetails } from '@/lib/supabaseAdminClient'
import { verifyAuthHeader } from '@/lib/web3authServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      )
    }

    // Get game with details
    const gameData = await getGameWithDetails(gameId)

    if (!gameData) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Check if user is authenticated and is the game owner
    const authHeader = request.headers.get('authorization')
    const authResult = await verifyAuthHeader(authHeader)

    const isOwner = authResult.valid && authResult.user_id === gameData.user_id

    if (isOwner) {
      // Return full game state for owner
      return NextResponse.json({
        success: true,
        game: getFullGameState(gameData, gameData.cards, gameData.moves)
      })
    } else {
      // Return public game state for non-owners
      return NextResponse.json({
        success: true,
        game: getPublicGameState(gameData, gameData.cards)
      })
    }

  } catch (error) {
    console.error('Get game error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
