import { distributePrize } from "@/lib/pyusd";
import { validateGameState } from "@/lib/server";
import {
  createMove,
  getGameWithDetails,
  supabaseAdmin,
} from "@/lib/supabaseAdminClient";
import { verifyAuthHeader } from "@/lib/web3authServer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    const authResult = await verifyAuthHeader(authHeader);

    if (!authResult.valid) {
      return NextResponse.json(
        { error: "Unauthorized", details: authResult.error },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { swap = false } = body;

    // Get current game state
    const gameData = await getGameWithDetails(gameId);

    if (!gameData) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Check ownership
    if (gameData.user_id !== authResult.user_id) {
      return NextResponse.json(
        { error: "Unauthorized - not game owner" },
        { status: 403 }
      );
    }

    // Validate game state
    const stateValidation = validateGameState(gameData, "finalReveal");
    if (!stateValidation.valid) {
      return NextResponse.json(
        { error: stateValidation.error },
        { status: 400 }
      );
    }

    // Check that only 2 cards remain unrevealed (player's case + one other)
    const unrevealedCards = gameData.cards.filter((card) => !card.revealed);
    if (unrevealedCards.length !== 2) {
      return NextResponse.json(
        { error: "Final reveal can only happen when exactly 2 cases remain" },
        { status: 400 }
      );
    }

    // Find the two remaining cards
    const playerCard = gameData.cards.find(
      (card) => card.idx === gameData.player_case
    );
    const otherCard = unrevealedCards.find(
      (card) => card.idx !== gameData.player_case
    );

    if (!playerCard || !otherCard) {
      return NextResponse.json(
        { error: "Invalid game state for final reveal" },
        { status: 400 }
      );
    }

    let finalCard = playerCard;
    let finalCardIdx = gameData.player_case;

    // Handle swap if requested
    if (swap) {
      finalCard = otherCard;
      finalCardIdx = otherCard.idx;
    }

    // Mark the final card as revealed
    const { error: cardUpdateError } = await supabaseAdmin
      .from("cards")
      .update({ revealed: true })
      .eq("id", finalCard.id)
      .eq("revealed", false);

    if (cardUpdateError) {
      console.error("Failed to reveal final card:", cardUpdateError);
      return NextResponse.json(
        { error: "Failed to reveal final case" },
        { status: 500 }
      );
    }

    // Update game to finished state
    const { error: gameUpdateError } = await supabaseAdmin
      .from("games")
      .update({
        final_won_cents: finalCard.value_cents,
        status: "FINISHED",
      })
      .eq("id", gameId)
      .in("status", ["PLAYING", "CONTRACT_ACTIVE"]); // Support both legacy and contract games

    if (gameUpdateError) {
      console.error("Failed to update game:", gameUpdateError);
      return NextResponse.json(
        { error: "Failed to complete game" },
        { status: 500 }
      );
    }

    // Distribute prize if there's a winning amount
    let prizeDistributionResult = null;
    if (finalCard.value_cents > 0) {
      console.log(
        `🎮 Game ${gameId} completed with prize: ${finalCard.value_cents} cents for user ${gameData.user_id}`
      );
      try {
        console.log("🎁 Attempting automatic prize distribution...");
        prizeDistributionResult = await distributePrize(
          gameData.user_id, // user_id is the wallet address
          finalCard.value_cents
        );

        if (prizeDistributionResult.success) {
          console.log(
            `✅ Prize distribution successful! TX: ${prizeDistributionResult.txHash}`
          );
          // Update game with prize distribution info
          await supabaseAdmin
            .from("games")
            .update({
              prize_distributed: true,
              prize_tx_hash: prizeDistributionResult.txHash,
            })
            .eq("id", gameId);
        } else {
          console.error(
            `❌ Prize distribution failed: ${prizeDistributionResult.error}`
          );
          // Mark the game as completed but note that prize distribution failed
          await supabaseAdmin
            .from("games")
            .update({
              prize_distributed: false,
              prize_distribution_error: prizeDistributionResult.error,
            })
            .eq("id", gameId);
        }
      } catch (error) {
        console.error("💥 Exception during prize distribution:", error);
        // Mark the game as completed but note that prize distribution failed
        await supabaseAdmin
          .from("games")
          .update({
            prize_distributed: false,
            prize_distribution_error:
              error instanceof Error
                ? error.message
                : "Unknown error during prize distribution",
          })
          .eq("id", gameId);
        // Don't fail the game completion if prize distribution fails
        // The prize can be distributed manually later
      }
    } else {
      console.log(
        `🎮 Game ${gameId} completed with no prize (${finalCard.value_cents} cents)`
      );
    }

    // Create move record
    await createMove(gameId, authResult.user_id, "FINAL_REVEAL", {
      final_case_idx: finalCardIdx,
      final_value_cents: finalCard.value_cents,
      swapped: swap,
      player_case_value: playerCard.value_cents,
      other_case_value: otherCard.value_cents,
    });

    return NextResponse.json({
      success: true,
      message: swap ? "Case swapped and revealed!" : "Final case revealed!",
      final_won_cents: finalCard.value_cents,
      final_won_display: `$${(finalCard.value_cents / 100).toFixed(2)}`,
      final_case: {
        idx: finalCardIdx,
        value_cents: finalCard.value_cents,
      },
      swap_info: swap
        ? {
            original_case: {
              idx: gameData.player_case,
              value_cents: playerCard.value_cents,
            },
            swapped_to: {
              idx: otherCard.idx,
              value_cents: otherCard.value_cents,
            },
          }
        : null,
      prize_distributed: prizeDistributionResult?.success || false,
      prize_tx_hash: prizeDistributionResult?.txHash || null,
    });
  } catch (error) {
    console.error("Final reveal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
