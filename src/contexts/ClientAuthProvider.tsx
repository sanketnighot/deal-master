'use client'

import {
  useWeb3Auth,
  useWeb3AuthConnect,
  useWeb3AuthDisconnect,
  useWeb3AuthUser,
} from "@web3auth/modal/react";
import { ethers } from "ethers";
import { ReactNode, useEffect, useState } from "react";

// Import the context and types from the main AuthContext file
import { AuthContext } from "./AuthContext";

// Function to convert public key to Ethereum address
async function convertPublicKeyToAddress(publicKey: string): Promise<string> {
  try {
    if (!publicKey) {
      throw new Error("Public key is empty or undefined");
    }

    // Remove the 04 prefix if present (uncompressed public key)
    let cleanKey = publicKey.startsWith("04") ? publicKey.slice(2) : publicKey;

    // Ensure the key has the 0x prefix for ethers.computeAddress
    if (!cleanKey.startsWith("0x")) {
      cleanKey = "0x" + cleanKey;
    }

    // Create a public key object and compute the address
    const address = ethers.computeAddress(cleanKey);
    return address;
  } catch (error) {
    console.error(
      "Failed to convert public key to address:",
      error,
      "Public key:",
      publicKey
    );
    return publicKey; // Return original if conversion fails
  }
}

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  // Always call hooks, but conditionally use their values
  const web3AuthConnect = useWeb3AuthConnect();
  const web3AuthDisconnect = useWeb3AuthDisconnect();
  const web3AuthUser = useWeb3AuthUser();
  const { web3Auth } = useWeb3Auth();

  const {
    connect: web3AuthConnectFn,
    isConnected,
    loading: connectLoading,
    error: connectError,
  } = web3AuthConnect;

  const {
    disconnect: web3AuthDisconnectFn,
    loading: disconnectLoading,
    error: disconnectError,
  } = web3AuthDisconnect;

  const { userInfo } = web3AuthUser;

  const [userId, setUserId] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Extract user information
  useEffect(() => {
    const extractUserInfo = async () => {
      if (isConnected && userInfo) {
        // Extract user ID (email for social login, wallet address for wallet login)
        const id =
          (userInfo as any).verifierId || (userInfo as any).userId || "unknown";

        // Extract wallet address from the JWT token or provider
        let address = null;

        // First, try to get address from Web3Auth provider (for MetaMask connections)
        try {
          const provider = web3Auth?.provider;
          if (provider) {
            const ethersProvider = new ethers.BrowserProvider(provider);
            const signer = await ethersProvider.getSigner();
            address = await signer.getAddress();
          }
        } catch (error) {
          console.error("Could not get address from provider:", error);
        }

        // If no address from provider, try JWT token (for social logins)
        if (!address) {
          const idToken = (userInfo as any).idToken;
          if (idToken) {
            try {
              // Decode JWT token (without verification since we're just extracting info)
              const payload = JSON.parse(atob(idToken.split(".")[1]));

              // Extract wallet address from JWT payload
              if (payload.wallets && payload.wallets.length > 0) {
                // Find the first secp256k1 wallet (Ethereum-compatible)
                const ethWallet = payload.wallets.find(
                  (w: any) => w.curve === "secp256k1"
                );
                if (ethWallet) {
                  // Convert public key to Ethereum address
                  address = await convertPublicKeyToAddress(
                    ethWallet.public_key
                  );
                } else {
                  // Fallback to first wallet
                  const firstWallet = payload.wallets[0];
                  if (firstWallet && firstWallet.public_key) {
                    address = await convertPublicKeyToAddress(
                      firstWallet.public_key
                    );
                  }
                }
              }
            } catch (error) {
              console.error("Failed to decode JWT token:", error);
            }
          }
        }

        setUserId(id);
        setWalletAddress(address);
      } else {
        console.error("Not connected or no userInfo available");
        setUserId(null);
        setWalletAddress(null);
      }
    };

    extractUserInfo();
  }, [isConnected, userInfo, web3Auth]);

  const connect = async () => {
    try {
      const result = await web3AuthConnectFn();
      return result;
    } catch (error) {
      console.error("Web3Auth: Connection error:", error);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      await web3AuthDisconnectFn();
      setUserId(null);
      setWalletAddress(null);
    } catch (error) {
      console.error("Web3Auth: Disconnection error:", error);
      throw error;
    }
  };

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    if (!isConnected || !userInfo) {
      throw new Error("Not authenticated");
    }

    // Try to get the ID token from Web3Auth
    const idToken = (userInfo as any).idToken;

    let authToken = null;

    if (idToken) {
      // Use JWT token for social login
      authToken = idToken;
    } else {
      // For external wallet connections, use wallet address directly
      if (walletAddress) {
        // Create a simple wallet-based auth token
        // This works for external wallet connections where we don't get a JWT
        authToken = `simple-wallet:${walletAddress}`;
      } else {
        console.error("No wallet address available for authentication");
      }
    }

    if (!authToken) {
      throw new Error("No authentication token available");
    }

    const headers = {
      ...options.headers,
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    };

    return fetch(url, { ...options, headers });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isConnected,
        user: userInfo,
        connect,
        disconnect,
        isLoading: connectLoading || disconnectLoading,
        connectLoading,
        disconnectLoading,
        connectError,
        disconnectError,
        userId,
        walletAddress,
        authenticatedFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
