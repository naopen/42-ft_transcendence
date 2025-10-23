import { FastifyReply, FastifyRequest } from "fastify"

import { AuthenticationError } from "./error-handler"

declare module "fastify" {
  interface Session {
    userId?: number
    googleId?: string
    email?: string
    displayName?: string
  }
}

export async function requireAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
) {
  if (!request.session.userId) {
    throw new AuthenticationError("Please sign in to access this resource")
  }
}

export async function optionalAuth(
  _request: FastifyRequest,
  _reply: FastifyReply,
) {
  // Just checks if user is authenticated without throwing error
  // Can be used for routes that work both with and without auth
}
