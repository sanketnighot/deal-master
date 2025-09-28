import {
  calculateBankerOffer,
  getRemainingValues,
  shouldBankerOffer,
  validateGameState,
} from "@/lib/server";
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
    const { idx } = body;

    // Validate case index (now supports 8 boxes: 0-7)
    if (typeof idx !== "number" || idx < 0 || idx > 7) {
      return NextResponse.json(
        { error: "Invalid case index. Must be between 0 and 7." },
        { status: 400 }
      );
    }

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
    const stateValidation = validateGameState(gameData, "burn");
    if (!stateValidation.valid) {
      return NextResponse.json(
        { error: stateValidation.error },
        { status: 400 }
      );
    }

    // Check if case exists and can be burned
    const targetCard = gameData.cards.find((card) => card.idx === idx);
    if (!targetCard) {
      return NextResponse.json({ error: "Case not found" }, { status: 400 });
    }

    if (targetCard.revealed) {
      return NextResponse.json(
        { error: "Case already revealed" },
        { status: 400 }
      );
    }

    if (idx === gameData.player_case) {
      return NextResponse.json(
        { error: "Cannot burn your chosen case" },
        { status: 400 }
      );
    }

    // Mark card as revealed and burned
    const { error: cardUpdateError } = await supabaseAdmin
      .from("cards")
      .update({
        revealed: true,
        burned: true,
      })
      .eq("id", targetCard.id)
      .eq("revealed", false); // Ensure it wasn't already revealed

    if (cardUpdateError) {
      console.error("Failed to update card:", cardUpdateError);
      return NextResponse.json(
        { error: "Failed to burn case" },
        { status: 500 }
      );
    }

    // Create move record
    await createMove(gameId, authResult.user_id, "BURN", {
      case_idx: idx,
      value_cents: targetCard.value_cents,
    });

    // Count burned cards to determine if banker should offer
    const burnedCount = gameData.cards.filter(
      (card) => card.burned || card.idx === idx
    ).length;
    let bankerOffer = null;

    // Check if this was the last burn (only 1 card remains: player's case)
    const remainingUnrevealedCards = gameData.cards.filter(
      (card) => !card.revealed && card.idx !== idx
    );
    const isLastBurn = remainingUnrevealedCards.length === 1; // only player's case remains

    if (isLastBurn) {
      // This was the last burn - automatically complete the game
      const playerCard = gameData.cards.find(
        (card) => card.idx === gameData.player_case
      );

      if (playerCard) {
        // Update game to finished state with player's case value
        const { error: gameUpdateError } = await supabaseAdmin
          .from("games")
          .update({
            final_won_cents: playerCard.value_cents,
            status: "FINISHED",
          })
          .eq("id", gameId)
          .in("status", ["PLAYING", "CONTRACT_ACTIVE"]); // Support both legacy and contract games

        if (gameUpdateError) {
          console.error("Failed to complete game:", gameUpdateError);
        } else {
          // Create move record for final reveal
          await createMove(gameId, authResult.user_id, "FINAL_REVEAL", {
            final_case_idx: gameData.player_case,
            final_value_cents: playerCard.value_cents,
            swapped: false,
            player_case_value: playerCard.value_cents,
            auto_completed: true,
          });
        }
      }
    } else if (shouldBankerOffer(burnedCount)) {
      // Calculate banker offer based on remaining unrevealed cards
      const remainingValues = getRemainingValues(
        gameData.cards,
        gameData.player_case
      );
      bankerOffer = calculateBankerOffer(remainingValues);

      // Update game with banker offer
      const { error: offerUpdateError } = await supabaseAdmin
        .from("games")
        .update({ banker_offer_cents: bankerOffer })
        .eq("id", gameId);

      if (offerUpdateError) {
        console.error("Failed to update banker offer:", offerUpdateError);
      } else {
        // Create move record for banker offer
        await createMove(gameId, null, "BANKER_OFFER", {
          offer_cents: bankerOffer,
          burned_count: burnedCount,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: isLastBurn
        ? `Case ${idx + 1} burned! Game complete - you won $${((gameData.cards.find((card) => card.idx === gameData.player_case)?.value_cents || 0) / 100).toFixed(2)}!`
        : `Case ${idx + 1} burned! Value: $${(targetCard.value_cents / 100).toFixed(2)}`,
      burned_case: {
        idx,
        value_cents: targetCard.value_cents,
      },
      banker_offer: bankerOffer
        ? {
            amount_cents: bankerOffer,
            amount_display: `$${(bankerOffer / 100).toFixed(2)}`,
          }
        : null,
      game_completed: isLastBurn,
      final_won_cents: isLastBurn
        ? gameData.cards.find((card) => card.idx === gameData.player_case)
            ?.value_cents
        : null,
    });
  } catch (error) {
    console.error("Burn case error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
