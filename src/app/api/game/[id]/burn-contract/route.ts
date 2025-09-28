import { getServerContractGameState } from "@/lib/dealMasterContract";
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
    const { idx, txHash } = body;

    // Validate box index (0-7 for 8 boxes)
    if (typeof idx !== "number" || idx < 0 || idx > 7) {
      return NextResponse.json(
        { error: "Invalid box index. Must be between 0 and 7." },
        { status: 400 }
      );
    }

    if (!txHash) {
      return NextResponse.json(
        { error: "Transaction hash is required" },
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

    // Validate this is a contract game
    if (gameData.game_mode !== "contract") {
      return NextResponse.json(
        { error: "This action is only available for contract games" },
        { status: 400 }
      );
    }

    // Validate game state
    if (gameData.status !== "CONTRACT_ACTIVE") {
      return NextResponse.json(
        { error: "Game is not in active state" },
        { status: 400 }
      );
    }

    if (gameData.player_case === null) {
      return NextResponse.json(
        { error: "Must select initial box first" },
        { status: 400 }
      );
    }

    // Check if trying to burn the player's selected box
    if (idx === gameData.player_case) {
      return NextResponse.json(
        { error: "Cannot burn your selected box" },
        { status: 400 }
      );
    }

    // Check if box is already burned in our database
    const targetCard = gameData.cards.find((card) => card.idx === idx);
    if (!targetCard) {
      return NextResponse.json({ error: "Box not found" }, { status: 400 });
    }

    if (targetCard.burned) {
      return NextResponse.json(
        { error: "Box has already been burned" },
        { status: 400 }
      );
    }

    // Note: Smart contract interaction is handled client-side
    // This endpoint only updates the database state

    // Update the card as burned in database
    const { error: cardUpdateError } = await supabaseAdmin
      .from("cards")
      .update({
        burned: true,
        revealed: true, // Contract games reveal the value when burned
      })
      .eq("game_id", gameId)
      .eq("idx", idx);

    if (cardUpdateError) {
      console.error("Failed to update card:", cardUpdateError);
      return NextResponse.json(
        { error: "Failed to update card in database" },
        { status: 500 }
      );
    }

    // Create move record
    await createMove(gameId, authResult.user_id, "BURN_BOX", {
      box_idx: idx,
      contract_tx_hash: txHash,
    });

    // Get updated contract state to check if game is finished
    try {
      const contractState = await getServerContractGameState(
        gameData.contract_game_id!
      );

      // Check if game has ended (round 6 reached or game no longer active)
      if (
        contractState &&
        (!contractState.gameActive || contractState.round >= 6)
      ) {
        // Update game status to indicate it's ready for final selection
        await supabaseAdmin
          .from("games")
          .update({ status: "CONTRACT_ACTIVE" }) // Keep active for final selection
          .eq("id", gameId);
      }
    } catch (error) {
      console.warn("Could not fetch contract state after burn:", error);
    }

    return NextResponse.json({
      success: true,
      message: `Box ${idx + 1} burned!`,
      txHash: txHash,
      burnedBox: idx,
      cardValue: targetCard.value_cents,
    });
  } catch (error) {
    console.error("Burn box contract error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
