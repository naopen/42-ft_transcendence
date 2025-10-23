import { apiClient } from "./api"

import type {
  Tournament,
  TournamentDetails,
  TournamentMatch,
  TournamentParticipant,
} from "../types"

interface CreateTournamentRequest {
  name: string
  aliases: string[]
}

interface CompleteMatchRequest {
  winnerId: number
  gameSessionId: number
}

export class TournamentService {
  /**
   * Create a new tournament
   */
  async createTournament(name: string, aliases: string[]): Promise<Tournament> {
    const response = await apiClient.post<{ tournament: Tournament }>(
      "/api/tournaments",
      { name, aliases } as CreateTournamentRequest,
    )
    return response.tournament
  }

  /**
   * Get all tournaments
   */
  async getAllTournaments(
    page = 1,
    limit = 50,
  ): Promise<{ tournaments: Tournament[] }> {
    return apiClient.get<{ tournaments: Tournament[] }>(
      `/api/tournaments?page=${page}&limit=${limit}`,
    )
  }

  /**
   * Get tournament details
   */
  async getTournamentDetails(id: number): Promise<TournamentDetails> {
    return apiClient.get<TournamentDetails>(`/api/tournaments/${id}`)
  }

  /**
   * Start a tournament
   */
  async startTournament(id: number): Promise<void> {
    await apiClient.post(`/api/tournaments/${id}/start`)
  }

  /**
   * Get current match
   */
  async getCurrentMatch(id: number): Promise<TournamentMatch | null> {
    try {
      const response = await apiClient.get<{ match: TournamentMatch }>(
        `/api/tournaments/${id}/current-match`,
      )
      return response.match
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Complete a match
   */
  async completeMatch(
    tournamentId: number,
    matchId: number,
    winnerId: number,
    gameSessionId: number,
  ): Promise<void> {
    await apiClient.post(
      `/api/tournaments/${tournamentId}/matches/${matchId}/complete`,
      { winnerId, gameSessionId } as CompleteMatchRequest,
    )
  }

  /**
   * Get tournament participants
   */
  async getParticipants(id: number): Promise<TournamentParticipant[]> {
    const response = await apiClient.get<{
      participants: TournamentParticipant[]
    }>(`/api/tournaments/${id}/participants`)
    return response.participants
  }

  /**
   * Get tournament matches
   */
  async getMatches(id: number): Promise<TournamentMatch[]> {
    const response = await apiClient.get<{ matches: TournamentMatch[] }>(
      `/api/tournaments/${id}/matches`,
    )
    return response.matches
  }
}

export const tournamentService = new TournamentService()
