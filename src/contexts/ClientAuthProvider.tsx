'use client'

import {
  useWeb3AuthConnect,
  useWeb3AuthDisconnect,
  useWeb3AuthUser,
} from "@web3auth/modal/react";
import {
  ReactNode,
  useEffect,
  useState,
} from "react";

// Import the context and types from the main AuthContext file
import { AuthContext } from './AuthContext';

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  // Always call hooks, but conditionally use their values
  const web3AuthConnect = useWeb3AuthConnect();
  const web3AuthDisconnect = useWeb3AuthDisconnect();
  const web3AuthUser = useWeb3AuthUser();

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
    if (isConnected && userInfo) {
      // Debug: Log the userInfo structure
      // console.log('Web3Auth userInfo:', JSON.stringify(userInfo, null, 2));

      const id =
        (userInfo as any).verifierId || (userInfo as any).verifier || "unknown";
      const address =
        (userInfo as any).verifierId || (userInfo as any).publicAddress || null;

      setUserId(id);
      setWalletAddress(address);
    } else {
      setUserId(null);
      setWalletAddress(null);
    }
  }, [isConnected, userInfo]);

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

    // Get the ID token from Web3Auth
    const idToken = (userInfo as any).idToken;
    if (!idToken) {
      throw new Error("No ID token available");
    }

    const headers = {
      ...options.headers,
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`,
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
