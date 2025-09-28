import { distributePrize } from '@/lib/pyusd';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Retrying prize distribution for game ${gameId}...`);

    // Get game details
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Check if game is completed
    if (game.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Game is not completed yet' },
        { status: 400 }
      );
    }

    // Check if prize has already been distributed
    if (game.prize_distributed) {
      return NextResponse.json(
        { error: 'Prize has already been distributed' },
        { status: 400 }
      );
    }

    const prizeAmount = game.final_won_cents || 0;

    if (prizeAmount <= 0) {
      // Mark as distributed since there's no prize
      await supabaseAdmin
        .from('games')
        .update({
          prize_distributed: true,
          prize_distribution_error: null
        })
        .eq('id', gameId);

      return NextResponse.json({
        success: true,
        message: 'No prize to distribute',
        prize_amount: 0,
      });
    }

    console.log(`🎁 Attempting to distribute ${prizeAmount} cents to ${game.user_id}...`);

    // Attempt prize distribution
    const result = await distributePrize(game.user_id, prizeAmount);

    if (result.success) {
      // Update game to mark prize as distributed
      await supabaseAdmin
        .from('games')
        .update({
          prize_distributed: true,
          prize_tx_hash: result.txHash,
          prize_distribution_error: null
        })
        .eq('id', gameId);

      console.log(`✅ Prize distribution successful! TX: ${result.txHash}`);

      return NextResponse.json({
        success: true,
        message: 'Prize distributed successfully',
        txHash: result.txHash,
        prize_amount: prizeAmount,
      });
    } else {
      // Update error message
      await supabaseAdmin
        .from('games')
        .update({
          prize_distributed: false,
          prize_distribution_error: result.error
        })
        .eq('id', gameId);

      console.error(`❌ Prize distribution failed: ${result.error}`);

      return NextResponse.json(
        {
          error: 'Failed to distribute prize',
          details: result.error,
          prize_amount: prizeAmount,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('💥 Error in retry prize distribution:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}
