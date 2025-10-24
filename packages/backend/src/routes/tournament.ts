import { FastifyInstance } from "fastify"
import { z } from "zod"

import { getUserId, optionalAuth } from "../middleware/auth.middleware"
import {
  schemas,
  validateBody,
  validateParams,
} from "../middleware/validation.middleware"
import { tournamentService } from "../services/tournament.service"

// Validation schemas
const createTournamentSchema = z.object({
  name: z.string().min(3).max(50),
  aliases: z.array(z.string().min(2).max(20)).min(3).max(16),
})

const completeMatchSchema = z.object({
  winnerId: z.number().int().positive(),
  gameSessionId: z.number().int().positive(),
})

export async function tournamentRoutes(fastify: FastifyInstance) {
  // Create a new tournament
  fastify.post(
    "/",
    {
      preHandler: [optionalAuth, validateBody(createTournamentSchema)],
    },
    async (request, reply) => {
      const { name, aliases } = request.body as z.infer<
        typeof createTournamentSchema
      >
      const userId = getUserId(request)

      const tournament = tournamentService.createTournament(
        name,
        aliases,
        userId,
      )

      return reply.status(201).send({
        message: "Tournament created successfully",
        tournament,
      })
    },
  )

  // Get all tournaments
  fastify.get("/", async (request, _reply) => {
    const { page = "1", limit = "50" } = request.query as any
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const offset = (pageNum - 1) * limitNum

    const tournaments = tournamentService.getAllTournaments(limitNum, offset)

    return {
      tournaments,
      pagination: {
        page: pageNum,
        limit: limitNum,
      },
    }
  })

  // Get tournament details
  fastify.get(
    "/:id",
    {
      preHandler: [validateParams(schemas.id)],
    },
    async (request, _reply) => {
      const { id } = request.params as z.infer<typeof schemas.id>

      const details = tournamentService.getTournamentDetails(id)

      return details
    },
  )

  // Start tournament
  fastify.post(
    "/:id/start",
    {
      preHandler: [validateParams(schemas.id)],
    },
    async (request, _reply) => {
      const { id } = request.params as z.infer<typeof schemas.id>

      tournamentService.startTournament(id)

      return {
        message: "Tournament started successfully",
      }
    },
  )

  // Get current match
  fastify.get(
    "/:id/current-match",
    {
      preHandler: [validateParams(schemas.id)],
    },
    async (request, reply) => {
      const { id } = request.params as z.infer<typeof schemas.id>

      const currentMatch = tournamentService.getCurrentMatch(id)

      if (!currentMatch) {
        return reply.status(404).send({
          error: "No pending matches found",
        })
      }

      return {
        match: currentMatch,
      }
    },
  )

  // Complete a match
  fastify.post(
    "/:id/matches/:matchId/complete",
    {
      preHandler: [
        validateParams(
          z.object({
            id: z.string().regex(/^\d+$/).transform(Number),
            matchId: z.string().regex(/^\d+$/).transform(Number),
          }),
        ),
        validateBody(completeMatchSchema),
      ],
    },
    async (request, _reply) => {
      const { matchId } = request.params as { matchId: number }
      const { winnerId, gameSessionId } = request.body as z.infer<
        typeof completeMatchSchema
      >

      tournamentService.completeMatch(matchId, winnerId, gameSessionId)

      return {
        message: "Match completed successfully",
      }
    },
  )

  // Get tournament participants
  fastify.get(
    "/:id/participants",
    {
      preHandler: [validateParams(schemas.id)],
    },
    async (request, _reply) => {
      const { id } = request.params as z.infer<typeof schemas.id>

      const participants = tournamentService.getTournamentParticipants(id)

      return {
        participants,
      }
    },
  )

  // Get tournament matches
  fastify.get(
    "/:id/matches",
    {
      preHandler: [validateParams(schemas.id)],
    },
    async (request, _reply) => {
      const { id } = request.params as z.infer<typeof schemas.id>

      const matches = tournamentService.getTournamentMatches(id)

      return {
        matches,
      }
    },
  )
}
