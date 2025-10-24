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

/**
 * Get user ID from either JWT token or session
 */
export function getUserId(request: FastifyRequest): number | undefined {
  // Try JWT authentication first (for cross-domain)
  const authHeader = request.headers.authorization
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7)
      const decoded = request.server.jwt.verify<{ userId: number }>(token)
      return decoded.userId
    } catch {
      // JWT invalid, try session auth
    }
  }

  // Fallback to session authentication (for same-domain)
  return request.session.userId
}

export async function requireAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
) {
  const userId = getUserId(request)
  if (!userId) {
    throw new AuthenticationError("Please sign in to access this resource")
  }

  // Store userId in session for compatibility with existing code
  // This ensures that request.session.userId is available even when using JWT
  if (!request.session.userId && userId) {
    request.session.userId = userId
  }
}

export async function optionalAuth(
  _request: FastifyRequest,
  _reply: FastifyReply,
) {
  // Just checks if user is authenticated without throwing error
  // Can be used for routes that work both with and without auth
}
