// API client for game operations
export interface Game {
  id: string
  user_id: string
  entry_fee_cents: number
  currency: string
  created_at: string
  status: 'CREATED' | 'PLAYING' | 'FINISHED' | 'CANCELLED'
  player_case: number | null
  banker_offer_cents: number | null
  accepted_deal: boolean
  final_won_cents: number | null
  cards?: Card[]
  moves?: Move[]
}

export interface Card {
  idx: number
  value_cents: number
  revealed: boolean
  burned: boolean
}

export interface Move {
  action: string
  payload: any
  created_at: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Base API URL
const API_BASE = '/api'

// Generic API call function
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  authHeader?: string | null
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE}${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      }
    }

    return {
      success: true,
      data: data,
      message: data.message,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

// Game API functions
export const gameApi = {
  // Create a new game
  async create(entryFeeCents: number, authHeader: string | null): Promise<ApiResponse<{ game: Game }>> {
    return apiCall('/game/create', {
      method: 'POST',
      body: JSON.stringify({ entryFeeCents }),
    }, authHeader)
  },

  // Get game state
  async getState(gameId: string, authHeader?: string | null): Promise<ApiResponse<{ game: Game }>> {
    return apiCall(`/game/${gameId}`, {
      method: 'GET',
    }, authHeader)
  },

  // Get public game state (no auth required)
  async getPublicState(gameId: string): Promise<ApiResponse<{ game: Game }>> {
    return apiCall(`/game/${gameId}/statePublic`, {
      method: 'GET',
    })
  },

  // Pick a case
  async pickCase(gameId: string, idx: number, authHeader: string | null): Promise<ApiResponse> {
    return apiCall(`/game/${gameId}/pick`, {
      method: 'POST',
      body: JSON.stringify({ idx }),
    }, authHeader)
  },

  // Burn a case
  async burnCase(gameId: string, idx: number, authHeader: string | null): Promise<ApiResponse<{
    burned_case: { idx: number; value_cents: number }
    banker_offer?: { amount_cents: number; amount_display: string }
  }>> {
    return apiCall(`/game/${gameId}/burn`, {
      method: 'POST',
      body: JSON.stringify({ idx }),
    }, authHeader)
  },

  // Accept banker's deal
  async acceptDeal(gameId: string, authHeader: string | null): Promise<ApiResponse<{
    final_won_cents: number
    final_won_display: string
  }>> {
    return apiCall(`/game/${gameId}/acceptDeal`, {
      method: 'POST',
    }, authHeader)
  },

  // Final reveal
  async finalReveal(gameId: string, swap: boolean, authHeader: string | null): Promise<ApiResponse<{
    final_won_cents: number
    final_won_display: string
    final_case: { idx: number; value_cents: number }
    swap_info?: any
  }>> {
    return apiCall(`/game/${gameId}/finalReveal`, {
      method: 'POST',
      body: JSON.stringify({ swap }),
    }, authHeader)
  },
}

// Hook for using game API with authentication
export function useGameApi() {
  const { getAuthHeader, isAuthenticated } = useAuth()

  const createGame = async (entryFeeCents: number) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated')
    }
    const authHeader = await getAuthHeader()
    return gameApi.create(entryFeeCents, authHeader)
  }

  const getGameState = async (gameId: string) => {
    const authHeader = await getAuthHeader()
    return gameApi.getState(gameId, authHeader)
  }

  const getPublicGameState = async (gameId: string) => {
    return gameApi.getPublicState(gameId)
  }

  const pickCase = async (gameId: string, idx: number) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated')
    }
    const authHeader = await getAuthHeader()
    return gameApi.pickCase(gameId, idx, authHeader)
  }

  const burnCase = async (gameId: string, idx: number) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated')
    }
    const authHeader = await getAuthHeader()
    return gameApi.burnCase(gameId, idx, authHeader)
  }

  const acceptDeal = async (gameId: string) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated')
    }
    const authHeader = await getAuthHeader()
    return gameApi.acceptDeal(gameId, authHeader)
  }

  const finalReveal = async (gameId: string, swap: boolean) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated')
    }
    const authHeader = await getAuthHeader()
    return gameApi.finalReveal(gameId, swap, authHeader)
  }

  return {
    createGame,
    getGameState,
    getPublicGameState,
    pickCase,
    burnCase,
    acceptDeal,
    finalReveal,
  }
}

// Import useAuth from AuthContext
import { useAuth } from '@/contexts/AuthContext'
