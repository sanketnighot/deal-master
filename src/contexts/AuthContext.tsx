'use client'

import { AuthState, getAuthHeader, getAuthState, loginWithGoogle, loginWithWallet, logout } from '@/lib/web3auth'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface AuthContextType extends AuthState {
  loginWithGoogle: () => Promise<void>
  loginWithWallet: () => Promise<void>
  logout: () => Promise<void>
  getAuthHeader: () => Promise<string | null>
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    idToken: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const state = await getAuthState()
      setAuthState(state)
    } catch (err) {
      console.error('Auth initialization error:', err)
      setError(err instanceof Error ? err.message : 'Authentication initialization failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginWithGoogle = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const state = await loginWithGoogle()
      setAuthState(state)
    } catch (err) {
      console.error('Google login error:', err)
      setError(err instanceof Error ? err.message : 'Google login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginWithWallet = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const state = await loginWithWallet()
      setAuthState(state)
    } catch (err) {
      console.error('Wallet login error:', err)
      setError(err instanceof Error ? err.message : 'Wallet login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await logout()
      setAuthState({
        isAuthenticated: false,
        user: null,
        idToken: null
      })
    } catch (err) {
      console.error('Logout error:', err)
      setError(err instanceof Error ? err.message : 'Logout failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetAuthHeader = async (): Promise<string | null> => {
    try {
      return await getAuthHeader()
    } catch (err) {
      console.error('Get auth header error:', err)
      return null
    }
  }

  const value: AuthContextType = {
    ...authState,
    loginWithGoogle: handleLoginWithGoogle,
    loginWithWallet: handleLoginWithWallet,
    logout: handleLogout,
    getAuthHeader: handleGetAuthHeader,
    isLoading,
    error
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for making authenticated API calls
export function useAuthenticatedFetch() {
  const { getAuthHeader } = useAuth()

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const authHeader = await getAuthHeader()

    if (!authHeader) {
      throw new Error('Not authenticated')
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })
  }

  return { authenticatedFetch }
}
