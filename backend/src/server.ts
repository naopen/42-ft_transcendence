import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { initDatabase } from './database/init';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import gameRoutes from './routes/games';
import statsRoutes from './routes/stats';
import { setupGameSocket } from './sockets/gameSocket';

// Load environment variables
dotenv.config();

// Get local IP address for remote multiplayer
function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '0.0.0.0'; // Fallback
}

// HTTPS configuration
let httpsOptions = {};
const useHttps = process.env.USE_HTTPS === 'true';

if (useHttps) {
  const certsPath = path.join(__dirname, '..', 'certs');
  const keyPath = path.join(certsPath, 'key.pem');
  const certPath = path.join(certsPath, 'cert.pem');
  
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    httpsOptions = {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      }
    };
    console.log('🔐 HTTPS enabled with SSL certificates');
  } else {
    console.warn('⚠️  SSL certificates not found, falling back to HTTP');
  }
}

const server = Fastify({
  logger: {
    level: 'info'
  },
  ...httpsOptions
});

// Initialize database
async function initializeApp() {
  try {
    // Setup database
    await initDatabase();

    // Register plugins
    const localIp = getLocalIpAddress();
    const protocol = useHttps ? 'https' : 'http';
    const frontendUrl = process.env.FRONTEND_URL || `${protocol}://${localIp}:5173`;
    
    await server.register(cors, {
      origin: [frontendUrl, 'http://localhost:5173', 'https://localhost:5173'],
      credentials: true
    });

    await server.register(cookie);

    await server.register(session, {
      secret: process.env.SESSION_SECRET || 'a-very-long-secret-key-that-should-be-changed',
      cookie: {
        secure: useHttps,
        httpOnly: true,
        maxAge: 86400000, // 1 day
        sameSite: 'lax'
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
        origin: [frontendUrl, 'http://localhost:5173', 'https://localhost:5173'],
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

    const serverProtocol = useHttps ? 'https' : 'http';
    const displayHost = host === '0.0.0.0' ? localIp : host;
    
    console.log(`🚀 Server running at ${serverProtocol}://${displayHost}:${port}`);
    console.log(`📊 Health check: ${serverProtocol}://${displayHost}:${port}/health`);
    console.log(`🌐 Local IP: ${localIp}`);
    console.log(`🔐 HTTPS: ${useHttps ? 'Enabled' : 'Disabled'}`);
    
    if (useHttps) {
      console.log(`\n🎮 Remote Multiplayer Access:`);
      console.log(`   Share this URL: https://${localIp}:5173`);
      console.log(`   Backend API: https://${localIp}:${port}`);
    }

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
