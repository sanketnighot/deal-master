-- Deal Master Database Schema
-- This file contains the complete database schema for the Deal or No Deal game

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Games table - stores game sessions
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,                 -- web3auth sub or wallet address
  entry_fee_cents int NOT NULL DEFAULT 2000,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'CREATED', -- CREATED, PLAYING, FINISHED, CANCELLED
  player_case int NULL,                  -- index of player's chosen case (0-4)
  banker_offer_cents int NULL,           -- current banker offer in cents
  accepted_deal boolean DEFAULT false,   -- whether player accepted the deal
  final_won_cents int NULL               -- final amount won in cents
);

-- Cards table - stores individual case values
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  idx int NOT NULL,            -- 0..4 (case index)
  value_cents int NOT NULL,    -- case value in cents
  revealed boolean DEFAULT false,  -- whether case has been revealed
  burned boolean DEFAULT false     -- whether case has been burned (revealed during play)
);

-- Moves table - audit trail of all game actions
CREATE TABLE IF NOT EXISTS moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  actor_user_id text,          -- user who performed the action
  action text NOT NULL,        -- action type (PICK, BURN, BANKER_OFFER, ACCEPT_DEAL, etc.)
  payload jsonb,               -- action-specific data
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_user ON games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_cards_game ON cards(game_id);
CREATE INDEX IF NOT EXISTS idx_cards_game_idx ON cards(game_id, idx);
CREATE INDEX IF NOT EXISTS idx_moves_game ON moves(game_id);
CREATE INDEX IF NOT EXISTS idx_moves_created ON moves(created_at);

-- Constraints
ALTER TABLE cards ADD CONSTRAINT cards_idx_range CHECK (idx >= 0 AND idx <= 4);
ALTER TABLE cards ADD CONSTRAINT cards_unique_game_idx UNIQUE (game_id, idx);
ALTER TABLE games ADD CONSTRAINT games_status_valid CHECK (status IN ('CREATED', 'PLAYING', 'FINISHED', 'CANCELLED'));
ALTER TABLE games ADD CONSTRAINT games_player_case_range CHECK (player_case IS NULL OR (player_case >= 0 AND player_case <= 4));
ALTER TABLE games ADD CONSTRAINT games_entry_fee_positive CHECK (entry_fee_cents > 0);
ALTER TABLE cards ADD CONSTRAINT cards_value_positive CHECK (value_cents > 0);

-- Comments for documentation
COMMENT ON TABLE games IS 'Game sessions with player state and banker offers';
COMMENT ON TABLE cards IS 'Individual case values for each game';
COMMENT ON TABLE moves IS 'Audit trail of all game actions for debugging and analytics';

COMMENT ON COLUMN games.user_id IS 'Web3Auth subject ID or wallet address';
COMMENT ON COLUMN games.entry_fee_cents IS 'Entry fee in cents (e.g., 2000 = $20.00)';
COMMENT ON COLUMN games.player_case IS 'Index (0-4) of the case chosen by the player';
COMMENT ON COLUMN games.banker_offer_cents IS 'Current banker offer in cents';
COMMENT ON COLUMN games.final_won_cents IS 'Final amount won in cents';

COMMENT ON COLUMN cards.idx IS 'Case index (0-4) within the game';
COMMENT ON COLUMN cards.value_cents IS 'Case value in cents';
COMMENT ON COLUMN cards.revealed IS 'Whether the case has been revealed';
COMMENT ON COLUMN cards.burned IS 'Whether the case was burned during gameplay';

COMMENT ON COLUMN moves.action IS 'Action type: PICK, BURN, BANKER_OFFER, ACCEPT_DEAL, REJECT_DEAL, FINAL_REVEAL';
COMMENT ON COLUMN moves.payload IS 'JSON data specific to the action (e.g., case index, offer amount)';
