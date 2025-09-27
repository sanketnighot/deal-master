import { createRemoteJWKSet, jwtVerify } from 'jose'

const WEB3AUTH_ISSUER = process.env.WEB3AUTH_ISSUER || 'https://api-auth.web3auth.io'

// Cache for JWKS to avoid repeated network calls
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null
let jwksCacheExpiry = 0
const JWKS_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getJWKS() {
  const now = Date.now()

  if (!jwksCache || now > jwksCacheExpiry) {
    jwksCache = createRemoteJWKSet(new URL(`${WEB3AUTH_ISSUER}/.well-known/jwks.json`))
    jwksCacheExpiry = now + JWKS_CACHE_DURATION
  }

  return jwksCache
}

export interface Web3AuthTokenPayload {
  sub?: string;
  verifierId?: string;
  userId?: string;
  email?: string;
  name?: string;
  wallet_address?: string;
  public_address?: string;
  wallets?: Array<{
    public_key: string;
    type: string;
    curve: string;
  }>;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
}

export interface Web3AuthVerificationResult {
  valid: boolean
  user_id: string
  email?: string
  wallet_address?: string
  error?: string
}

/**
 * Verify a Web3Auth JWT token and extract user information
 * @param token - The JWT token from Web3Auth
 * @returns Verification result with user information
 */
export async function verifyWeb3AuthToken(
  token: string
): Promise<Web3AuthVerificationResult> {
  try {
    if (!token) {
      return {
        valid: false,
        user_id: "",
        error: "No token provided",
      };
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, "");

    const jwks = getJWKS();

    const { payload } = await jwtVerify(cleanToken, jwks, {
      issuer: WEB3AUTH_ISSUER,
      audience: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID,
    });

    const web3AuthPayload = payload as Web3AuthTokenPayload;

    // Extract user identifier - use wallet address from wallets array
    let user_id =
      web3AuthPayload.wallet_address || web3AuthPayload.public_address;

    // If no direct wallet address, extract from wallets array and convert to address
    if (
      !user_id &&
      web3AuthPayload.wallets &&
      web3AuthPayload.wallets.length > 0
    ) {
      // Use the first secp256k1 wallet address (Ethereum-compatible)
      const ethWallet = web3AuthPayload.wallets.find(
        (w) => w.curve === "secp256k1"
      );
      if (ethWallet) {
        // Convert public key to Ethereum address
        try {
          const { ethers } = await import("ethers");
          let cleanKey = ethWallet.public_key.startsWith("04")
            ? ethWallet.public_key.slice(2)
            : ethWallet.public_key;
          if (!cleanKey.startsWith("0x")) {
            cleanKey = "0x" + cleanKey;
          }
          user_id = ethers.computeAddress(cleanKey).toLowerCase();
        } catch (error) {
          console.error("Failed to convert public key to address:", error);
          user_id = ethWallet.public_key;
        }
      } else {
        // Fallback to first wallet
        const firstWallet = web3AuthPayload.wallets[0];
        try {
          const { ethers } = await import("ethers");
          let cleanKey = firstWallet.public_key.startsWith("04")
            ? firstWallet.public_key.slice(2)
            : firstWallet.public_key;
          if (!cleanKey.startsWith("0x")) {
            cleanKey = "0x" + cleanKey;
          }
          user_id = ethers.computeAddress(cleanKey).toLowerCase();
        } catch (error) {
          console.error("Failed to convert public key to address:", error);
          user_id = firstWallet.public_key;
        }
      }
    }

    // Ensure user_id is lowercase for consistency
    if (user_id && user_id.startsWith("0x")) {
      user_id = user_id.toLowerCase();
    }

    // Final fallback to verifierId
    if (!user_id) {
      user_id =
        web3AuthPayload.verifierId || web3AuthPayload.userId || "unknown";
    }

    return {
      valid: true,
      user_id,
      email: web3AuthPayload.email,
      wallet_address:
        web3AuthPayload.wallet_address || web3AuthPayload.public_address,
    };
  } catch (error) {
    console.error("Web3Auth token verification failed:", error);

    return {
      valid: false,
      user_id: "",
      error:
        error instanceof Error ? error.message : "Token verification failed",
    };
  }
}

/**
 * Verify wallet signature authentication
 * @param walletToken - Format: wallet:address:timestamp:signature
 * @returns Verification result
 */
export async function verifyWalletSignature(
  walletToken: string
): Promise<Web3AuthVerificationResult> {
  try {
    const parts = walletToken.split(":");
    if (parts.length !== 4 || parts[0] !== "wallet") {
      return {
        valid: false,
        user_id: "",
        error: "Invalid wallet token format",
      };
    }

    const [, address, timestamp, signature] = parts;

    // Check if timestamp is recent (within 10 minutes)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    if (now - tokenTime > maxAge) {
      return {
        valid: false,
        user_id: "",
        error: "Wallet signature expired",
      };
    }

    // Verify the signature
    const message = `Deal Master Authentication\nAddress: ${address}\nTimestamp: ${timestamp}`;

    try {
      const { ethers } = await import("ethers");
      const recoveredAddress = ethers.verifyMessage(message, signature);

      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        return {
          valid: false,
          user_id: "",
          error: "Invalid wallet signature",
        };
      }

      return {
        valid: true,
        user_id: address.toLowerCase(),
        wallet_address: address.toLowerCase(),
      };
    } catch (error) {
      console.error("Signature verification failed:", error);
      return {
        valid: false,
        user_id: "",
        error: "Signature verification failed",
      };
    }
  } catch (error) {
    console.error("Wallet token verification failed:", error);
    return {
      valid: false,
      user_id: "",
      error: "Wallet token verification failed",
    };
  }
}

/**
 * Middleware helper to extract and verify Web3Auth token from request headers
 * @param authHeader - Authorization header value
 * @returns Verification result
 */
export async function verifyAuthHeader(
  authHeader: string | null
): Promise<Web3AuthVerificationResult> {
  if (!authHeader) {
    return {
      valid: false,
      user_id: "",
      error: "No authorization header",
    };
  }

  // Remove 'Bearer ' prefix if present
  const cleanToken = authHeader.replace(/^Bearer\s+/i, "");

  // Check if it's a wallet signature token
  if (cleanToken.startsWith("wallet:")) {
    return verifyWalletSignature(cleanToken);
  }

  // Check if it's a simple wallet token
  if (cleanToken.startsWith("simple-wallet:")) {
    const walletAddress = cleanToken.replace("simple-wallet:", "");

    // Basic validation of wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return {
        valid: false,
        user_id: "",
        error: "Invalid wallet address format",
      };
    }

    return {
      valid: true,
      user_id: walletAddress.toLowerCase(),
      wallet_address: walletAddress.toLowerCase(),
    };
  }

  // Otherwise, treat it as a JWT token
  return verifyWeb3AuthToken(authHeader);
}

/**
 * Helper to get user ID from request headers (for API routes)
 * @param request - Next.js request object
 * @returns User ID if valid, null otherwise
 */
export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  const result = await verifyAuthHeader(authHeader)

  return result.valid ? result.user_id : null
}
