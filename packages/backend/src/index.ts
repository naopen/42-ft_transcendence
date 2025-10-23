import cookie from "@fastify/cookie"
import cors from "@fastify/cors"
import session from "@fastify/session"
import websocket from "@fastify/websocket"
import dotenv from "dotenv"
import Fastify from "fastify"

import { initDatabase } from "./config/database"
import { errorHandler } from "./middleware/error-handler"
import { authRoutes } from "./routes/auth"
import { gameRoutes } from "./routes/game"
import { tournamentRoutes } from "./routes/tournament"
import { userRoutes } from "./routes/user"

dotenv.config()

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
          ? ["https://your-frontend-url.onrender.com"]
          : ["http://localhost:8080", "http://localhost:5173"],
      credentials: true,
    })

    await fastify.register(cookie)

    await fastify.register(session, {
      secret: process.env.SESSION_SECRET || "change-this-secret",
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })

    await fastify.register(websocket)

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

    // Start server
    const port = parseInt(process.env.PORT || "3000", 10)
    await fastify.listen({ port, host: "0.0.0.0" })

    console.log(`🚀 Backend server running on port ${port}`)
    console.log(`📚 API Documentation: http://localhost:${port}/api`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
