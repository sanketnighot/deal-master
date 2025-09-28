import { acceptDealOnContract } from "@/lib/dealMasterContract";
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
    const { offerAmount, web3AuthProvider } = body;

    if (!offerAmount) {
      return NextResponse.json(
        { error: "Offer amount is required" },
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
        { error: "Deal has already been accepted" },
        { status: 400 }
      );
    }

    // Call smart contract function
    const contractResult = await acceptDealOnContract(
      gameData.contract_game_id!,
      offerAmount,
      web3AuthProvider
    );

    if (!contractResult.success) {
      return NextResponse.json(
        { error: contractResult.error || "Failed to accept deal on contract" },
        { status: 500 }
      );
    }

    // Update game in database
    const { error: updateError } = await supabaseAdmin
      .from("games")
      .update({
        accepted_deal: true,
        banker_offer_cents: parseInt(offerAmount) / 10000, // Convert from wei to cents
        final_won_cents: parseInt(offerAmount) / 10000, // Convert from wei to cents
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
    await createMove(gameId, authResult.user_id, "ACCEPT_DEAL", {
      offer_amount: offerAmount,
      contract_tx_hash: contractResult.txHash,
    });

    return NextResponse.json({
      success: true,
      message: "Deal accepted successfully!",
      txHash: contractResult.txHash,
      finalAmount: parseInt(offerAmount) / 10000, // Convert to cents for display
    });
  } catch (error) {
    console.error("Accept deal contract error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
