import { getPublicGameState } from '@/lib/server'
import { getGameWithDetails } from '@/lib/supabaseAdminClient'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params

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

    // Return public game state (safe for embeds/demos)
    return NextResponse.json({
      success: true,
      game: getPublicGameState(gameData, gameData.cards)
    })

  } catch (error) {
    console.error('Get public game state error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
