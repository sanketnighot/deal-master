import { ethers } from 'ethers';
import { pyusd_abi } from './abi';
import { ADMIN_ADDRESS, PYUSD_ADDRESS } from './config';

// Create provider for server-side operations
function getProvider() {
  const alchemyApiKey = process.env.ALCHEMY_API_KEY;
  if (!alchemyApiKey) {
    throw new Error('ALCHEMY_API_KEY environment variable is required');
  }
  const rpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`;
  return new ethers.JsonRpcProvider(rpcUrl);
}

// Create admin wallet for prize distribution
function getAdminWallet() {
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('ADMIN_PRIVATE_KEY environment variable is required');
  }
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}

// Create PYUSD contract instance for admin operations
export function getAdminPYUSDContract() {
  const adminWallet = getAdminWallet();
  return new ethers.Contract(PYUSD_ADDRESS, pyusd_abi, adminWallet);
}

// Create PYUSD contract instance for read-only operations
export function getPYUSDContract() {
  const provider = getProvider();
  return new ethers.Contract(PYUSD_ADDRESS, pyusd_abi, provider);
}

// Check if a transaction hash represents a successful PYUSD transfer
export async function verifyPYUSDTransfer(
  txHash: string,
  fromAddress: string,
  toAddress: string,
  expectedAmountCents: number
): Promise<boolean> {
  try {
    console.log('Verifying PYUSD transfer:', {
      txHash,
      fromAddress: fromAddress.toLowerCase(),
      toAddress: toAddress.toLowerCase(),
      expectedAmountCents
    });

    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt || receipt.status !== 1) {
      console.log('Transaction receipt not found or failed:', receipt?.status);
      return false;
    }

    console.log('Transaction successful, checking logs...');

    const pyusdContract = getPYUSDContract();
    const expectedAmountWei = ethers.parseUnits((expectedAmountCents / 100).toString(), 6);

    console.log('Expected amount in wei:', expectedAmountWei.toString());

    // Parse transaction logs directly from the receipt
    for (const log of receipt.logs) {
      try {
        // Only parse logs from the PYUSD contract
        if (log.address.toLowerCase() !== PYUSD_ADDRESS.toLowerCase()) {
          continue;
        }

        const parsedLog = pyusdContract.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });

        if (parsedLog && parsedLog.name === 'Transfer') {
          const transferFrom = parsedLog.args.from.toLowerCase();
          const transferTo = parsedLog.args.to.toLowerCase();
          const transferAmount = parsedLog.args.value;

          console.log('Found Transfer event:', {
            from: transferFrom,
            to: transferTo,
            amount: transferAmount.toString()
          });

          // Verify the transfer matches our expectations
          if (
            transferFrom === fromAddress.toLowerCase() &&
            transferTo === toAddress.toLowerCase() &&
            transferAmount.toString() === expectedAmountWei.toString()
          ) {
            console.log('Transfer verification successful!');
            return true;
          }
        }
      } catch (parseError) {
        // Ignore logs that can't be parsed (not PYUSD events)
        continue;
      }
    }

    console.log('No matching transfer found in transaction logs');
    return false;
  } catch (error) {
    console.error('Error verifying PYUSD transfer:', error);
    return false;
  }
}

// Distribute prize to user from admin wallet
export async function distributePrize(
  userAddress: string,
  prizeAmountCents: number
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const pyusdContract = getAdminPYUSDContract();
    const prizeAmountWei = ethers.parseUnits((prizeAmountCents / 100).toString(), 6);

    // Check admin balance
    const adminBalance = await pyusdContract.balanceOf(ADMIN_ADDRESS);
    if (adminBalance < prizeAmountWei) {
      return {
        success: false,
        error: 'Insufficient admin wallet balance for prize distribution',
      };
    }

    // Transfer prize to user
    const tx = await pyusdContract.transfer(userAddress, prizeAmountWei);
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      return {
        success: true,
        txHash: receipt.hash,
      };
    } else {
      return {
        success: false,
        error: 'Transaction failed',
      };
    }
  } catch (error: any) {
    console.error('Error distributing prize:', error);
    return {
      success: false,
      error: error.message || 'Failed to distribute prize',
    };
  }
}

// Get PYUSD balance for an address
export async function getPYUSDBalance(address: string): Promise<string> {
  try {
    const pyusdContract = getPYUSDContract();
    const balance = await pyusdContract.balanceOf(address);
    return ethers.formatUnits(balance, 6);
  } catch (error) {
    console.error('Error getting PYUSD balance:', error);
    return '0';
  }
}

// Convert cents to wei (PYUSD has 6 decimals)
export function centsToWei(cents: number): string {
  return ethers.parseUnits((cents / 100).toString(), 6).toString();
}

// Convert wei to cents (PYUSD has 6 decimals)
export function weiToCents(wei: string): number {
  const amount = ethers.formatUnits(wei, 6);
  return Math.round(parseFloat(amount) * 100);
}
