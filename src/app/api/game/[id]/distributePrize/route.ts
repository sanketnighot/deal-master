import { distributePrize } from '@/lib/pyusd'
import { supabaseAdmin } from '@/lib/supabaseAdminClient'
import { verifyAuthHeader } from '@/lib/web3authServer'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: gameId } = await params

    // Parse request body
    const body = await request.json()
    const { prizeAmountCents } = body

    // Validate inputs
    if (typeof prizeAmountCents !== 'number' || prizeAmountCents < 0) {
      return NextResponse.json(
        { error: 'Invalid prize amount' },
        { status: 400 }
      )
    }

    // Get game details
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('*')
      .eq('id', gameId)
      .eq('user_id', authResult.user_id)
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Check if game is completed
    if (game.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Game is not completed yet' },
        { status: 400 }
      )
    }

    // Check if prize has already been distributed
    if (game.prize_distributed) {
      return NextResponse.json(
        { error: 'Prize has already been distributed' },
        { status: 400 }
      )
    }

    // Validate that the prize amount matches the game's final winnings
    const expectedPrize = game.final_won_cents || 0
    if (prizeAmountCents !== expectedPrize) {
      return NextResponse.json(
        {
          error: 'Prize amount mismatch',
          expected: expectedPrize,
          provided: prizeAmountCents
        },
        { status: 400 }
      )
    }

    // If no prize to distribute, mark as distributed and return
    if (prizeAmountCents === 0) {
      await supabaseAdmin
        .from('games')
        .update({ prize_distributed: true })
        .eq('id', gameId)

      return NextResponse.json({
        success: true,
        message: 'No prize to distribute',
        txHash: null,
      })
    }

    // Distribute prize via PYUSD transfer
    const result = await distributePrize(game.user_id, prizeAmountCents) // user_id is the wallet address

    if (result.success) {
      // Update game to mark prize as distributed
      await supabaseAdmin
        .from('games')
        .update({
          prize_distributed: true,
          prize_tx_hash: result.txHash
        })
        .eq('id', gameId)

      return NextResponse.json({
        success: true,
        message: 'Prize distributed successfully',
        txHash: result.txHash,
        amount: prizeAmountCents,
      })
    } else {
      return NextResponse.json(
        {
          error: 'Failed to distribute prize',
          details: result.error
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Prize distribution error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
