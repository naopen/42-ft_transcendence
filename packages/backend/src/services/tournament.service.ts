import db from "../config/database"
import { ConflictError, NotFoundError } from "../middleware/error-handler"

interface Tournament {
  id: number
  name: string
  status: "pending" | "in_progress" | "completed"
  created_at: string
  completed_at: string | null
}

interface TournamentParticipant {
  id: number
  tournament_id: number
  alias: string
  user_id: number | null
  position: number | null
  eliminated_at: string | null
}

interface TournamentMatch {
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

export class TournamentService {
  /**
   * Create a new tournament with participants
   */
  createTournament(
    name: string,
    aliases: string[],
    userId?: number,
  ): Tournament {
    if (aliases.length < 3) {
      throw new ConflictError("Tournament requires at least 3 participants")
    }

    // Check for duplicate aliases
    const uniqueAliases = new Set(aliases)
    if (uniqueAliases.size !== aliases.length) {
      throw new ConflictError("Duplicate aliases are not allowed")
    }

    const transaction = db.transaction(() => {
      // Create tournament
      const tournamentResult = db
        .prepare(
          `
        INSERT INTO tournaments (name, status)
        VALUES (?, 'pending')
      `,
        )
        .run(name)

      const tournamentId = tournamentResult.lastInsertRowid as number

      // Add participants
      const insertParticipant = db.prepare(`
        INSERT INTO tournament_participants (tournament_id, alias, user_id)
        VALUES (?, ?, ?)
      `)

      aliases.forEach((alias) => {
        insertParticipant.run(tournamentId, alias, userId || null)
      })

      // Generate bracket matches
      this.generateBracket(tournamentId)

      return tournamentId
    })

    const tournamentId = transaction()

    return this.getTournamentById(tournamentId)
  }

  /**
   * Generate tournament bracket (single elimination)
   */
  private generateBracket(tournamentId: number): void {
    const participants = db
      .prepare(
        `
      SELECT * FROM tournament_participants
      WHERE tournament_id = ?
      ORDER BY RANDOM()
    `,
      )
      .all(tournamentId) as TournamentParticipant[]

    // Calculate number of rounds needed
    const _totalRounds = Math.ceil(Math.log2(participants.length))

    // First round matches
    const insertMatch = db.prepare(`
      INSERT INTO tournament_matches 
      (tournament_id, round, match_order, participant1_id, participant2_id, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `)

    let matchOrder = 0
    for (let i = 0; i < participants.length; i += 2) {
      if (i + 1 < participants.length) {
        insertMatch.run(
          tournamentId,
          1,
          matchOrder++,
          participants[i].id,
          participants[i + 1].id,
        )
      } else {
        // Bye - participant automatically advances
        // We'll handle this in the match completion logic
      }
    }
  }

  /**
   * Get tournament by ID with participants and matches
   */
  getTournamentById(id: number) {
    const tournament = db
      .prepare(
        `
      SELECT * FROM tournaments WHERE id = ?
    `,
      )
      .get(id) as Tournament | undefined

    if (!tournament) {
      throw new NotFoundError("Tournament not found")
    }

    return tournament
  }

  /**
   * Get tournament participants
   */
  getTournamentParticipants(tournamentId: number): TournamentParticipant[] {
    return db
      .prepare(
        `
      SELECT * FROM tournament_participants
      WHERE tournament_id = ?
      ORDER BY id
    `,
      )
      .all(tournamentId) as TournamentParticipant[]
  }

  /**
   * Get tournament matches
   */
  getTournamentMatches(tournamentId: number): TournamentMatch[] {
    return db
      .prepare(
        `
      SELECT * FROM tournament_matches
      WHERE tournament_id = ?
      ORDER BY round, match_order
    `,
      )
      .all(tournamentId) as TournamentMatch[]
  }

  /**
   * Get current match (next pending match)
   */
  getCurrentMatch(tournamentId: number): TournamentMatch | null {
    const match = db
      .prepare(
        `
      SELECT * FROM tournament_matches
      WHERE tournament_id = ? AND status = 'pending'
      ORDER BY round, match_order
      LIMIT 1
    `,
      )
      .get(tournamentId) as TournamentMatch | undefined

    return match || null
  }

