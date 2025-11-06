import { apiClient } from "./api"

import type { GameSession, GameSessionWithPlayers, GameStats } from "../types"

interface CreateGameRequest {
  gameType: "local" | "online" | "tournament"
  player1Id?: number
  player2Id?: number
}

interface UpdateScoreRequest {
  player1Score: number
  player2Score: number
}

interface CompleteGameRequest {
  player1Score: number
  player2Score: number
  duration: number
}

export class GameService {
  /**
   * Create a new game session
   */
  async createGameSession(
    gameType: "local" | "online" | "tournament",
    player1Id?: number,
    player2Id?: number,
  ): Promise<GameSession> {
    const response = await apiClient.post<{ session: GameSession }>(
      "/api/games",
      { gameType, player1Id, player2Id } as CreateGameRequest,
    )
    return response.session
  }

  /**
   * Get game session by ID
   */
  async getGameSession(id: number): Promise<GameSessionWithPlayers> {
    const response = await apiClient.get<{ session: GameSessionWithPlayers }>(
      `/api/games/${id}`,
    )
    return response.session
  }

  /**
   * Update game score
   */
  async updateScore(
    id: number,
    player1Score: number,
    player2Score: number,
  ): Promise<void> {
    await apiClient.patch(`/api/games/${id}/score`, {
      player1Score,
      player2Score,
    } as UpdateScoreRequest)
  }

  /**
   * Complete a game session
   */
  async completeGameSession(
    id: number,
    player1Score: number,
    player2Score: number,
    duration: number,
  ): Promise<GameSession> {
    const response = await apiClient.post<{ session: GameSession }>(
      `/api/games/${id}/complete`,
      { player1Score, player2Score, duration } as CompleteGameRequest,
    )
    return response.session
  }

  /**
   * Get recent games
   */
  async getRecentGames(limit = 10): Promise<GameSession[]> {
    const response = await apiClient.get<{ games: GameSession[] }>(
      `/api/games/recent?limit=${limit}`,
    )
    return response.games
  }

  /**
   * Get user game history
   */
  async getUserGameHistory(
    userId: number,
    page = 1,
    limit = 50,
  ): Promise<{
    history: GameSessionWithPlayers[]
    pagination: { page: number; limit: number; total: number }
  }> {
    const response = await apiClient.get<{
      history: GameSessionWithPlayers[]
      pagination: { page: number; limit: number; total: number }
    }>(`/api/games/user/${userId}/history?page=${page}&limit=${limit}`)
    return response
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: number): Promise<GameStats> {
    const response = await apiClient.get<{ stats: GameStats }>(
      `/api/games/user/${userId}/stats`,
    )
    return response.stats
  }
}

export const gameService = new GameService()
