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

    if (gameData.player_case !== null) {
      return NextResponse.json(
        { error: "Initial box has already been selected" },
        { status: 400 }
      );
    }

    // Update database with player's choice
    const { error: updateError } = await supabaseAdmin
      .from("games")
      .update({ player_case: idx })
      .eq("id", gameId)
      .eq("status", "CONTRACT_ACTIVE")
      .is("player_case", null); // Ensure no double-selection

    if (updateError) {
      console.error("Failed to update game:", updateError);
      return NextResponse.json(
        { error: "Failed to update game in database" },
        { status: 500 }
      );
    }

    // Create move record
    await createMove(gameId, authResult.user_id, "SELECT_INITIAL_BOX", {
      box_idx: idx,
      contract_tx_hash: txHash,
    });

    return NextResponse.json({
      success: true,
      message: `Initial box ${idx + 1} selected!`,
      player_case: idx,
      txHash: txHash,
    });
  } catch (error) {
    console.error("Select initial box error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
