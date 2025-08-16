import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { initDatabase } from './database/init';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import gameRoutes from './routes/games';
import statsRoutes from './routes/stats';
import { setupGameSocket } from './sockets/gameSocket';

// Load environment variables
dotenv.config();

const server = Fastify({
  logger: {
    level: 'info'
  }
});

// Initialize database
async function initializeApp() {
  try {
    // Setup database
    await initDatabase();

    // Register plugins
    await server.register(cors, {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    });

    await server.register(cookie);

    await server.register(session, {
      secret: process.env.SESSION_SECRET || 'a-very-long-secret-key-that-should-be-changed',
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 86400000 // 1 day
      }
    });

    // Register JWT plugin globally
    await server.register(jwt, {
      secret: process.env.JWT_SECRET || 'supersecret'
    });

    await server.register(websocket);

    // Setup Socket.IO
    const io = new Server(server.server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
      }
    });

    // Setup game socket handlers
    setupGameSocket(io);

    // Register routes
    await server.register(authRoutes, { prefix: '/api/auth' });
    await server.register(userRoutes, { prefix: '/api/users' });
    await server.register(gameRoutes, { prefix: '/api/games' });
    await server.register(statsRoutes, { prefix: '/api/stats' });

    // Health check endpoint
    server.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Start server
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });

    console.log(`🚀 Server running at http://${host}:${port}`);
    console.log(`📊 Health check: http://${host}:${port}/health`);

  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await server.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});

// Start the application
initializeApp();
