import { FastifyPluginAsync } from 'fastify';
import { db } from '../database/init';

interface UserParams {
  id: string;
}

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

const userRoutes: FastifyPluginAsync = async (fastify) => {
  // Authentication middleware that has access to fastify.jwt
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      console.log('🔍 User Routes Authentication Debug:');
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
            (request as any).userId = user.id;
            (request as any).user = user;
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
      (request as any).userId = session.user_id;
      (request as any).user = user;
    } catch (error) {
      console.error('❌ Authentication error:', error);
      reply.code(401).send({ error: 'Authentication failed' });
    }
  });

  // Get current user profile
  fastify.get('/me', async (request) => {
    const userId = (request as any).userId;

    const user = db.prepare(`
      SELECT u.*, s.games_played, s.games_won, s.games_lost,
             s.total_points_scored, s.total_points_conceded,
             s.win_streak, s.best_win_streak
      FROM users u
      LEFT JOIN user_stats s ON u.id = s.user_id
      WHERE u.id = ?
    `).get(userId);

    return user;
  });

  // Get user profile by ID
  fastify.get<{ Params: UserParams }>('/:id', async (request) => {
    const { id } = request.params;

    const user = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.created_at,
             s.games_played, s.games_won, s.games_lost,
             s.total_points_scored, s.total_points_conceded,
             s.win_streak, s.best_win_streak
      FROM users u
      LEFT JOIN user_stats s ON u.id = s.user_id
      WHERE u.id = ?
    `).get(id);

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    return user;
  });

  // Update user locale (for multi-language support)
  fastify.patch('/me/locale', async (request) => {
    const userId = (request as any).userId;
    const { locale } = request.body as { locale: string };

    const allowedLocales = ['en', 'ja', 'fr'];
    if (!allowedLocales.includes(locale)) {
      throw { statusCode: 400, message: 'Invalid locale' };
    }

    db.prepare('UPDATE users SET locale = ? WHERE id = ?').run(locale, userId);

    return { success: true, locale };
  });

  // Get user's recent games
  fastify.get('/me/games', async (request) => {
    const userId = (request as any).userId;
    const { limit = 10, offset = 0 } = request.query as { limit?: number; offset?: number };

    const games = db.prepare(`
      SELECT g.*,
             p1.username as player1_username, p1.display_name as player1_display_name,
             p2.username as player2_username, p2.display_name as player2_display_name,
             w.username as winner_username
      FROM games g
      LEFT JOIN users p1 ON g.player1_id = p1.id
      LEFT JOIN users p2 ON g.player2_id = p2.id
      LEFT JOIN users w ON g.winner_id = w.id
      WHERE g.player1_id = ? OR g.player2_id = ?
      ORDER BY g.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, userId, limit, offset);

    return games;
  });

  // Get leaderboard
  fastify.get('/leaderboard', async (request) => {
    const { limit = 10 } = request.query as { limit?: number };

    const leaderboard = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url,
             s.games_played, s.games_won, s.games_lost,
             CAST(s.games_won AS REAL) / NULLIF(s.games_played, 0) as win_rate,
             s.best_win_streak
      FROM users u
      INNER JOIN user_stats s ON u.id = s.user_id
      WHERE s.games_played > 0
      ORDER BY win_rate DESC, s.games_won DESC
      LIMIT ?
    `).all(limit);

    return leaderboard;
  });
};

export default userRoutes;
