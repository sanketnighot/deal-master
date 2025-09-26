import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role key
// This client has full database access and bypasses RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database types
export interface Game {
  id: string
  user_id: string
  entry_fee_cents: number
  currency: string
  created_at: string
  status: 'CREATED' | 'PLAYING' | 'FINISHED' | 'CANCELLED'
  player_case: number | null
  banker_offer_cents: number | null
  accepted_deal: boolean
  final_won_cents: number | null
}

export interface Card {
  id: string
  game_id: string
  idx: number
  value_cents: number
  revealed: boolean
  burned: boolean
}

export interface Move {
  id: string
  game_id: string
  actor_user_id: string | null
  action: string
  payload: any
  created_at: string
}

export interface GameWithCards extends Game {
  cards: Card[]
  moves: Move[]
}

// Helper function to get a game with its cards and moves
export async function getGameWithDetails(gameId: string): Promise<GameWithCards | null> {
  const { data: game, error: gameError } = await supabaseAdmin
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single()

  if (gameError || !game) {
    return null
  }

  const { data: cards, error: cardsError } = await supabaseAdmin
    .from('cards')
    .select('*')
    .eq('game_id', gameId)
    .order('idx')

  if (cardsError) {
    throw new Error(`Failed to fetch cards: ${cardsError.message}`)
  }

  const { data: moves, error: movesError } = await supabaseAdmin
    .from('moves')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at')

  if (movesError) {
    throw new Error(`Failed to fetch moves: ${movesError.message}`)
  }

  return {
    ...game,
    cards: cards || [],
    moves: moves || []
  }
}

// Helper function to create a move record
export async function createMove(
  gameId: string,
  actorUserId: string | null,
  action: string,
  payload: any = null
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('moves')
    .insert({
      game_id: gameId,
      actor_user_id: actorUserId,
      action,
      payload
    })

  if (error) {
    throw new Error(`Failed to create move: ${error.message}`)
  }
}
