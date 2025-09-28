import { CONTRACT_BOX_VALUES_CENTS, CONTRACT_ENTRY_FEE_CENTS } from "@/lib/config";
import { getServerContractGameState, verifyServerGameStartTransaction } from "@/lib/dealMasterContract";
import { createMove, supabaseAdmin } from "@/lib/supabaseAdminClient";
import { verifyAuthHeader } from "@/lib/web3authServer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
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
    const {
      contractTxHash,
      userAddress,
    } = body;

    // Validate transaction hash
    if (!contractTxHash || typeof contractTxHash !== "string") {
      return NextResponse.json(
        { error: "Smart contract transaction hash is required" },
        { status: 400 }
      );
    }

    // Validate user address
    if (!userAddress || typeof userAddress !== "string") {
      return NextResponse.json(
        { error: "User address is required" },
        { status: 400 }
      );
    }

    // Ensure user address is lowercase for consistency
    const normalizedUserAddress = userAddress.toLowerCase();

    console.log(
      `🎮 Creating contract game for user: ${normalizedUserAddress}, tx: ${contractTxHash}`
    );

    // Verify the smart contract transaction
    const verificationResult = await verifyServerGameStartTransaction(
      contractTxHash,
      normalizedUserAddress
    );

    if (!verificationResult.success) {
      console.error(`❌ Contract transaction verification failed: ${verificationResult.error}`);
      return NextResponse.json(
        {
          error: "Invalid smart contract transaction",
          details: verificationResult.error
        },
        { status: 400 }
      );
    }

    const contractGameId = verificationResult.gameId!;
    console.log(`✅ Contract transaction verified. Game ID: ${contractGameId}`);

    // Check if this contract game already exists in our database
    const { data: existingGame } = await supabaseAdmin
      .from("games")
      .select("id")
      .eq("contract_game_id", contractGameId)
      .eq("game_mode", "contract")
      .single();

    if (existingGame) {
      console.log(`⚠️ Contract game ${contractGameId} already exists in database`);
      return NextResponse.json(
        { error: "Game already exists for this contract transaction" },
        { status: 409 }
      );
    }

    // Get initial game state from smart contract
    const contractState = await getServerContractGameState(contractGameId);
    if (!contractState) {
      return NextResponse.json(
        { error: "Failed to fetch game state from smart contract" },
        { status: 500 }
      );
    }

    // Create game in database
    const { data: game, error: gameError } = await supabaseAdmin
      .from("games")
      .insert({
        user_id: normalizedUserAddress,
        entry_fee_cents: CONTRACT_ENTRY_FEE_CENTS,
        status: "CONTRACT_ACTIVE",
        contract_game_id: contractGameId,
        contract_tx_hash: contractTxHash,
        game_mode: "contract",
        currency: "PYUSD",
      })
      .select()
      .single();

    if (gameError) {
      console.error("❌ Failed to create game:", gameError);
      return NextResponse.json(
        { error: "Failed to create game in database" },
        { status: 500 }
      );
    }

    console.log(`✅ Database game created with ID: ${game.id}`);

    // Create cards/boxes based on smart contract box values
    const cardsData = CONTRACT_BOX_VALUES_CENTS.map((value, idx) => ({
      game_id: game.id,
      idx,
      value_cents: value,
      contract_box_index: idx, // In smart contract, boxes are not shuffled initially
    }));

    const { error: cardsError } = await supabaseAdmin
      .from("cards")
      .insert(cardsData);

    if (cardsError) {
      console.error("❌ Failed to create cards:", cardsError);
      // Clean up the game if cards creation failed
      await supabaseAdmin.from("games").delete().eq("id", game.id);
      return NextResponse.json(
        { error: "Failed to create game cards" },
        { status: 500 }
      );
    }

    console.log(`✅ Created ${cardsData.length} cards for game ${game.id}`);

    // Create initial move
    await createMove(game.id, authResult.user_id, "CONTRACT_GAME_CREATED", {
      contract_game_id: contractGameId,
      contract_tx_hash: contractTxHash,
      entry_fee_cents: CONTRACT_ENTRY_FEE_CENTS,
      box_count: CONTRACT_BOX_VALUES_CENTS.length,
      currency: "PYUSD",
    });

    // Return game info
    return NextResponse.json({
      success: true,
      game: {
        ...game,
        contract_game_id: contractGameId,
        box_count: CONTRACT_BOX_VALUES_CENTS.length,
        box_values: CONTRACT_BOX_VALUES_CENTS,
      },
      contract_state: contractState,
    });
  } catch (error: any) {
    console.error("💥 Error in contract game creation API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
