import { FastifyPluginAsync } from 'fastify';
import oauthPlugin from '@fastify/oauth2';
import { db } from '../database/init';
import { v4 as uuidv4 } from 'uuid';

// Type definitions
interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  locale?: string;
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
  user_id: number;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string;
  locale: string;
}

interface JwtPayload {
  userId: number;
  sessionId: string;
  email: string;
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register OAuth2 plugin for Google
  await fastify.register(oauthPlugin, {
    name: 'googleOAuth2',
    scope: ['profile', 'email'],
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID || '',
        secret: process.env.GOOGLE_CLIENT_SECRET || ''
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION
    },
    // Use dynamic callback URI based on request headers to handle ngrok URL changes
    callbackUri: (request: any) => {
      // Try to get the host from X-Forwarded-Host header (set by ngrok)
      const forwardedHost = request.headers['x-forwarded-host'];
      const forwardedProto = request.headers['x-forwarded-proto'] || 'http';
      
      if (forwardedHost) {
        return `${forwardedProto}://${forwardedHost}/api/auth/google/callback`;
      }
      
      // Fallback to environment variable
      return `${process.env.BACKEND_URL}/api/auth/google/callback`;
    }
  });

  // Google OAuth login - redirect to Google
  fastify.get('/google', async function (request, reply) {
    const authorizationUri = await (fastify as any).googleOAuth2.generateAuthorizationUri(request, reply);
    // If the plugin doesn't automatically redirect, manually redirect
    if (typeof authorizationUri === 'string') {
      return reply.redirect(authorizationUri);
    }
    return authorizationUri;
  });

  // Google OAuth login
  fastify.get('/google/callback', async function (request, reply) {
    try {
      const { token } = await (fastify as any).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

      // Get user info from Google
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token.access_token}`
        }
      });

      const googleUser = await response.json() as GoogleUser;

      // Check if user exists or create new one
      let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleUser.id) as User | undefined;

      if (!user) {
        // Create new user
        const username = googleUser.email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
        const stmt = db.prepare(`
          INSERT INTO users (google_id, email, username, display_name, avatar_url, locale)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
          googleUser.id,
          googleUser.email,
          username,
          googleUser.name,
          googleUser.picture,
          googleUser.locale || 'en'
        );

        user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User;

        // Initialize user stats
        db.prepare('INSERT INTO user_stats (user_id) VALUES (?)').run(user.id);
      }

      // Create session
      const sessionId = uuidv4();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day

      db.prepare(`
        INSERT INTO sessions (id, user_id, expires_at)
        VALUES (?, ?, ?)
      `).run(sessionId, user.id, expiresAt.toISOString());

      // Generate JWT token
      const jwtToken = fastify.jwt.sign({
        userId: user.id,
        sessionId,
        email: user.email
      });

      // Set cookie and redirect to frontend
      reply
        .setCookie('session', sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 86400 // 1 day
        })
        .redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?token=${jwtToken}&redirect=game`);

    } catch (error) {
      fastify.log.error(error);
      reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }
  });

  // Logout endpoint
  fastify.post('/logout', async (request, reply) => {
    const sessionId = request.cookies.session;

    if (sessionId) {
      // Delete session from database
      db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
      reply.clearCookie('session');
    }

    return { success: true };
  });

  // Verify session endpoint
  fastify.get('/verify', async (request, reply) => {
    try {
      // Check for JWT token in Authorization header first
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = fastify.jwt.verify(token) as JwtPayload;
          
          // Get user from database
          const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId) as User | undefined;
          
          if (user) {
            return {
              authenticated: true,
              user: {
                id: user.id,
                email: user.email,
                username: user.username,
                displayName: user.display_name,
                avatarUrl: user.avatar_url,
                locale: user.locale
              }
            };
          }
        } catch (jwtError) {
          // JWT verification failed, fall back to session check
        }
      }

      // Fall back to session cookie check
      const sessionId = request.cookies.session;

      if (!sessionId) {
        reply.code(401);
        return { authenticated: false };
      }

      const session = db.prepare(`
        SELECT 
          s.user_id,
          u.email,
          u.username,
          u.display_name,
          u.avatar_url,
          u.locale
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ? AND s.expires_at > datetime('now')
      `).get(sessionId) as Session | undefined;

      if (!session) {
        reply.code(401);
        return { authenticated: false };
      }

      return {
        authenticated: true,
        user: {
          id: session.user_id,
          email: session.email,
          username: session.username,
          displayName: session.display_name,
          avatarUrl: session.avatar_url,
          locale: session.locale
        }
      };
    } catch (error) {
      console.error('Verify endpoint error:', error);
      reply.code(401);
      return { authenticated: false };
    }
  });
};

export default authRoutes;
