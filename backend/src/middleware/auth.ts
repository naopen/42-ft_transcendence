import { FastifyRequest, FastifyReply } from 'fastify';
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

export async function authenticateUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Check for JWT token in Authorization header first
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = (request.server as any).jwt.verify(token) as JwtPayload;
        
        // Get user from database
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId) as User | undefined;
        
        if (user) {
          // Attach user to request
          (request as any).userId = user.id;
          (request as any).user = user;
          return;
        }
      } catch (jwtError) {
        // JWT verification failed, fall back to session check
      }
    }

    // Fall back to session cookie check
    const sessionId = request.cookies.session;

    if (!sessionId) {
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }

    const session = db.prepare(`
      SELECT * FROM sessions
      WHERE id = ? AND expires_at > datetime('now')
    `).get(sessionId) as Session | undefined;

    if (!session) {
      reply.code(401).send({ error: 'Session expired' });
      return;
    }

    // Get user from database
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id) as User | undefined;

    if (!user) {
      reply.code(401).send({ error: 'User not found' });
      return;
    }

    // Attach user to request
    (request as any).userId = session.user_id;
    (request as any).user = user;
  } catch (error) {
    console.error('Authentication error:', error);
    reply.code(401).send({ error: 'Authentication failed' });
  }
}
