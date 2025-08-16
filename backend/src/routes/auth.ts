import { FastifyPluginAsync } from 'fastify';
import oauthPlugin from '@fastify/oauth2';
import jwt from '@fastify/jwt';
import { db } from '../database/init';
import { v4 as uuidv4 } from 'uuid';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register JWT plugin
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'supersecret'
  });

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
    startRedirectPath: '/api/auth/google',
    callbackUri: `${process.env.BACKEND_URL}/api/auth/google/callback`
  });

  // Google OAuth login
  fastify.get('/google/callback', async function (request, reply) {
    try {
      const { token } = await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
      
      // Get user info from Google
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token.access_token}`
        }
      });
      
      const googleUser = await response.json();
      
      // Check if user exists or create new one
      let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleUser.id);
      
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
        
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
        
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
        .redirect(`${process.env.FRONTEND_URL}?token=${jwtToken}`);
      
    } catch (error) {
      fastify.log.error(error);
      reply.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
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
    const sessionId = request.cookies.session;
    
    if (!sessionId) {
      reply.code(401);
      return { authenticated: false };
    }
    
    const session = db.prepare(`
      SELECT s.*, u.* 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `).get(sessionId);
    
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
  });
};

export default authRoutes;
