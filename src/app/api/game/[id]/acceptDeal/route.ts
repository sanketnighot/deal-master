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
    const stateValidation = validateGameState(gameData, "acceptDeal");
    if (!stateValidation.valid) {
      return NextResponse.json(
        { error: stateValidation.error },
        { status: 400 }
      );
    }

    // Update game to accept the deal
    const { error: updateError } = await supabaseAdmin
      .from("games")
      .update({
        accepted_deal: true,
        final_won_cents: gameData.banker_offer_cents,
        status: "FINISHED",
      })
      .eq("id", gameId)
      .eq("status", "PLAYING")
      .eq("accepted_deal", false); // Ensure no double-accept

    if (updateError) {
      console.error("Failed to accept deal:", updateError);
      return NextResponse.json(
        { error: "Failed to accept deal" },
        { status: 500 }
      );
    }

    // Distribute prize if there's a winning amount
    let prizeDistributionResult = null;
    if (
      gameData.banker_offer_cents &&
      gameData.banker_offer_cents > 0
    ) {
      try {
        prizeDistributionResult = await distributePrize(
          gameData.user_id, // user_id is the wallet address
          gameData.banker_offer_cents
        );

        if (prizeDistributionResult.success) {
          // Update game with prize distribution info
          await supabaseAdmin
            .from("games")
            .update({
              prize_distributed: true,
              prize_tx_hash: prizeDistributionResult.txHash,
            })
            .eq("id", gameId);
        }
      } catch (error) {
        console.error("Failed to distribute prize:", error);
        // Don't fail the game completion if prize distribution fails
        // The prize can be distributed manually later
      }
    }

    // Create move record
    await createMove(gameId, authResult.user_id, "ACCEPT_DEAL", {
      offer_cents: gameData.banker_offer_cents,
    });

    return NextResponse.json({
      success: true,
      message: "Deal accepted!",
      final_won_cents: gameData.banker_offer_cents,
      final_won_display: `$${(gameData.banker_offer_cents! / 100).toFixed(2)}`,
      prize_distributed: prizeDistributionResult?.success || false,
      prize_tx_hash: prizeDistributionResult?.txHash || null,
    });
  } catch (error) {
    console.error("Accept deal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
