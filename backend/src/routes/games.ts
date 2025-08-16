import { FastifyPluginAsync } from 'fastify';
import { db } from '../database/init';

interface JwtPayload {
  userId: number;
  sessionId: string;
  email: string;
}

interface User {
  id: number;
  google_id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string;
  locale: string;
}

interface Session {
  id: string;
  user_id: number;
  expires_at: string;
}

interface Game {
  id: number;
  player1_id: number;
  player2_id?: number;
  status: string;
  created_at: string;
}

interface TournamentMatch {
  id: number;
  tournament_id: number;
  round: number;
  player1_alias: string;
  player2_alias: string;
  winner_alias?: string;
}

const gameRoutes: FastifyPluginAsync = async (fastify) => {
  // Authentication middleware function that has access to fastify.jwt
  const authenticateGameUser = async (request: any, reply: any) => {
    try {
      console.log('🔍 Game Routes Authentication Debug:');
      console.log('Authorization header:', request.headers.authorization);
      console.log('Session cookie:', request.cookies.session);
      
      // Check for JWT token in Authorization header first
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log('🎫 Found JWT token, attempting verification...');
        try {
          const decoded = fastify.jwt.verify(token) as JwtPayload;
          console.log('✅ JWT verified successfully, userId:', decoded.userId);
          
          // Get user from database
          const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId) as User | undefined;
          
          if (user) {
            console.log('✅ User found in database:', user.username);
            // Attach user to request
            request.userId = user.id;
            request.user = user;
            return;
          } else {
            console.log('❌ User not found in database for userId:', decoded.userId);
          }
        } catch (jwtError) {
          console.log('❌ JWT verification failed:', jwtError);
          // JWT verification failed, fall back to session check
        }
      } else {
        console.log('🚫 No JWT token found in Authorization header');
      }

      // Fall back to session cookie check
      const sessionId = request.cookies.session;

      if (!sessionId) {
        console.log('❌ No session cookie found');
        reply.code(401).send({ error: 'Unauthorized' });
        return;
      }

      console.log('🍪 Checking session cookie:', sessionId);
      const session = db.prepare(`
        SELECT * FROM sessions
        WHERE id = ? AND expires_at > datetime('now')
      `).get(sessionId) as Session | undefined;

      if (!session) {
        console.log('❌ Session not found or expired');
        reply.code(401).send({ error: 'Session expired' });
        return;
      }

      // Get user from database
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id) as User | undefined;

      if (!user) {
        console.log('❌ User not found for session');
        reply.code(401).send({ error: 'User not found' });
        return;
      }

      console.log('✅ Session authenticated successfully, user:', user.username);
      // Attach user to request
      request.userId = session.user_id;
      request.user = user;
    } catch (error) {
      console.error('❌ Authentication error:', error);
      reply.code(401).send({ error: 'Authentication failed' });
    }
  };

  // Create a new game (matchmaking) - requires authentication
  fastify.post('/match', { preHandler: authenticateGameUser }, async (request) => {
    const userId = (request as any).userId;

        // Check if user is already in a pending game
    const pendingGame = db.prepare(`
      SELECT * FROM games
      WHERE (player1_id = ? OR player2_id = ?)
      AND status = 'pending'
    `).get(userId, userId) as Game | undefined;

    if (pendingGame) {
      return { gameId: pendingGame.id, status: 'already_matched' };
    }

    // Look for an opponent waiting for a match
    const waitingGame = db.prepare(`
      SELECT * FROM games
      WHERE player2_id IS NULL
      AND status = 'waiting'
      AND player1_id != ?
      ORDER BY created_at ASC
      LIMIT 1
    `).get(userId) as Game | undefined;

    if (waitingGame) {
      // Join existing game
      db.prepare(`
        UPDATE games
        SET player2_id = ?, status = 'pending'
        WHERE id = ?
      `).run(userId, waitingGame.id);

      return { gameId: waitingGame.id, status: 'matched' };
    } else {
      // Create new game and wait for opponent
      const result = db.prepare(`
        INSERT INTO games (player1_id, status)
        VALUES (?, 'waiting')
      `).run(userId);

      return { gameId: result.lastInsertRowid, status: 'waiting' };
    }
  });

  // Get game details
  fastify.get('/:id', async (request) => {
    const { id } = request.params as { id: string };

    const game = db.prepare(`
      SELECT g.*,
             p1.username as player1_username, p1.display_name as player1_display_name,
             p2.username as player2_username, p2.display_name as player2_display_name,
             w.username as winner_username
      FROM games g
      LEFT JOIN users p1 ON g.player1_id = p1.id
      LEFT JOIN users p2 ON g.player2_id = p2.id
      LEFT JOIN users w ON g.winner_id = w.id
      WHERE g.id = ?
    `).get(id);

    if (!game) {
      throw { statusCode: 404, message: 'Game not found' };
    }

    return game;
  });

  // Create a local tournament
  fastify.post('/tournament', async (request) => {
    const { name, players } = request.body as { name: string; players: string[] };

    if (players.length < 2 || players.length > 16) {
      throw { statusCode: 400, message: 'Tournament must have between 2 and 16 players' };
    }

    // Check for duplicate aliases
    const uniquePlayers = new Set(players);
    if (uniquePlayers.size !== players.length) {
      throw { statusCode: 400, message: 'All player aliases must be unique' };
    }

    // Create tournament
    const tournamentResult = db.prepare(`
      INSERT INTO tournaments (name, total_players, status)
      VALUES (?, ?, 'active')
    `).run(name, players.length);

    const tournamentId = tournamentResult.lastInsertRowid;

    // Add players to tournament
    const insertPlayer = db.prepare(`
      INSERT INTO tournament_players (tournament_id, alias)
      VALUES (?, ?)
    `);

    players.forEach((alias) => {
      insertPlayer.run(tournamentId, alias);
    });

    // Create first round matches
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const insertMatch = db.prepare(`
      INSERT INTO tournament_games (tournament_id, round, match_number, player1_alias, player2_alias, status)
      VALUES (?, ?, ?, ?, ?, 'ready')
    `);

    for (let i = 0; i < shuffledPlayers.length; i += 2) {
      if (i + 1 < shuffledPlayers.length) {
        insertMatch.run(
          tournamentId,
          1,
          Math.floor(i / 2) + 1,
          shuffledPlayers[i],
          shuffledPlayers[i + 1]
        );
      }
    }

    // If odd number of players, give the last player a bye
    if (shuffledPlayers.length % 2 === 1) {
      const lastPlayer = shuffledPlayers[shuffledPlayers.length - 1];
      insertMatch.run(
        tournamentId,
        1,
        Math.ceil(shuffledPlayers.length / 2),
        lastPlayer,
        'BYE'
      );
    }

    return { tournamentId, status: 'created' };
  });

  // Get tournament details
  fastify.get('/tournament/:id', async (request) => {
    const { id } = request.params as { id: string };

    const tournament = db.prepare(`
      SELECT * FROM tournaments WHERE id = ?
    `).get(id);

    if (!tournament) {
      throw { statusCode: 404, message: 'Tournament not found' };
    }

    const players = db.prepare(`
      SELECT * FROM tournament_players
      WHERE tournament_id = ?
      ORDER BY position ASC, alias ASC
    `).all(id);

    const matches = db.prepare(`
      SELECT * FROM tournament_games
      WHERE tournament_id = ?
      ORDER BY round ASC, match_number ASC
    `).all(id);

    return { tournament, players, matches };
  });

  // Update tournament match result
  fastify.post('/tournament/:tournamentId/match/:matchId/result', async (request) => {
    const { tournamentId, matchId } = request.params as { tournamentId: string; matchId: string };
    const { player1Score, player2Score } = request.body as { player1Score: number; player2Score: number };

    const match = db.prepare(`
      SELECT * FROM tournament_games
      WHERE id = ? AND tournament_id = ?
    `).get(matchId, tournamentId) as TournamentMatch | undefined;

    if (!match) {
      throw { statusCode: 404, message: 'Match not found' };
    }

    const winner = player1Score > player2Score ? match.player1_alias : match.player2_alias;

    // Update match result
    db.prepare(`
      UPDATE tournament_games
      SET player1_score = ?, player2_score = ?, winner_alias = ?,
          status = 'completed', ended_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(player1Score, player2Score, winner, matchId);

    // Check if all matches in current round are completed
    const incompletMatches = db.prepare(`
      SELECT COUNT(*) as count FROM tournament_games
      WHERE tournament_id = ? AND round = ? AND status != 'completed'
    `).get(tournamentId, match.round) as { count: number } | undefined;

    if (incompletMatches && incompletMatches.count === 0) {
      // Create next round matches if needed
      createNextRoundMatches(Number(tournamentId), match.round + 1);
    }

    return { success: true };
  });
};

function createNextRoundMatches(tournamentId: number, round: number) {
  // Get winners from previous round
  const winners = db.prepare(`
    SELECT winner_alias FROM tournament_games
    WHERE tournament_id = ? AND round = ?
    ORDER BY match_number ASC
  `).all(tournamentId, round - 1) as { winner_alias: string }[];

  if (winners.length <= 1) {
    // Tournament is complete
    db.prepare(`
      UPDATE tournaments
      SET status = 'completed', winner_alias = ?, ended_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(winners[0]?.winner_alias || '', tournamentId);
    return;
  }

  // Create next round matches
  const insertMatch = db.prepare(`
    INSERT INTO tournament_games (tournament_id, round, match_number, player1_alias, player2_alias, status)
    VALUES (?, ?, ?, ?, ?, 'ready')
  `);

  for (let i = 0; i < winners.length; i += 2) {
    if (i + 1 < winners.length) {
      insertMatch.run(
        tournamentId,
        round,
        Math.floor(i / 2) + 1,
        winners[i].winner_alias,
        winners[i + 1].winner_alias
      );
    } else {
      // Odd number of winners, give bye
      insertMatch.run(
        tournamentId,
        round,
        Math.floor(i / 2) + 1,
        winners[i].winner_alias,
        'BYE'
      );
    }
  }

  // Update tournament current round
  db.prepare(`
    UPDATE tournaments SET current_round = ? WHERE id = ?
  `).run(round, tournamentId);
}

export default gameRoutes;
