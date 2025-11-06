import db from "../config/database"
import { ConflictError, NotFoundError } from "../middleware/error-handler"

interface GameSession {
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

export class GameService {
  /**
   * Create a new game session
   */
  createGameSession(
    gameType: "local" | "online" | "tournament",
    player1Id: number | null = null,
    player2Id: number | null = null,
  ): GameSession {
    const result = db
      .prepare(
        `
      INSERT INTO game_sessions (player1_id, player2_id, game_type)
      VALUES (?, ?, ?)
    `,
      )
      .run(player1Id, player2Id, gameType)

    const sessionId = result.lastInsertRowid as number
    return this.getGameSessionById(sessionId)
  }

  /**
   * Get game session by ID
   */
  getGameSessionById(id: number): GameSession {
    const session = db
      .prepare(
        `
      SELECT * FROM game_sessions WHERE id = ?
    `,
      )
      .get(id) as GameSession | undefined

    if (!session) {
      throw new NotFoundError("Game session not found")
    }

    return session
  }

  /**
   * Update game score
   */
  updateScore(
    sessionId: number,
    player1Score: number,
    player2Score: number,
  ): void {
    const session = this.getGameSessionById(sessionId)

    if (session.completed_at) {
      throw new ConflictError("Cannot update completed game")
    }

    db.prepare(
      `
      UPDATE game_sessions
      SET player1_score = ?, player2_score = ?
      WHERE id = ?
    `,
    ).run(player1Score, player2Score, sessionId)
  }

  /**
   * Complete a game session
   */
  completeGameSession(
    sessionId: number,
    player1Score: number,
    player2Score: number,
    duration: number,
  ): GameSession {
    const session = this.getGameSessionById(sessionId)

    if (session.completed_at) {
      throw new ConflictError("Game already completed")
    }

    // Determine winner
    let winnerId: number | null = null
    if (player1Score > player2Score && session.player1_id) {
      winnerId = session.player1_id
    } else if (player2Score > player1Score && session.player2_id) {
      winnerId = session.player2_id
    }

    db.prepare(
      `
      UPDATE game_sessions
      SET player1_score = ?,
          player2_score = ?,
          winner_id = ?,
          duration = ?,
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    ).run(player1Score, player2Score, winnerId, duration, sessionId)

    return this.getGameSessionById(sessionId)
  }

  /**
   * Get user game history
   */
  getUserGameHistory(userId: number, limit = 50, offset = 0): GameSession[] {
    return db
      .prepare(
        `
      SELECT * FROM game_sessions
      WHERE (player1_id = ? OR player2_id = ?)
        AND completed_at IS NOT NULL
      ORDER BY completed_at DESC
      LIMIT ? OFFSET ?
    `,
      )
      .all(userId, userId, limit, offset) as GameSession[]
  }

  /**
   * Get user statistics
   */
  getUserStats(userId: number) {
    const stats = db
      .prepare(
        `
      SELECT 
        COUNT(*) as total_games,
        SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN winner_id != ? AND winner_id IS NOT NULL THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN winner_id IS NULL THEN 1 ELSE 0 END) as draws,
        AVG(duration) as avg_duration,
        SUM(CASE WHEN player1_id = ? THEN player1_score ELSE player2_score END) as total_points_scored,
        SUM(CASE WHEN player1_id = ? THEN player2_score ELSE player1_score END) as total_points_conceded
      FROM game_sessions
      WHERE (player1_id = ? OR player2_id = ?)
        AND completed_at IS NOT NULL
    `,
      )
      .get(userId, userId, userId, userId, userId, userId) as any

    return {
      totalGames: stats.total_games || 0,
      wins: stats.wins || 0,
      losses: stats.losses || 0,
      draws: stats.draws || 0,
      winRate:
        stats.total_games > 0 ? (stats.wins / stats.total_games) * 100 : 0,
      avgDuration: stats.avg_duration || 0,
      totalPointsScored: stats.total_points_scored || 0,
      totalPointsConceded: stats.total_points_conceded || 0,
    }
  }

  /**
   * Get recent games (for homepage/leaderboard)
   */
  getRecentGames(limit = 10): GameSession[] {
    return db
      .prepare(
        `
      SELECT * FROM game_sessions
      WHERE completed_at IS NOT NULL
      ORDER BY completed_at DESC
      LIMIT ?
    `,
      )
      .all(limit) as GameSession[]
  }

  /**
   * Get game session with player details
   */
  getGameSessionWithPlayers(sessionId: number) {
    const session = this.getGameSessionById(sessionId)

    const player1 = session.player1_id
      ? db
          .prepare(
            "SELECT id, display_name, avatar_url FROM users WHERE id = ?",
          )
          .get(session.player1_id)
      : null

    const player2 = session.player2_id
      ? db
          .prepare(
            "SELECT id, display_name, avatar_url FROM users WHERE id = ?",
          )
          .get(session.player2_id)
      : null

    return {
      ...session,
      player1,
      player2,
    }
  }

  /**
   * Get user game history count
   */
  getUserGameHistoryCount(userId: number): number {
    const result = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM game_sessions
      WHERE (player1_id = ? OR player2_id = ?)
        AND completed_at IS NOT NULL
    `,
      )
      .get(userId, userId) as { count: number }

    return result.count
  }

  /**
   * Get user game history with player details
   */
  getUserGameHistoryWithPlayers(userId: number, limit = 50, offset = 0) {
    const sessions = this.getUserGameHistory(userId, limit, offset)

    return sessions.map((session) => {
      const player1 = session.player1_id
        ? db
            .prepare(
              "SELECT id, display_name, avatar_url, created_at FROM users WHERE id = ?",
            )
            .get(session.player1_id)
        : null

      const player2 = session.player2_id
        ? db
            .prepare(
              "SELECT id, display_name, avatar_url, created_at FROM users WHERE id = ?",
            )
            .get(session.player2_id)
        : null

      return {
        ...session,
        player1,
        player2,
      }
    })
  }
}

export const gameService = new GameService()
