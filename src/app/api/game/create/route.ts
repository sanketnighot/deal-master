import { generateCardValues } from '@/lib/server'
import { createMove, supabaseAdmin } from '@/lib/supabaseAdminClient'
import { verifyAuthHeader } from '@/lib/web3authServer'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    const authResult = await verifyAuthHeader(authHeader)

    if (!authResult.valid) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authResult.error },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { entryFeeCents = 2000 } = body

    // Validate entry fee
    if (typeof entryFeeCents !== 'number' || entryFeeCents < 100 || entryFeeCents > 100000) {
      return NextResponse.json(
        { error: 'Invalid entry fee. Must be between 100 and 100000 cents.' },
        { status: 400 }
      )
    }

    // Generate card values
    const cardValues = generateCardValues(entryFeeCents)

    // Create game in database transaction
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .insert({
        user_id: authResult.user_id,
        entry_fee_cents: entryFeeCents,
        status: 'PLAYING'
      })
      .select()
      .single()

    if (gameError) {
      console.error('Failed to create game:', gameError)
      return NextResponse.json(
        { error: 'Failed to create game' },
        { status: 500 }
      )
    }

    // Create cards
    const cardsData = cardValues.map((value, idx) => ({
      game_id: game.id,
      idx,
      value_cents: value
    }))

    const { error: cardsError } = await supabaseAdmin
      .from('cards')
      .insert(cardsData)

    if (cardsError) {
      console.error('Failed to create cards:', cardsError)
      // Clean up the game if cards creation failed
      await supabaseAdmin.from('games').delete().eq('id', game.id)
      return NextResponse.json(
        { error: 'Failed to create game cards' },
        { status: 500 }
      )
    }

    // Create initial move
    await createMove(game.id, authResult.user_id, 'GAME_CREATED', {
      entry_fee_cents: entryFeeCents,
      card_count: cardValues.length
    })

    // Return game info (without card values for security)
    return NextResponse.json({
      success: true,
      game: {
        id: game.id,
        status: game.status,
        entry_fee_cents: game.entry_fee_cents,
        currency: game.currency,
        created_at: game.created_at,
        card_count: cardValues.length
      }
    })

  } catch (error) {
    console.error('Game creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
