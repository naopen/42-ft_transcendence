import { FastifyInstance } from "fastify"
import { z } from "zod"

import { schemas, validateParams } from "../middleware/validation.middleware"
import { userService } from "../services/user.service"

export async function userRoutes(fastify: FastifyInstance) {
  // Get user public profile
  fastify.get(
    "/:id",
    {
      preHandler: [validateParams(schemas.id)],
    },
    async (request, _reply) => {
      const { id } = request.params as z.infer<typeof schemas.id>

      const profile = userService.getPublicProfile(id)

      return {
        user: profile,
      }
    },
  )

  // Search users
  fastify.get("/search", async (request, reply) => {
    const { q, limit = "10" } = request.query as any

    if (!q || typeof q !== "string") {
      return reply.status(400).send({
        error: 'Query parameter "q" is required',
      })
    }

    const limitNum = parseInt(limit, 10)
    const users = userService.searchUsers(q, limitNum)

    return {
      users,
    }
  })

  // Get all users (for testing/admin)
  fastify.get("/", async (request, _reply) => {
    const { page = "1", limit = "50" } = request.query as any
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const offset = (pageNum - 1) * limitNum

    const users = userService.getAllUsers(limitNum, offset)

    // Remove sensitive data
    const publicUsers = users.map((user) => ({
      id: user.id,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    }))

    return {
      users: publicUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
      },
    }
  })
}
