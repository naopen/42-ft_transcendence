import { FastifyInstance } from "fastify"
import { z } from "zod"

import { optionalAuth, requireAuth } from "../middleware/auth.middleware"
import {
  schemas,
  validateBody,
  validateParams,
} from "../middleware/validation.middleware"
import { gameService } from "../services/game.service"

// Validation schemas
const createGameSchema = z.object({
  gameType: z.enum(["local", "online", "tournament"]),
  player1Id: z.number().int().positive().optional(),
  player2Id: z.number().int().positive().optional(),
})

const updateScoreSchema = z.object({
  player1Score: z.number().int().min(0),
  player2Score: z.number().int().min(0),
})

const completeGameSchema = z.object({
  player1Score: z.number().int().min(0),
  player2Score: z.number().int().min(0),
  duration: z.number().int().positive(),
})

export async function gameRoutes(fastify: FastifyInstance) {
  // Create a new game session
  fastify.post(
    "/",
    {
      preHandler: [optionalAuth, validateBody(createGameSchema)],
    },
    async (request, reply) => {
      const { gameType, player1Id, player2Id } = request.body as z.infer<
        typeof createGameSchema
      >

      const session = gameService.createGameSession(
        gameType,
        player1Id,
        player2Id,
      )

      return reply.status(201).send({
        message: "Game session created",
        session,
      })
    },
  )

  // Get game session by ID
  fastify.get(
    "/:id",
    {
      preHandler: [validateParams(schemas.id)],
    },
    async (request, _reply) => {
      const { id } = request.params as z.infer<typeof schemas.id>

      const session = gameService.getGameSessionWithPlayers(id)

      return {
        session,
      }
    },
  )

  // Update game score
  fastify.patch(
    "/:id/score",
    {
      preHandler: [validateParams(schemas.id), validateBody(updateScoreSchema)],
    },
    async (request, _reply) => {
      const { id } = request.params as z.infer<typeof schemas.id>
      const { player1Score, player2Score } = request.body as z.infer<
        typeof updateScoreSchema
      >

      gameService.updateScore(id, player1Score, player2Score)

      return {
        message: "Score updated successfully",
      }
    },
  )

  // Complete a game session
  fastify.post(
    "/:id/complete",
    {
      preHandler: [
        validateParams(schemas.id),
        validateBody(completeGameSchema),
      ],
    },
    async (request, _reply) => {
      const { id } = request.params as z.infer<typeof schemas.id>
      const { player1Score, player2Score, duration } = request.body as z.infer<
        typeof completeGameSchema
      >

      const session = gameService.completeGameSession(
        id,
        player1Score,
        player2Score,
        duration,
      )

      return {
        message: "Game completed successfully",
        session,
      }
    },
  )

  // Get recent games
  fastify.get("/recent", async (request, _reply) => {
    const { limit = "10" } = request.query as any
    const limitNum = parseInt(limit, 10)

    const games = gameService.getRecentGames(limitNum)

    return {
      games,
    }
  })

  // Get user game history (requires authentication)
  fastify.get(
    "/user/:userId/history",
    {
      preHandler: [
        requireAuth,
        validateParams(
          z.object({
            userId: z.string().regex(/^\d+$/).transform(Number),
          }),
        ),
      ],
    },
    async (request, _reply) => {
      const { userId } = request.params as { userId: number }
      const { page = "1", limit = "50" } = request.query as any

      const pageNum = parseInt(page, 10)
      const limitNum = parseInt(limit, 10)
      const offset = (pageNum - 1) * limitNum

      const history = gameService.getUserGameHistory(userId, limitNum, offset)

      return {
        history,
        pagination: {
          page: pageNum,
          limit: limitNum,
        },
      }
    },
  )

  // Get user statistics (requires authentication)
  fastify.get(
    "/user/:userId/stats",
    {
      preHandler: [
        requireAuth,
        validateParams(
          z.object({
            userId: z.string().regex(/^\d+$/).transform(Number),
          }),
        ),
      ],
    },
    async (request, _reply) => {
      const { userId } = request.params as { userId: number }

      const stats = gameService.getUserStats(userId)

      return {
        stats,
      }
    },
  )
}
