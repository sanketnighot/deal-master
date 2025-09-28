import { ethers } from "ethers";
import { CHAIN_ID, DEAL_MASTER_ADDRESS, USD_ADDRESS } from "./config";
import { dealMasterAbi } from "./deal_master_abi";
import { pyusd_abi } from "./pyusd_abi";

// Create provider for server-side read-only operations
function getServerProvider() {
  let rpcUrl: string;

  if (CHAIN_ID === 545) {
    // Flow EVM Testnet
    rpcUrl = "https://testnet.evm.nodes.onflow.org";
  } else if (CHAIN_ID === 11155111) {
    // Sepolia testnet
    const alchemyApiKey = process.env.ALCHEMY_API_KEY;
    if (!alchemyApiKey) {
      throw new Error("ALCHEMY_API_KEY environment variable is required for Sepolia");
    }
    rpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`;
  } else {
    throw new Error(`Unsupported chain ID: ${CHAIN_ID}`);
  }

  return new ethers.JsonRpcProvider(rpcUrl);
}

// Create Deal Master contract instance using Web3Auth provider
export function getDealMasterContract(web3AuthProvider: any) {
  if (!web3AuthProvider) {
    throw new Error("Web3Auth provider is required for contract interactions");
  }

  const provider = new ethers.BrowserProvider(web3AuthProvider);
  return new ethers.Contract(DEAL_MASTER_ADDRESS, dealMasterAbi, provider);
}

// Create Deal Master contract instance with signer using Web3Auth provider
export async function getDealMasterContractWithSigner(web3AuthProvider: any) {
  if (!web3AuthProvider) {
    throw new Error("Web3Auth provider is required for contract interactions");
  }

  const provider = new ethers.BrowserProvider(web3AuthProvider);
  const signer = await provider.getSigner();
  return new ethers.Contract(DEAL_MASTER_ADDRESS, dealMasterAbi, signer);
}

// Create PYUSD contract instance using Web3Auth provider
export function getPYUSDContract(web3AuthProvider: any) {
  if (!web3AuthProvider) {
    throw new Error("Web3Auth provider is required for contract interactions");
  }

  const provider = new ethers.BrowserProvider(web3AuthProvider);
  return new ethers.Contract(USD_ADDRESS, pyusd_abi, provider);
}

// Create PYUSD contract instance with signer using Web3Auth provider
export async function getPYUSDContractWithSigner(web3AuthProvider: any) {
  if (!web3AuthProvider) {
    throw new Error("Web3Auth provider is required for contract interactions");
  }

  const provider = new ethers.BrowserProvider(web3AuthProvider);
  const signer = await provider.getSigner();
  return new ethers.Contract(USD_ADDRESS, pyusd_abi, signer);
}

// Server-side contract functions (read-only)
export function getServerDealMasterContract() {
  const provider = getServerProvider();
  return new ethers.Contract(DEAL_MASTER_ADDRESS, dealMasterAbi, provider);
}

export function getServerPYUSDContract() {
  const provider = getServerProvider();
  return new ethers.Contract(USD_ADDRESS, pyusd_abi, provider);
}

// Smart contract constants
export const CONTRACT_CONSTANTS = {
  ENTRY_FEE: "5000000", // 5e6 PYUSD (6 decimals) = $5
  TOTAL_PRIZE_POOL: "165000000", // 165e6 PYUSD = $165
  BOX_VALUES: [
    "1000000",   // $1
    "2000000",   // $2
    "4000000",   // $4
    "8000000",   // $8
    "15000000",  // $15
    "22000000",  // $22
    "38000000",  // $38
    "75000000"   // $75
  ],
  BOX_COUNT: 8
};

// Convert PYUSD wei to cents (6 decimals)
export function pyusdWeiToCents(weiAmount: string | bigint): number {
  const wei = typeof weiAmount === 'string' ? BigInt(weiAmount) : weiAmount;
  // PYUSD has 6 decimals, so divide by 1e6 to get dollars, then multiply by 100 for cents
  return Number(wei / BigInt(10000)); // 1e6 / 100 = 1e4
}

// Convert cents to PYUSD wei (6 decimals)
export function centsToPyusdWei(cents: number): string {
  // Convert cents to PYUSD wei (6 decimals)
  return (BigInt(cents) * BigInt(10000)).toString(); // cents * 1e4 = wei
}

// Game state interface matching smart contract
export interface ContractGameState {
  player: string;
  selectedBoxIndex: number;
  burnedBoxes: boolean[];
  round: number;
  gameActive: boolean;
  lastBankerOffer: string; // in PYUSD wei
}

// Get game state from smart contract (client-side with Web3Auth)
export async function getContractGameState(gameId: number, web3AuthProvider: any): Promise<ContractGameState | null> {
  try {
    console.log(`🔍 Fetching contract game state for game ${gameId}...`);

    const contract = getDealMasterContract(web3AuthProvider);
    const gameState = await contract.getGameState(gameId);

    const [player, selectedBox, burnedBoxes, round, active, lastOffer] = gameState;

    console.log(`✅ Contract game state fetched:`, {
      player,
      selectedBox: selectedBox.toString(),
      burnedBoxes,
      round: round.toString(),
      active,
      lastOffer: lastOffer.toString()
    });

    return {
      player,
      selectedBoxIndex: Number(selectedBox),
      burnedBoxes,
      round: Number(round),
      gameActive: active,
      lastBankerOffer: lastOffer.toString()
    };
  } catch (error) {
    console.error(`❌ Error fetching contract game state for game ${gameId}:`, error);
    return null;
  }
}

// Get game state from smart contract (server-side)
export async function getServerContractGameState(gameId: number): Promise<ContractGameState | null> {
  try {
    console.log(`🔍 Fetching contract game state for game ${gameId} (server-side)...`);

    const contract = getServerDealMasterContract();
    const gameState = await contract.getGameState(gameId);

    const [player, selectedBox, burnedBoxes, round, active, lastOffer] = gameState;

    console.log(`✅ Contract game state fetched:`, {
      player,
      selectedBox: selectedBox.toString(),
      burnedBoxes,
      round: round.toString(),
      active,
      lastOffer: lastOffer.toString()
    });

    return {
      player,
      selectedBoxIndex: Number(selectedBox),
      burnedBoxes,
      round: Number(round),
      gameActive: active,
      lastBankerOffer: lastOffer.toString()
    };
  } catch (error) {
    console.error(`❌ Error fetching contract game state for game ${gameId}:`, error);
    return null;
  }
}

// Get remaining boxes from smart contract
export async function getRemainingBoxes(gameId: number, web3AuthProvider: any): Promise<number[]> {
  try {
    console.log(`🔍 Fetching remaining boxes for game ${gameId}...`);

    const contract = getDealMasterContract(web3AuthProvider);
    const remainingBoxes = await contract.getRemainingBoxes(gameId);

    const boxes = remainingBoxes.map((box: any) => Number(box));
    console.log(`✅ Remaining boxes:`, boxes);

    return boxes;
  } catch (error) {
    console.error(`❌ Error fetching remaining boxes for game ${gameId}:`, error);
    return [];
  }
}

// Get next game ID from smart contract
export async function getNextGameId(web3AuthProvider: any): Promise<number> {
  try {
    const contract = getDealMasterContract(web3AuthProvider);
    const nextId = await contract.nextGameId();
    return Number(nextId);
  } catch (error) {
    console.error("❌ Error fetching next game ID:", error);
    return 0;
  }
}

// Verify a transaction is a successful game start (client-side with Web3Auth)
export async function verifyGameStartTransaction(
  txHash: string,
  expectedPlayer: string,
  web3AuthProvider: any
): Promise<{ success: boolean; gameId?: number; error?: string }> {
  try {
    console.log(`🔍 Verifying game start transaction: ${txHash}`);

    const provider = new ethers.BrowserProvider(web3AuthProvider);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt || receipt.status !== 1) {
      return {
        success: false,
        error: `Transaction failed or not found. Status: ${receipt?.status}`
      };
    }

    const contract = getDealMasterContract(web3AuthProvider);

    // Parse transaction logs for GameStarted event
    for (const log of receipt.logs) {
      try {
        if (log.address.toLowerCase() !== DEAL_MASTER_ADDRESS.toLowerCase()) {
          continue;
        }

        const parsedLog = contract.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });

        if (parsedLog && parsedLog.name === "GameStarted") {
          const gameId = Number(parsedLog.args.gameId);
          const player = parsedLog.args.player.toLowerCase();

          console.log(`🎮 Found GameStarted event: gameId=${gameId}, player=${player}`);

          if (player === expectedPlayer.toLowerCase()) {
            console.log("✅ Game start verification successful!");
            return {
              success: true,
              gameId
            };
          } else {
            return {
              success: false,
              error: `Player mismatch. Expected: ${expectedPlayer}, Found: ${player}`
            };
          }
        }
      } catch (parseError) {
        continue;
      }
    }

    return {
      success: false,
      error: "No GameStarted event found in transaction"
    };
  } catch (error: any) {
    console.error("❌ Error verifying game start transaction:", error);
    return {
      success: false,
      error: error.message || "Failed to verify transaction"
    };
  }
}

// Verify a transaction is a successful game start (server-side)
export async function verifyServerGameStartTransaction(
  txHash: string,
  expectedPlayer: string
): Promise<{ success: boolean; gameId?: number; error?: string }> {
  try {
    console.log(`🔍 Verifying game start transaction: ${txHash} (server-side)`);

    const provider = getServerProvider();
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt || receipt.status !== 1) {
      return {
        success: false,
        error: `Transaction failed or not found. Status: ${receipt?.status}`
      };
    }

    const contract = getServerDealMasterContract();

    // Parse transaction logs for GameStarted event
    for (const log of receipt.logs) {
      try {
        if (log.address.toLowerCase() !== DEAL_MASTER_ADDRESS.toLowerCase()) {
          continue;
        }

        const parsedLog = contract.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });

        if (parsedLog && parsedLog.name === "GameStarted") {
          const gameId = Number(parsedLog.args.gameId);
          const player = parsedLog.args.player.toLowerCase();

          console.log(`🎮 Found GameStarted event: gameId=${gameId}, player=${player}`);

          if (player === expectedPlayer.toLowerCase()) {
            console.log("✅ Game start verification successful!");
            return {
              success: true,
              gameId
            };
          } else {
            return {
              success: false,
              error: `Player mismatch. Expected: ${expectedPlayer}, Found: ${player}`
            };
          }
        }
      } catch (parseError) {
        continue;
      }
    }

    return {
      success: false,
      error: "No GameStarted event found in transaction"
    };
  } catch (error: any) {
    console.error("❌ Error verifying game start transaction:", error);
    return {
      success: false,
      error: error.message || "Failed to verify transaction"
    };
  }
}

// Check if user has approved PYUSD spending for the contract
export async function checkPYUSDApproval(userAddress: string, web3AuthProvider: any): Promise<{
  approved: boolean;
  currentAllowance: string;
  requiredAllowance: string;
}> {
  try {
    const pyusdContract = getPYUSDContract(web3AuthProvider);
    const allowance = await pyusdContract.allowance(userAddress, DEAL_MASTER_ADDRESS);
    const required = BigInt(CONTRACT_CONSTANTS.ENTRY_FEE);

    return {
      approved: allowance >= required,
      currentAllowance: allowance.toString(),
      requiredAllowance: required.toString()
    };
  } catch (error) {
    console.error("❌ Error checking PYUSD approval:", error);
    return {
      approved: false,
      currentAllowance: "0",
      requiredAllowance: CONTRACT_CONSTANTS.ENTRY_FEE
    };
  }
}

// Get box values from smart contract
export async function getBoxValues(web3AuthProvider: any): Promise<string[]> {
  try {
    const contract = getDealMasterContract(web3AuthProvider);
    const values: string[] = [];

    for (let i = 0; i < CONTRACT_CONSTANTS.BOX_COUNT; i++) {
      const value = await contract.BOX_VALUES(i);
      values.push(value.toString());
    }

    return values;
  } catch (error) {
    console.error("❌ Error fetching box values:", error);
    return CONTRACT_CONSTANTS.BOX_VALUES;
  }
}

// Calculate banker offer based on remaining boxes (simplified algorithm)
export function calculateBankerOffer(
  remainingBoxes: number[],
  round: number,
  gameId: number
): string {
  try {
    if (remainingBoxes.length === 0) return "0";

    // Get values of remaining boxes
    const remainingValues = remainingBoxes.map(boxIndex =>
      BigInt(CONTRACT_CONSTANTS.BOX_VALUES[boxIndex])
    );

    // Calculate average of remaining values
    const sum = remainingValues.reduce((acc, val) => acc + val, BigInt(0));
    const average = sum / BigInt(remainingValues.length);

    // Apply banker's discount based on round (banker gets more aggressive over time)
    const discountFactors = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3]; // Round 1-7
    const discountFactor = discountFactors[Math.min(round - 1, discountFactors.length - 1)] || 0.3;

    // Add some randomness based on gameId
    const randomSeed = gameId % 100;
    const randomFactor = 0.9 + (randomSeed / 1000); // 0.9 to 0.999

    const offer = average * BigInt(Math.floor(discountFactor * randomFactor * 1000)) / BigInt(1000);

    // Ensure minimum offer of $1
    const minimumOffer = BigInt(CONTRACT_CONSTANTS.BOX_VALUES[0]);
    return (offer > minimumOffer ? offer : minimumOffer).toString();
  } catch (error) {
    console.error("❌ Error calculating banker offer:", error);
    return CONTRACT_CONSTANTS.BOX_VALUES[0]; // Return minimum value as fallback
  }
}
