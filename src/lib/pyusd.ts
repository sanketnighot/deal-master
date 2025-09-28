import { ethers } from "ethers";
import { CHAIN_ID, USD_ADDRESS } from "./config";
import { pyusd_abi } from "./pyusd_abi";

// Create provider for server-side operations
function getProvider() {
  // Use different RPC URLs based on chain ID
  let rpcUrl: string;

  if (CHAIN_ID === 545) {
    // Flow EVM Testnet
    rpcUrl = "https://testnet.evm.nodes.onflow.org";
  } else if (CHAIN_ID === 11155111) {
    // Sepolia testnet
    const alchemyApiKey = process.env.ALCHEMY_API_KEY;
    if (!alchemyApiKey) {
      throw new Error(
        "ALCHEMY_API_KEY environment variable is required for Sepolia"
      );
    }
    rpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`;
  } else {
    throw new Error(`Unsupported chain ID: ${CHAIN_ID}`);
  }

  return new ethers.JsonRpcProvider(rpcUrl);
}

// Create admin wallet for prize distribution
function getAdminWallet() {
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("ADMIN_PRIVATE_KEY environment variable is required");
  }
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}

// Create PYUSD contract instance for admin operations
export function getAdminPYUSDContract() {
  const adminWallet = getAdminWallet();
  return new ethers.Contract(USD_ADDRESS, pyusd_abi, adminWallet);
}

// Create PYUSD contract instance for read-only operations
export function getPYUSDContract() {
  const provider = getProvider();
  return new ethers.Contract(USD_ADDRESS, pyusd_abi, provider);
}

// Check if a transaction hash represents a successful PYUSD transfer
export async function verifyPYUSDTransfer(
  txHash: string,
  fromAddress: string,
  toAddress: string,
  expectedAmountCents: number
): Promise<boolean> {
  try {
    console.log(
      `Verifying PYUSD transfer: ${txHash}, from: ${fromAddress}, to: ${toAddress}, amount: ${expectedAmountCents} cents`
    );

    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt || receipt.status !== 1) {
      console.log(
        `Transaction failed or not found. Status: ${receipt?.status}`
      );
      return false;
    }

    const pyusdContract = getPYUSDContract();

    // Get decimals dynamically from the contract
    let decimals: number;
    try {
      decimals = await pyusdContract.decimals();
      console.log(`PYUSD contract decimals: ${decimals}`);
    } catch (error) {
      console.error(
        "Failed to get decimals from contract, defaulting to 6:",
        error
      );
      decimals = 6; // fallback
    }

    const expectedAmountWei = ethers.parseUnits(
      (expectedAmountCents / 100).toString(),
      decimals
    );

    console.log(
      `Expected amount: ${expectedAmountWei.toString()} wei (${expectedAmountCents} cents)`
    );
    // Parse transaction logs directly from the receipt
    for (const log of receipt.logs) {
      try {
        // Only parse logs from the PYUSD contract
        if (log.address.toLowerCase() !== USD_ADDRESS.toLowerCase()) {
          continue;
        }

        const parsedLog = pyusdContract.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });

        if (parsedLog && parsedLog.name === "Transfer") {
          const transferFrom = parsedLog.args.from.toLowerCase();
          const transferTo = parsedLog.args.to.toLowerCase();
          const transferAmount = parsedLog.args.value;

          console.log(
            `Found Transfer event: from=${transferFrom}, to=${transferTo}, amount=${transferAmount.toString()}`
          );

          // Verify the transfer matches our expectations
          if (
            transferFrom === fromAddress.toLowerCase() &&
            transferTo === toAddress.toLowerCase() &&
            transferAmount.toString() === expectedAmountWei.toString()
          ) {
            console.log("Transfer verification successful!");
            return true;
          } else {
            console.log(`Transfer mismatch:
              From expected: ${fromAddress.toLowerCase()}, actual: ${transferFrom}
              To expected: ${toAddress.toLowerCase()}, actual: ${transferTo}
              Amount expected: ${expectedAmountWei.toString()}, actual: ${transferAmount.toString()}`);
          }
        }
      } catch (parseError) {
        // Ignore logs that can't be parsed (not PYUSD events)
        continue;
      }
    }
    console.log("No matching transfer found in transaction logs");
    return false;
  } catch (error) {
    console.error("Error verifying PYUSD transfer:", error);
    return false;
  }
}

// Distribute prize to user from admin wallet
export async function distributePrize(
  userAddress: string,
  prizeAmountCents: number
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  console.log(
    `🎁 Starting prize distribution: ${prizeAmountCents} cents to ${userAddress}`
  );

  try {
    // Validate inputs
    if (!userAddress || !ethers.isAddress(userAddress)) {
      const error = `Invalid user address: ${userAddress}`;
      console.error("❌ Prize distribution failed:", error);
      return {
        success: false,
        error,
      };
    }

    if (prizeAmountCents <= 0) {
      const error = `Invalid prize amount: ${prizeAmountCents} cents`;
      console.error("❌ Prize distribution failed:", error);
      return {
        success: false,
        error,
      };
    }

    console.log("🔑 Creating admin PYUSD contract instance...");
    const pyusdContract = getAdminPYUSDContract();

    console.log("📊 Getting admin wallet address...");
    const adminWallet = getAdminWallet();
    const adminAddress = await adminWallet.getAddress();
    console.log(`👤 Admin wallet address: ${adminAddress}`);

    // Get decimals dynamically from the contract
    let decimals: number;
    try {
      console.log("🔢 Fetching PYUSD contract decimals...");
      decimals = await pyusdContract.decimals();
      console.log(`✅ PYUSD contract decimals: ${decimals}`);
    } catch (error) {
      console.error(
        "⚠️ Failed to get decimals from contract, defaulting to 6:",
        error
      );
      decimals = 6; // fallback
    }

    const prizeAmountWei = ethers.parseUnits(
      (prizeAmountCents / 100).toString(),
      decimals
    );
    console.log(
      `💰 Prize amount: ${prizeAmountCents} cents = ${prizeAmountWei.toString()} wei`
    );

    // Check admin balance
    console.log("💳 Checking admin wallet PYUSD balance...");
    const adminBalance = await pyusdContract.balanceOf(adminAddress);
    const adminBalanceFormatted = ethers.formatUnits(adminBalance, decimals);
    console.log(
      `💰 Admin PYUSD balance: ${adminBalanceFormatted} PYUSD (${adminBalance.toString()} wei)`
    );

    if (adminBalance < prizeAmountWei) {
      const error = `Insufficient admin wallet balance. Required: ${ethers.formatUnits(prizeAmountWei, decimals)} PYUSD, Available: ${adminBalanceFormatted} PYUSD`;
      console.error("❌ Prize distribution failed:", error);
      return {
        success: false,
        error,
      };
    }

    console.log("✅ Admin has sufficient balance, proceeding with transfer...");

    // Get user's current balance before transfer
    console.log("📊 Checking user's current PYUSD balance...");
    const userBalanceBefore = await pyusdContract.balanceOf(userAddress);
    const userBalanceBeforeFormatted = ethers.formatUnits(
      userBalanceBefore,
      decimals
    );
    console.log(`👤 User balance before: ${userBalanceBeforeFormatted} PYUSD`);

    // Transfer prize to user
    console.log(`🚀 Initiating PYUSD transfer to user: ${userAddress}`);
    const tx = await pyusdContract.transfer(userAddress, prizeAmountWei);
    console.log(`📝 Transaction submitted: ${tx.hash}`);

    console.log("⏳ Waiting for transaction confirmation...");
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    if (receipt.status === 1) {
      // Verify the transfer by checking user's balance after
      console.log("🔍 Verifying transfer by checking user's new balance...");
      const userBalanceAfter = await pyusdContract.balanceOf(userAddress);
      const userBalanceAfterFormatted = ethers.formatUnits(
        userBalanceAfter,
        decimals
      );
      const actualTransfer = userBalanceAfter - userBalanceBefore;
      const actualTransferFormatted = ethers.formatUnits(
        actualTransfer,
        decimals
      );

      console.log(`👤 User balance after: ${userBalanceAfterFormatted} PYUSD`);
      console.log(
        `📈 Actual transfer amount: ${actualTransferFormatted} PYUSD`
      );

      if (actualTransfer.toString() === prizeAmountWei.toString()) {
        console.log("🎉 Prize distribution successful!");
        return {
          success: true,
          txHash: receipt.hash,
        };
      } else {
        const error = `Transfer amount mismatch. Expected: ${ethers.formatUnits(prizeAmountWei, decimals)} PYUSD, Actual: ${actualTransferFormatted} PYUSD`;
        console.error("❌ Prize distribution verification failed:", error);
        return {
          success: false,
          error,
        };
      }
    } else {
      const error = "Transaction failed - receipt status is not 1";
      console.error("❌ Prize distribution failed:", error);
      return {
        success: false,
        error,
      };
    }
  } catch (error: any) {
    console.error("💥 Error distributing prize:", error);

    // Provide more specific error messages
    let errorMessage = error.message || "Failed to distribute prize";

    if (error.code === "INSUFFICIENT_FUNDS") {
      errorMessage = "Admin wallet has insufficient ETH for gas fees";
    } else if (error.code === "NETWORK_ERROR") {
      errorMessage = "Network connection error during prize distribution";
    } else if (error.message?.includes("insufficient funds")) {
      errorMessage = "Admin wallet has insufficient ETH for gas fees";
    } else if (error.message?.includes("nonce")) {
      errorMessage = "Transaction nonce error - please try again";
    } else if (error.message?.includes("gas")) {
      errorMessage = "Gas estimation failed - network may be congested";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Get PYUSD balance for an address
export async function getPYUSDBalance(address: string): Promise<string> {
  try {
    const pyusdContract = getPYUSDContract();

    // Get decimals dynamically from the contract
    let decimals: number;
    try {
      decimals = await pyusdContract.decimals();
    } catch (error) {
      console.error(
        "Failed to get decimals from contract, defaulting to 6:",
        error
      );
      decimals = 6; // fallback
    }

    const balance = await pyusdContract.balanceOf(address);
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error("Error getting PYUSD balance:", error);
    return "0";
  }
}

// Get PYUSD contract decimals (cached for performance)
let cachedDecimals: number | null = null;
export async function getPYUSDDecimals(): Promise<number> {
  if (cachedDecimals !== null) {
    return cachedDecimals;
  }

  try {
    const pyusdContract = getPYUSDContract();
    cachedDecimals = await pyusdContract.decimals();
    return cachedDecimals!;
  } catch (error) {
    console.error(
      "Failed to get decimals from contract, defaulting to 6:",
      error
    );
    cachedDecimals = 6; // fallback
    return cachedDecimals;
  }
}

// Convert cents to wei (uses dynamic decimals)
export async function centsToWei(cents: number): Promise<string> {
  const decimals = await getPYUSDDecimals();
  return ethers.parseUnits((cents / 100).toString(), decimals).toString();
}

// Convert wei to cents (uses dynamic decimals)
export async function weiToCents(wei: string): Promise<number> {
  const decimals = await getPYUSDDecimals();
  const amount = ethers.formatUnits(wei, decimals);
  return Math.round(parseFloat(amount) * 100);
}
