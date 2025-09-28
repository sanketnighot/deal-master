import { finalSelectionOnContract } from "@/lib/dealMasterContract";
import { createMove, getGameWithDetails, supabaseAdmin } from "@/lib/supabaseAdminClient";
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
    const { keepOriginalBox, web3AuthProvider } = body;

    if (typeof keepOriginalBox !== "boolean") {
      return NextResponse.json(
        { error: "keepOriginalBox must be a boolean" },
        { status: 400 }
      );
    }

    if (!web3AuthProvider) {
      return NextResponse.json(
        { error: "Web3Auth provider is required" },
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

    if (gameData.accepted_deal) {
      return NextResponse.json(
        { error: "Cannot make final selection after accepting deal" },
        { status: 400 }
      );
    }

    // Verify we have exactly 6 burned boxes and 2 remaining
    const burnedCount = gameData.cards.filter(card => card.burned).length;
    if (burnedCount !== 6) {
      return NextResponse.json(
        { error: `Must burn exactly 6 boxes before final selection. Currently burned: ${burnedCount}` },
        { status: 400 }
      );
    }

    // Call smart contract function
    const contractResult = await finalSelectionOnContract(
      gameData.contract_game_id!,
      keepOriginalBox,
      web3AuthProvider
    );

    if (!contractResult.success) {
      return NextResponse.json(
        { error: contractResult.error || "Failed to make final selection on contract" },
        { status: 500 }
      );
    }

    // Determine which box was chosen and its value
    let finalBoxIndex: number;
    if (keepOriginalBox) {
      finalBoxIndex = gameData.player_case!;
    } else {
      // Find the other unburned box
      const unburned = gameData.cards.filter(card => !card.burned && card.idx !== gameData.player_case);
      if (unburned.length !== 1) {
        console.error("Expected exactly 1 unburned box (excluding player's), found:", unburned.length);
        return NextResponse.json(
          { error: "Invalid game state: incorrect number of unburned boxes" },
          { status: 500 }
        );
      }
      finalBoxIndex = unburned[0].idx;
    }

    const finalCard = gameData.cards.find(card => card.idx === finalBoxIndex);
    if (!finalCard) {
      return NextResponse.json(
        { error: "Final card not found" },
        { status: 500 }
      );
    }

    // Reveal the final card
    await supabaseAdmin
      .from("cards")
      .update({ revealed: true })
      .eq("game_id", gameId)
      .eq("idx", finalBoxIndex);

    // Update game as completed
    const { error: updateError } = await supabaseAdmin
      .from("games")
      .update({
        final_won_cents: finalCard.value_cents,
        status: "CONTRACT_COMPLETED",
      })
      .eq("id", gameId)
      .eq("status", "CONTRACT_ACTIVE");

    if (updateError) {
      console.error("Failed to update game:", updateError);
      return NextResponse.json(
        { error: "Failed to update game in database" },
        { status: 500 }
      );
    }

    // Create move record
    await createMove(gameId, authResult.user_id, "FINAL_SELECTION", {
      keep_original_box: keepOriginalBox,
      final_box_index: finalBoxIndex,
      final_amount: finalCard.value_cents,
      contract_tx_hash: contractResult.txHash,
    });

    return NextResponse.json({
      success: true,
      message: `Final selection made! ${keepOriginalBox ? 'Kept original box' : 'Switched to other box'}`,
      txHash: contractResult.txHash,
      finalBoxIndex,
      finalAmount: finalCard.value_cents,
      keptOriginal: keepOriginalBox,
    });
  } catch (error) {
    console.error("Final selection contract error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