  /**
   * Start a tournament
   */
  startTournament(tournamentId: number): void {
    const tournament = this.getTournamentById(tournamentId)

    if (tournament.status !== "pending") {
      throw new ConflictError("Tournament has already started")
    }

    db.prepare(
      `
      UPDATE tournaments
      SET status = 'in_progress'
      WHERE id = ?
    `,
    ).run(tournamentId)
  }

  /**
   * Complete a match and update tournament state
   */
  completeMatch(
    matchId: number,
    winnerId: number,
    gameSessionId: number,
  ): void {
    const match = db
      .prepare(
        `
      SELECT * FROM tournament_matches WHERE id = ?
    `,
      )
      .get(matchId) as TournamentMatch | undefined

    if (!match) {
      throw new NotFoundError("Match not found")
    }

    if (match.status === "completed") {
      throw new ConflictError("Match already completed")
    }

    // Verify winner is a participant in this match
    if (
      winnerId !== match.participant1_id &&
      winnerId !== match.participant2_id
    ) {
      throw new ConflictError("Winner must be one of the match participants")
    }

    const transaction = db.transaction(() => {
      // Update match
      db.prepare(
        `
        UPDATE tournament_matches
        SET status = 'completed', winner_id = ?, game_session_id = ?
        WHERE id = ?
      `,
      ).run(winnerId, gameSessionId, matchId)

      // Mark loser as eliminated
      const loserId =
        winnerId === match.participant1_id
          ? match.participant2_id
          : match.participant1_id

      db.prepare(
        `
        UPDATE tournament_participants
        SET eliminated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      ).run(loserId)

      // Check if we need to create next round match
      const currentRoundMatches = db
        .prepare(
          `
        SELECT * FROM tournament_matches
        WHERE tournament_id = ? AND round = ?
      `,
        )
        .all(match.tournament_id, match.round) as TournamentMatch[]

      const completedMatches = currentRoundMatches.filter(
        (m) => m.status === "completed",
      )

      // If all matches in current round are completed, create next round
      if (completedMatches.length === currentRoundMatches.length) {
        this.createNextRound(match.tournament_id, match.round)
      }
    })

    transaction()
  }

  /**
   * Create matches for the next round
   */
  private createNextRound(tournamentId: number, currentRound: number): void {
    const winners = db
      .prepare(
        `
      SELECT winner_id FROM tournament_matches
      WHERE tournament_id = ? AND round = ? AND winner_id IS NOT NULL
      ORDER BY match_order
    `,
      )
      .all(tournamentId, currentRound) as { winner_id: number }[]

    if (winners.length <= 1) {
      // Tournament completed
      this.completeTournament(tournamentId, winners[0]?.winner_id)
      return
    }

    const insertMatch = db.prepare(`
      INSERT INTO tournament_matches 
      (tournament_id, round, match_order, participant1_id, participant2_id, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `)

    const nextRound = currentRound + 1
    let matchOrder = 0

    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        insertMatch.run(
          tournamentId,
          nextRound,
          matchOrder++,
          winners[i].winner_id,
          winners[i + 1].winner_id,
        )
      }
    }
  }

  /**
   * Complete tournament and set final positions
   */
  private completeTournament(tournamentId: number, winnerId: number): void {
    db.prepare(
      `
      UPDATE tournaments
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    ).run(tournamentId)

    // Set winner position
    db.prepare(
      `
      UPDATE tournament_participants
      SET position = 1
      WHERE id = ?
    `,
    ).run(winnerId)
  }

  /**
   * Get all tournaments
   */
  getAllTournaments(limit = 50, offset = 0) {
    return db
      .prepare(
        `
      SELECT * FROM tournaments
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
      )
      .all(limit, offset) as Tournament[]
  }

  /**
   * Get tournament details with full data
   */
  getTournamentDetails(tournamentId: number) {
    const tournament = this.getTournamentById(tournamentId)
    const participants = this.getTournamentParticipants(tournamentId)
    const matches = this.getTournamentMatches(tournamentId)
    const currentMatch = this.getCurrentMatch(tournamentId)

    return {
      tournament,
      participants,
      matches,
      currentMatch,
    }
  }
}

export const tournamentService = new TournamentService()
