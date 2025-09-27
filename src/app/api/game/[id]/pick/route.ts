import { validateGameState } from '@/lib/server'
import { createMove, getGameWithDetails, supabaseAdmin } from '@/lib/supabaseAdminClient'
import { verifyAuthHeader } from '@/lib/web3authServer'
import { NextRequest, NextResponse } from 'next/server'

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

    // Validate case index
    if (typeof idx !== "number" || idx < 0 || idx > 4) {
      return NextResponse.json(
        { error: "Invalid case index. Must be between 0 and 4." },
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
    const stateValidation = validateGameState(gameData, "pick");
    if (!stateValidation.valid) {
      return NextResponse.json(
        { error: stateValidation.error },
        { status: 400 }
      );
    }

    // Check if case exists
    const targetCard = gameData.cards.find((card) => card.idx === idx);
    if (!targetCard) {
      return NextResponse.json({ error: "Case not found" }, { status: 400 });
    }

    // Update game with player's choice
    const { error: updateError } = await supabaseAdmin
      .from("games")
      .update({ player_case: idx })
      .eq("id", gameId)
      .eq("status", "PLAYING")
      .is("player_case", null); // Ensure no double-pick

    if (updateError) {
      console.error("Failed to update game:", updateError);
      return NextResponse.json(
        { error: "Failed to pick case" },
        { status: 500 }
      );
    }

    // Create move record
    await createMove(gameId, authResult.user_id, "PICK", {
      case_idx: idx,
    });

    return NextResponse.json({
      success: true,
      message: `Case ${idx + 1} selected!`,
      player_case: idx,
    });
  } catch (error) {
    console.error("Pick case error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
