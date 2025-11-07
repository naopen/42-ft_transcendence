import cookie from "@fastify/cookie"
import cors from "@fastify/cors"
import jwt from "@fastify/jwt"
import session from "@fastify/session"
import dotenv from "dotenv"
import Fastify from "fastify"
import fastifySocketIO from "fastify-socket.io"

import { initDatabase } from "./config/database"
import { errorHandler } from "./middleware/error-handler"
import { authRoutes } from "./routes/auth"
import { gameRoutes } from "./routes/game"
import { tournamentRoutes } from "./routes/tournament"
import { userRoutes } from "./routes/user"
import { MatchmakingService } from "./services/matchmaking.service"

import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./types/socket.types"
import type { Server, Socket } from "socket.io"

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>

dotenv.config()

// Note: HTTPS termination is handled by nginx proxy
// Backend runs on HTTP internally, nginx handles SSL/TLS
console.log("🔐 HTTPS termination handled by nginx reverse proxy")

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
  },
})

async function start() {
  try {
    // Initialize database
    await initDatabase()

    // Register error handler
    fastify.setErrorHandler(errorHandler)

    // Register plugins
    await fastify.register(cors, {
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.FRONTEND_URL || "https://your-frontend-url.onrender.com"
          : [
              "https://localhost:8443",
              "https://localhost:5173",
              "http://localhost:8080",
              "http://localhost:5173",
            ],
      credentials: true,
    })

    await fastify.register(cookie)

    // Register JWT for token-based authentication
    await fastify.register(jwt, {
      secret:
        process.env.JWT_SECRET ||
        process.env.SESSION_SECRET ||
        "change-this-secret",
      sign: {
        expiresIn: "7d", // Token valid for 7 days
      },
    })

    await fastify.register(session, {
      secret: process.env.SESSION_SECRET || "change-this-secret",
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // CRITICAL: 'none' for cross-domain in production
        path: "/",
      },
      saveUninitialized: false, // Don't create session until something is stored
      rolling: true, // Reset expiration on every response
    })

    // Register Socket.IO
    await fastify.register(fastifySocketIO, {
      cors: {
        origin:
          process.env.NODE_ENV === "production"
            ? process.env.FRONTEND_URL ||
              "https://your-frontend-url.onrender.com"
            : [
                "https://localhost:8443",
                "https://localhost:5173",
                "http://localhost:8080",
                "http://localhost:5173",
              ],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    })

    // Health check endpoint
    fastify.get("/health", async () => {
      return { status: "ok", timestamp: new Date().toISOString() }
    })

    // API root
    fastify.get("/api", async () => {
      return {
        message: "ft_transcendence API",
        version: "1.0.0",
        endpoints: {
          auth: "/api/auth",
          tournaments: "/api/tournaments",
          games: "/api/games",
          users: "/api/users",
        },
      }
    })

    // Register API routes
    await fastify.register(authRoutes, { prefix: "/api/auth" })
    await fastify.register(tournamentRoutes, { prefix: "/api/tournaments" })
    await fastify.register(gameRoutes, { prefix: "/api/games" })
    await fastify.register(userRoutes, { prefix: "/api/users" })

    // Initialize Socket.IO services
    const io = fastify.io as Server<
      ClientToServerEvents,
      ServerToClientEvents,
      Record<string, never>,
      SocketData
    >

    const matchmakingService = new MatchmakingService(io)

    // Socket.IO connection handler
    io.on("connection", (socket: TypedSocket) => {
      console.log(`[Socket.IO] Client connected: ${socket.id}`)

      // Get session data from handshake
      const sessionData = socket.handshake.auth

      if (!sessionData.userId || !sessionData.userName) {
        console.log(
          `[Socket.IO] Unauthenticated connection attempt: ${socket.id}`,
        )
        socket.emit("error", { message: "Authentication required" })
        socket.disconnect()
        return
      }

      // Store user data in socket
      socket.data.userId = sessionData.userId
      socket.data.userName = sessionData.userName

      console.log(
        `[Socket.IO] Authenticated: ${sessionData.userName} (${sessionData.userId})`,
      )

      // Emit connected event
      socket.emit("connected", {
        userId: socket.data.userId,
        userName: socket.data.userName,
      })

      // Matchmaking events
      socket.on("joinQueue", () => {
        try {
          matchmakingService.addToQueue(socket)
        } catch (error) {
          console.error("[Socket.IO] Error joining queue:", error)
          socket.emit("error", { message: "Failed to join queue" })
        }
      })

      socket.on("leaveQueue", () => {
        try {
          matchmakingService.removeFromQueue(socket)
        } catch (error) {
          console.error("[Socket.IO] Error leaving queue:", error)
        }
      })

      // Game events
      socket.on("paddleMove", (data: { x: number }) => {
        try {
          const gameRoomManager = matchmakingService.gameRoomManager
          gameRoomManager.updatePaddle(socket.data.userId, data.x)
        } catch (error) {
          console.error("[Socket.IO] Error updating paddle:", error)
        }
      })

      socket.on("ready", () => {
        try {
          console.log(
            `[Socket.IO] Player ${socket.data.userName} (${socket.data.userId}) sent ready signal`,
          )
          const gameRoomManager = matchmakingService.gameRoomManager
          gameRoomManager.setPlayerReady(socket.data.userId)
        } catch (error) {
          console.error("[Socket.IO] Error setting player ready:", error)
        }
      })

      // Disconnect handler
      socket.on("disconnect", () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`)
        try {
          matchmakingService.removeFromQueue(socket)
          const gameRoomManager = matchmakingService.gameRoomManager
          gameRoomManager.handleDisconnect(socket.data.userId)
        } catch (error) {
          console.error("[Socket.IO] Error handling disconnect:", error)
        }
      })
    })

    // Periodic cleanup of disconnected players
    setInterval(() => {
      try {
        matchmakingService.cleanupQueue()
      } catch (error) {
        console.error("[Socket.IO] Error during queue cleanup:", error)
      }
    }, 30000) // Every 30 seconds

    // Start server
    const port = Number.parseInt(process.env.PORT || "3000", 10)
    await fastify.listen({ port, host: "0.0.0.0" })

    console.log(`🚀 Backend server running on port ${port}`)
    console.log(`📚 API Documentation: http://localhost:${port}/api`)
    console.log(`🎮 Socket.IO server ready for connections`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
