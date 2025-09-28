// Sepolia testnet configuration
export const ADMIN_ADDRESS: string = "0x510f0A4384bD93915B3977d7f2A91e4b1525c298";
export const CHAIN_ID: number = 545;

// contracts on Sepolia testnet
// export const USD_ADDRESS: string = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
// export const DEAL_MASTER_ADDRESS: string = "";

// contracts on Flow testnet
export const USD_ADDRESS: string = "0x9b5fC2671C9BD84907708Bd49C3Aa72cc5EC00d2";
export const DEAL_MASTER_ADDRESS: string =
  "0x5E56e7630af0CD5002Bb0FeDBFF7Bb6B89B634f6";

// Game Configuration (Smart Contract Based)
export const ENTRY_FEE_CENTS: number = 500; // $5.00 in cents
export const BOX_COUNT: number = 8; // 8 boxes
export const BOX_VALUES_CENTS: number[] = [
  100, // $1.00
  200, // $2.00
  400, // $4.00
  800, // $8.00
  1500, // $15.00
  2200, // $22.00
  3800, // $38.00
  7500, // $75.00
];
export const MAX_PRIZE_CENTS: number = Math.max(...BOX_VALUES_CENTS); // $75.00

// Legacy aliases for backward compatibility
export const CONTRACT_ENTRY_FEE_CENTS: number = ENTRY_FEE_CENTS;
export const CONTRACT_BOX_COUNT: number = BOX_COUNT;
export const CONTRACT_BOX_VALUES_CENTS: number[] = BOX_VALUES_CENTS;
