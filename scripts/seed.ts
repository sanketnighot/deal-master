import { supabaseAdmin } from '../src/lib/supabaseAdminClient'
import { generateCardValues } from '../src/lib/server'

async function seedDatabase() {
  try {
    // Demo user ID (simulating Web3Auth sub)
    const demoUserId = "demo:web3auth:sub123";
    const demoEmail = "demo@deal-master.com";

    // Create demo game
    const { data: game, error: gameError } = await supabaseAdmin
      .from("games")
      .insert({
        user_id: demoUserId,
        entry_fee_cents: 2000, // $20
        status: "PLAYING",
      })
      .select()
      .single();

    if (gameError) {
      throw new Error(`Failed to create demo game: ${gameError.message}`);
    }


    // Generate card values
    const cardValues = generateCardValues(2000);

    // Create cards
    const cardsData = cardValues.map((value, idx) => ({
      game_id: game.id,
      idx,
      value_cents: value,
    }));

    const { error: cardsError } = await supabaseAdmin
      .from("cards")
      .insert(cardsData);

    if (cardsError) {
      throw new Error(`Failed to create demo cards: ${cardsError.message}`);
    }


    // Create initial move
    const { error: moveError } = await supabaseAdmin.from("moves").insert({
      game_id: game.id,
      actor_user_id: demoUserId,
      action: "GAME_CREATED",
      payload: {
        entry_fee_cents: 2000,
        card_count: cardValues.length,
        demo: true,
      },
    });

    if (moveError) {
      throw new Error(`Failed to create demo move: ${moveError.message}`);
    }

    const { data: completedGame, error: completedGameError } =
      await supabaseAdmin
        .from("games")
        .insert({
          user_id: demoUserId,
          entry_fee_cents: 1000, // $10
          status: "FINISHED",
          player_case: 2,
          banker_offer_cents: 1500, // $15
          accepted_deal: true,
          final_won_cents: 1500,
        })
        .select()
        .single();

    if (completedGameError) {
      throw new Error(
        `Failed to create completed demo game: ${completedGameError.message}`
      );
    }

    // Create cards for completed game
    const completedCardValues = generateCardValues(1000);
    const completedCardsData = completedCardValues.map((value, idx) => ({
      game_id: completedGame.id,
      idx,
      value_cents: value,
      revealed: idx !== 2, // Only player's case (idx 2) remains unrevealed
      burned: idx !== 2,
    }));

    const { error: completedCardsError } = await supabaseAdmin
      .from("cards")
      .insert(completedCardsData);

    if (completedCardsError) {
      throw new Error(
        `Failed to create completed demo cards: ${completedCardsError.message}`
      );
    }

    // Create moves for completed game
    const completedMoves = [
      {
        game_id: completedGame.id,
        actor_user_id: demoUserId,
        action: "GAME_CREATED",
        payload: { entry_fee_cents: 1000, card_count: 5, demo: true },
      },
      {
        game_id: completedGame.id,
        actor_user_id: demoUserId,
        action: "PICK",
        payload: { case_idx: 2 },
      },
      {
        game_id: completedGame.id,
        actor_user_id: demoUserId,
        action: "BURN",
        payload: { case_idx: 0, value_cents: completedCardValues[0] },
      },
      {
        game_id: completedGame.id,
        actor_user_id: null,
        action: "BANKER_OFFER",
        payload: { offer_cents: 1500, burned_count: 1 },
      },
      {
        game_id: completedGame.id,
        actor_user_id: demoUserId,
        action: "ACCEPT_DEAL",
        payload: { offer_cents: 1500 },
      },
    ];

    const { error: completedMovesError } = await supabaseAdmin
      .from("moves")
      .insert(completedMoves);

    if (completedMovesError) {
      throw new Error(
        `Failed to create completed demo moves: ${completedMovesError.message}`
      );
    }
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seed script failed:', error)
      process.exit(1)
    })
}

export { seedDatabase }
