import { calculateBankerOffer, getRemainingValues, shouldBankerOffer, validateGameState } from '@/lib/server'
import { createMove, getGameWithDetails, supabaseAdmin } from '@/lib/supabaseAdminClient'
import { verifyAuthHeader } from '@/lib/web3authServer'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
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
    const { idx } = body

    // Validate case index
    if (typeof idx !== 'number' || idx < 0 || idx > 4) {
      return NextResponse.json(
        { error: 'Invalid case index. Must be between 0 and 4.' },
        { status: 400 }
      )
    }

    // Get current game state
    const gameData = await getGameWithDetails(gameId)

    if (!gameData) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (gameData.user_id !== authResult.user_id) {
      return NextResponse.json(
        { error: 'Unauthorized - not game owner' },
        { status: 403 }
      )
    }

    // Validate game state
    const stateValidation = validateGameState(gameData, 'burn')
    if (!stateValidation.valid) {
      return NextResponse.json(
        { error: stateValidation.error },
        { status: 400 }
      )
    }

    // Check if case exists and can be burned
    const targetCard = gameData.cards.find(card => card.idx === idx)
    if (!targetCard) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 400 }
      )
    }

    if (targetCard.revealed) {
      return NextResponse.json(
        { error: 'Case already revealed' },
        { status: 400 }
      )
    }

    if (idx === gameData.player_case) {
      return NextResponse.json(
        { error: 'Cannot burn your chosen case' },
        { status: 400 }
      )
    }

    // Mark card as revealed and burned
    const { error: cardUpdateError } = await supabaseAdmin
      .from('cards')
      .update({
        revealed: true,
        burned: true
      })
      .eq('id', targetCard.id)
      .eq('revealed', false) // Ensure it wasn't already revealed

    if (cardUpdateError) {
      console.error('Failed to update card:', cardUpdateError)
      return NextResponse.json(
        { error: 'Failed to burn case' },
        { status: 500 }
      )
    }

    // Create move record
    await createMove(gameId, authResult.user_id, 'BURN', {
      case_idx: idx,
      value_cents: targetCard.value_cents
    })

    // Count burned cards to determine if banker should offer
    const burnedCount = gameData.cards.filter(card => card.burned || card.idx === idx).length
    let bankerOffer = null

    if (shouldBankerOffer(burnedCount)) {
      // Calculate banker offer based on remaining unrevealed cards
      const remainingValues = getRemainingValues(gameData.cards, gameData.player_case)
      bankerOffer = calculateBankerOffer(remainingValues)

      // Update game with banker offer
      const { error: offerUpdateError } = await supabaseAdmin
        .from('games')
        .update({ banker_offer_cents: bankerOffer })
        .eq('id', gameId)

      if (offerUpdateError) {
        console.error('Failed to update banker offer:', offerUpdateError)
      } else {
        // Create move record for banker offer
        await createMove(gameId, null, 'BANKER_OFFER', {
          offer_cents: bankerOffer,
          burned_count: burnedCount
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Case ${idx + 1} burned! Value: $${(targetCard.value_cents / 100).toFixed(2)}`,
      burned_case: {
        idx,
        value_cents: targetCard.value_cents
      },
      banker_offer: bankerOffer ? {
        amount_cents: bankerOffer,
        amount_display: `$${(bankerOffer / 100).toFixed(2)}`
      } : null
    })

  } catch (error) {
    console.error('Burn case error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
