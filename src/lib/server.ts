import { randomBytes, randomInt } from 'crypto'
import { type Card } from './supabaseAdminClient'

/**
 * Generate 5 card values for a game based on entry fee
 * One card is guaranteed to be the maximum (up to 10x entry fee)
 * Other cards are distributed across reasonable ranges
 */
export function generateCardValues(entryFeeCents: number): number[] {
  const maxValue = Math.min(entryFeeCents * 10, 100000) // Cap at $1000
  const minValue = Math.max(entryFeeCents * 0.1, 100) // At least $1 or 10% of entry fee

  // Define value buckets for good distribution
  const buckets = [
    { min: minValue, max: entryFeeCents * 0.5 }, // Low values
    { min: entryFeeCents * 0.5, max: entryFeeCents * 1.5 }, // Around entry fee
    { min: entryFeeCents * 1.5, max: entryFeeCents * 3 }, // Good values
    { min: entryFeeCents * 3, max: entryFeeCents * 6 }, // High values
  ]

  const values: number[] = []

  // Add the maximum value
  values.push(maxValue)

  // Add one value from each bucket
  for (const bucket of buckets) {
    const value = randomInt(bucket.min, bucket.max + 1)
    values.push(value)
  }

  // Shuffle the array using Fisher-Yates algorithm
  for (let i = values.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1)
    ;[values[i], values[j]] = [values[j], values[i]]
  }

  return values
}

/**
 * Calculate banker offer based on remaining unrevealed cards
 * Uses average of remaining values with a random factor (0.6-0.8)
 */
export function calculateBankerOffer(remainingValues: number[]): number {
  if (remainingValues.length === 0) {
    return 0
  }

  const average = remainingValues.reduce((sum, value) => sum + value, 0) / remainingValues.length

  // Random factor between 0.6 and 0.8
  const factor = 0.6 + (randomBytes(1)[0] / 255) * 0.2

  return Math.round(average * factor)
}

/**
 * Check if banker should make an offer based on game state
 * Banker offers after 2nd burn, optionally after 3rd burn
 */
export function shouldBankerOffer(burnedCount: number): boolean {
  return burnedCount === 2 || burnedCount === 3
}

/**
 * Get remaining unrevealed card values
 */
export function getRemainingValues(cards: Card[], playerCase: number | null): number[] {
  return cards
    .filter(card => !card.revealed && card.idx !== playerCase)
    .map(card => card.value_cents)
}

/**
 * Validate game state for various operations
 */
export function validateGameState(game: any, operation: string): { valid: boolean; error?: string } {
  // Helper function to check if game is in active/playing state
  const isGameActive = (status: string) => {
    return status === "PLAYING" || status === "CONTRACT_ACTIVE";
  };

  switch (operation) {
    case "pick":
      if (!isGameActive(game.status)) {
        return { valid: false, error: "Game is not in playing state" };
      }
      if (game.player_case !== null) {
        return { valid: false, error: "Player has already picked a case" };
      }
      break;

    case "burn":
      if (!isGameActive(game.status)) {
        return { valid: false, error: "Game is not in playing state" };
      }
      if (game.player_case === null) {
        return { valid: false, error: "Player must pick a case first" };
      }
      break;

    case "acceptDeal":
      if (!isGameActive(game.status)) {
        return { valid: false, error: "Game is not in playing state" };
      }
      if (game.banker_offer_cents === null) {
        return { valid: false, error: "No banker offer available" };
      }
      if (game.accepted_deal) {
        return { valid: false, error: "Deal already accepted" };
      }
      break;

    case "finalReveal":
      if (!isGameActive(game.status)) {
        return { valid: false, error: "Game is not in playing state" };
      }
      if (game.accepted_deal) {
        return { valid: false, error: "Cannot reveal after accepting deal" };
      }
      // Additional validation will be done in the route handler to check card count
      break;
  }

  return { valid: true };
}

/**
 * Format currency amount for display
 */
export function formatCurrency(cents: number, currency: string = 'USD'): string {
  const amount = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

/**
 * Get game status display text
 */
export function getGameStatusText(status: string): string {
  switch (status) {
    case 'CREATED':
      return 'Ready to Start'
    case 'PLAYING':
      return 'In Progress'
    case 'FINISHED':
      return 'Completed'
    case 'CANCELLED':
      return 'Cancelled'
    default:
      return status
  }
}

/**
 * Check if game is in a terminal state
 */
export function isGameFinished(status: string): boolean {
  return status === 'FINISHED' || status === 'CANCELLED'
}

/**
 * Get public game state (safe for non-owners)
 */
export function getPublicGameState(game: any, cards: Card[]): any {
  const revealedCards = cards.filter(card => card.revealed)
  const unrevealedCount = cards.filter(card => !card.revealed).length

  return {
    id: game.id,
    status: game.status,
    entry_fee_cents: game.entry_fee_cents,
    currency: game.currency,
    created_at: game.created_at,
    player_case: game.player_case,
    banker_offer_cents: game.banker_offer_cents,
    accepted_deal: game.accepted_deal,
    final_won_cents: game.final_won_cents,
    game_mode: game.game_mode,
    contract_game_id: game.contract_game_id,
    contract_tx_hash: game.contract_tx_hash,
    revealed_cards: revealedCards.map((card) => ({
      idx: card.idx,
      value_cents: card.value_cents,
      burned: card.burned,
    })),
    unrevealed_count: unrevealedCount,
  };
}

/**
 * Get full game state (for game owner)
 */
export function getFullGameState(game: any, cards: Card[], moves: any[]): any {
  return {
    ...game,
    cards: cards.map(card => ({
      idx: card.idx,
      value_cents: card.value_cents,
      revealed: card.revealed,
      burned: card.burned
    })),
    moves: moves.map(move => ({
      action: move.action,
      payload: move.payload,
      created_at: move.created_at
    }))
  }
}
