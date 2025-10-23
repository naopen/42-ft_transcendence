import { tournamentService } from "../services/tournament.service"

import type {
  Tournament,
  TournamentDetails,
  TournamentMatch,
  TournamentParticipant,
} from "../types"

type TournamentStateListener = (state: TournamentState) => void

interface TournamentState {
  currentTournament: TournamentDetails | null
  tournaments: Tournament[]
  isLoading: boolean
  error: string | null
}

export class TournamentStore {
  private state: TournamentState = {
    currentTournament: null,
    tournaments: [],
    isLoading: false,
    error: null,
  }

  private listeners = new Set<TournamentStateListener>()

  /**
   * Create a new tournament
   */
  async createTournament(name: string, aliases: string[]): Promise<Tournament> {
    this.setState({ isLoading: true, error: null })

    try {
      const tournament = await tournamentService.createTournament(name, aliases)

      // Load full tournament details
      await this.loadTournamentDetails(tournament.id)

      this.setState({ isLoading: false })
      return tournament
    } catch (error: any) {
      console.error("Failed to create tournament:", error)
      this.setState({
        isLoading: false,
        error: error.message || "Failed to create tournament",
      })
      throw error
    }
  }

  /**
   * Load tournament details
   */
  async loadTournamentDetails(id: number): Promise<void> {
    this.setState({ isLoading: true, error: null })

    try {
      const details = await tournamentService.getTournamentDetails(id)
      this.setState({
        currentTournament: details,
        isLoading: false,
      })
    } catch (error: any) {
      console.error("Failed to load tournament details:", error)
      this.setState({
        isLoading: false,
        error: error.message || "Failed to load tournament details",
      })
      throw error
    }
  }

  /**
   * Start tournament
   */
  async startTournament(id: number): Promise<void> {
    this.setState({ isLoading: true, error: null })

    try {
      await tournamentService.startTournament(id)
      // Reload tournament details
      await this.loadTournamentDetails(id)
      this.setState({ isLoading: false })
    } catch (error: any) {
      console.error("Failed to start tournament:", error)
      this.setState({
        isLoading: false,
        error: error.message || "Failed to start tournament",
      })
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
    this.setState({ isLoading: true, error: null })

    try {
      await tournamentService.completeMatch(
        tournamentId,
        matchId,
        winnerId,
        gameSessionId,
      )
      // Reload tournament details to get updated state
      await this.loadTournamentDetails(tournamentId)
      this.setState({ isLoading: false })
    } catch (error: any) {
      console.error("Failed to complete match:", error)
      this.setState({
        isLoading: false,
        error: error.message || "Failed to complete match",
      })
      throw error
    }
  }

  /**
   * Load all tournaments
   */
  async loadTournaments(page = 1, limit = 50): Promise<void> {
    this.setState({ isLoading: true, error: null })

    try {
      const { tournaments } = await tournamentService.getAllTournaments(
        page,
        limit,
      )
      this.setState({
        tournaments,
        isLoading: false,
      })
    } catch (error: any) {
      console.error("Failed to load tournaments:", error)
      this.setState({
        isLoading: false,
        error: error.message || "Failed to load tournaments",
      })
    }
  }

  /**
   * Get current match
   */
  getCurrentMatch(): TournamentMatch | null {
    return this.state.currentTournament?.currentMatch || null
  }

  /**
   * Get participants
   */
  getParticipants(): TournamentParticipant[] {
    return this.state.currentTournament?.participants || []
  }

  /**
   * Get matches by round
   */
  getMatchesByRound(round: number): TournamentMatch[] {
    return (
      this.state.currentTournament?.matches.filter(
        (match) => match.round === round,
      ) || []
    )
  }

  /**
   * Get participant by ID
   */
  getParticipantById(id: number): TournamentParticipant | null {
    return (
      this.state.currentTournament?.participants.find((p) => p.id === id) ||
      null
    )
  }

  /**
   * Clear current tournament
   */
  clearCurrentTournament(): void {
    this.setState({ currentTournament: null })
  }

  /**
   * Get current state
   */
  getState(): TournamentState {
    return { ...this.state }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: TournamentStateListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Update state and notify listeners
   */
  private setState(updates: Partial<TournamentState>) {
    this.state = { ...this.state, ...updates }
    this.notifyListeners()
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getState()))
  }
}

export const tournamentStore = new TournamentStore()
