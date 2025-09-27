'use client'

import { AuthUserInfo } from "@web3auth/modal";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export interface AuthContextType {
  isAuthenticated: boolean;
  user: Partial<AuthUserInfo> | null;
  connect: () => Promise<unknown>;
  disconnect: () => Promise<void>;
  isLoading: boolean;
  connectLoading: boolean;
  disconnectLoading: boolean;
  connectError: Error | null;
  disconnectError: Error | null;
  userId: string | null;
  walletAddress: string | null;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default values for SSR
  const defaultContext: AuthContextType = {
    isAuthenticated: false,
    user: null,
    connect: async () => {},
    disconnect: async () => {},
    isLoading: false,
    connectLoading: false,
    disconnectLoading: false,
    connectError: null,
    disconnectError: null,
    userId: null,
    walletAddress: null,
    authenticatedFetch: async () => {
      throw new Error("Not authenticated");
    },
  };

  if (!mounted) {
    return (
      <AuthContext.Provider value={defaultContext}>
        {children}
      </AuthContext.Provider>
    );
  }

  // Import and use the client-side provider only after mounting
  const { ClientAuthProvider } = require("./ClientAuthProvider");
  return <ClientAuthProvider>{children}</ClientAuthProvider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useAuthenticatedFetch() {
  const { authenticatedFetch } = useAuth();
  return { authenticatedFetch };
}
