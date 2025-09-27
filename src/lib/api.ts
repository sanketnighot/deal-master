// API client for game operations
export interface Game {
  id: string;
  user_id: string; // wallet address
  entry_fee_cents: number;
  currency: string;
  created_at: string;
  status: "CREATED" | "PLAYING" | "FINISHED" | "CANCELLED";
  player_case: number | null;
  banker_offer_cents: number | null;
  accepted_deal: boolean;
  final_won_cents: number | null;
  payment_tx_hash: string | null;
  prize_distributed: boolean;
  prize_tx_hash: string | null;
  cards?: Card[];
  moves?: Move[];
}

export interface Card {
  idx: number;
  value_cents: number;
  revealed: boolean;
  burned: boolean;
}

export interface Move {
  action: string;
  payload: any;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Base API URL
const API_BASE = "/api";

// Generic API call function
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  authHeader?: string | null
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      data: data,
      message: data.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Game API functions
export const gameApi = {
  // Create a new game
  async create(
    entryFeeCents: number,
    authHeader: string | null
  ): Promise<ApiResponse<{ game: Game }>> {
    return apiCall(
      "/game/create",
      {
        method: "POST",
        body: JSON.stringify({ entryFeeCents }),
      },
      authHeader
    );
  },

  // Get game state
  async getState(
    gameId: string,
    authHeader?: string | null
  ): Promise<ApiResponse<{ game: Game }>> {
    return apiCall(
      `/game/${gameId}`,
      {
        method: "GET",
      },
      authHeader
    );
  },

  // Get public game state (no auth required)
  async getPublicState(gameId: string): Promise<ApiResponse<{ game: Game }>> {
    return apiCall(`/game/${gameId}/statePublic`, {
      method: "GET",
    });
  },

  // Pick a case
  async pickCase(
    gameId: string,
    idx: number,
    authHeader: string | null
  ): Promise<ApiResponse> {
    return apiCall(
      `/game/${gameId}/pick`,
      {
        method: "POST",
        body: JSON.stringify({ idx }),
      },
      authHeader
    );
  },

  // Burn a case
  async burnCase(
    gameId: string,
    idx: number,
    authHeader: string | null
  ): Promise<
    ApiResponse<{
      burned_case: { idx: number; value_cents: number };
      banker_offer?: { amount_cents: number; amount_display: string };
    }>
  > {
    return apiCall(
      `/game/${gameId}/burn`,
      {
        method: "POST",
        body: JSON.stringify({ idx }),
      },
      authHeader
    );
  },

  // Accept banker's deal
  async acceptDeal(
    gameId: string,
    authHeader: string | null
  ): Promise<
    ApiResponse<{
      final_won_cents: number;
      final_won_display: string;
    }>
  > {
    return apiCall(
      `/game/${gameId}/acceptDeal`,
      {
        method: "POST",
      },
      authHeader
    );
  },

  // Final reveal
  async finalReveal(
    gameId: string,
    swap: boolean,
    authHeader: string | null
  ): Promise<
    ApiResponse<{
      final_won_cents: number;
      final_won_display: string;
      final_case: { idx: number; value_cents: number };
      swap_info?: any;
    }>
  > {
    return apiCall(
      `/game/${gameId}/finalReveal`,
      {
        method: "POST",
        body: JSON.stringify({ swap }),
      },
      authHeader
    );
  },
};

// Hook for using game API with authentication
export function useGameApi() {
  const { authenticatedFetch, isAuthenticated } = useAuth();

  const getGames = async (page: number = 1, limit: number = 10) => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated");
    }
    return authenticatedFetch(`/api/games?page=${page}&limit=${limit}`).then(
      (res) => res.json()
    );
  };

  const createGame = async (
    entryFeeCents: number,
    paymentTxHash?: string,
    userAddress?: string
  ) => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated");
    }
    return authenticatedFetch("/api/game/create", {
      method: "POST",
      body: JSON.stringify({
        entryFeeCents,
        paymentTxHash,
        userAddress,
      }),
    }).then((res) => res.json());
  };

  const getGameState = async (gameId: string) => {
    return authenticatedFetch(`/api/game/${gameId}`).then((res) => res.json());
  };

  const getPublicGameState = async (gameId: string) => {
    return fetch(`/api/game/${gameId}/statePublic`).then((res) => res.json());
  };

  const pickCase = async (gameId: string, idx: number) => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated");
    }
    return authenticatedFetch(`/api/game/${gameId}/pick`, {
      method: "POST",
      body: JSON.stringify({ idx }),
    }).then((res) => res.json());
  };

  const burnCase = async (gameId: string, idx: number) => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated");
    }
    return authenticatedFetch(`/api/game/${gameId}/burn`, {
      method: "POST",
      body: JSON.stringify({ idx }),
    }).then((res) => res.json());
  };

  const acceptDeal = async (gameId: string) => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated");
    }
    return authenticatedFetch(`/api/game/${gameId}/acceptDeal`, {
      method: "POST",
    }).then((res) => res.json());
  };

  const finalReveal = async (gameId: string, swap: boolean) => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated");
    }
    return authenticatedFetch(`/api/game/${gameId}/finalReveal`, {
      method: "POST",
      body: JSON.stringify({ swap }),
    }).then((res) => res.json());
  };

  const distributePrize = async (gameId: string, prizeAmountCents: number) => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated");
    }
    return authenticatedFetch(`/api/game/${gameId}/distributePrize`, {
      method: "POST",
      body: JSON.stringify({ prizeAmountCents }),
    }).then((res) => res.json());
  };

  return {
    getGames,
    createGame,
    getGameState,
    getPublicGameState,
    pickCase,
    burnCase,
    acceptDeal,
    finalReveal,
    distributePrize,
  };
}

// Import useAuth from AuthContext
import { useAuth } from "@/contexts/AuthContext";

