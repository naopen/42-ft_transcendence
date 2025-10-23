// User types
export interface User {
  id: number
  email: string
  displayName: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface PublicUser {
  id: number
  display_name: string
  avatar_url: string | null
  created_at: string
}

// Authentication types
export interface AuthStatus {
  authenticated: boolean
  user: {
    id: number
    displayName: string
  } | null
}

export interface CurrentUser {
  id: number
  email: string
  displayName: string
  avatarUrl: string | null
}

// Game types
export interface GameSession {
  id: number
  player1_id: number | null
  player2_id: number | null
  player1_score: number
  player2_score: number
  winner_id: number | null
  game_type: "local" | "online" | "tournament"
  duration: number | null
  created_at: string
  completed_at: string | null
}

export interface GameSessionWithPlayers extends GameSession {
  player1: PublicUser | null
  player2: PublicUser | null
}

export interface GameStats {
  totalGames: number
  wins: number
  losses: number
  draws: number
  winRate: number
  avgDuration: number
  totalPointsScored: number
  totalPointsConceded: number
}

// Tournament types
export interface Tournament {
  id: number
  name: string
  status: "pending" | "in_progress" | "completed"
  created_at: string
  completed_at: string | null
}

export interface TournamentParticipant {
  id: number
  tournament_id: number
  alias: string
  user_id: number | null
  position: number | null
  eliminated_at: string | null
}

export interface TournamentMatch {
  id: number
  tournament_id: number
  round: number
  match_order: number
  participant1_id: number
  participant2_id: number
  winner_id: number | null
  game_session_id: number | null
  status: "pending" | "in_progress" | "completed"
}

export interface TournamentDetails {
  tournament: Tournament
  participants: TournamentParticipant[]
  matches: TournamentMatch[]
  currentMatch: TournamentMatch | null
}

// API Response types
export interface ApiResponse<T> {
  message?: string
  [key: string]: T | string | undefined
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total?: number
  }
}
