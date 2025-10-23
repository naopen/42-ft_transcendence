import oauth2 from "@fastify/oauth2"
import { FastifyInstance } from "fastify"

import { userService } from "../services/user.service"

export async function authRoutes(fastify: FastifyInstance) {
  // Register Google OAuth2
  await fastify.register(oauth2, {
    name: "googleOAuth2",
    scope: ["profile", "email"],
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID || "",
        secret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
      auth: oauth2.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: "/google",
    callbackUri: `${process.env.BACKEND_URL || "http://localhost:3000"}/api/auth/google/callback`,
  })

  // Google OAuth callback
  fastify.get("/google/callback", async (request, reply) => {
    try {
      request.log.info("🔵 [OAuth] Starting callback process")

      const { token } =
        await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
          request,
        )

      request.log.info("🔵 [OAuth] Access token obtained")

      // Get user info from Google
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to fetch user info from Google")
      }

      const googleUser = (await response.json()) as {
        id: string
        email: string
        name: string
        picture?: string
      }

      request.log.info(`🔵 [OAuth] User info fetched: ${googleUser.email}`)

      // Find or create user in database
      const user = userService.findOrCreate({
        googleId: googleUser.id,
        email: googleUser.email,
        displayName: googleUser.name,
        avatarUrl: googleUser.picture,
      })

      request.log.info(`🔵 [OAuth] User found/created: ${user.id}`)

      // Set session data
      request.session.userId = user.id
      request.session.googleId = user.google_id
      request.session.email = user.email
      request.session.displayName = user.display_name

      request.log.info("🔵 [OAuth] Session data set")
      request.log.info(`🔵 [OAuth] Session ID: ${request.session.sessionId}`)
      request.log.info(
        `🔵 [OAuth] Cookie settings: secure=${process.env.NODE_ENV === "production"}, sameSite=${process.env.NODE_ENV === "production" ? "none" : "lax"}`,
      )

      // Save session explicitly
      await new Promise<void>((resolve, reject) => {
        request.session.save((err) => {
          if (err) {
            request.log.error("🔴 [OAuth] Session save error:", err)
            reject(new Error(String(err)))
          } else {
            request.log.info("🟢 [OAuth] Session saved successfully")
            resolve()
          }
        })
      })

      // Redirect to frontend
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080"
      request.log.info(
        `🔵 [OAuth] Redirecting to: ${frontendUrl}/?auth=success`,
      )
      reply.redirect(`${frontendUrl}/?auth=success`)
    } catch (error) {
      request.log.error({ error }, "🔴 [OAuth] Callback error")
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080"
      reply.redirect(`${frontendUrl}/?auth=error`)
    }
  })

  // Get current user
  fastify.get("/me", async (request, reply) => {
    request.log.info("🔵 [Auth] /me endpoint called")
    request.log.info(`🔵 [Auth] Session ID: ${request.session.sessionId}`)
    request.log.info(`🔵 [Auth] User ID in session: ${request.session.userId}`)
    request.log.info(`🔵 [Auth] Cookies: ${JSON.stringify(request.cookies)}`)

    if (!request.session.userId) {
      request.log.warn("🟡 [Auth] No userId in session")
      return reply.status(401).send({
        error: "Not authenticated",
      })
    }

    try {
      const user = userService.getUserById(request.session.userId)
      request.log.info(`🟢 [Auth] User found: ${user.email}`)
      return {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
      }
    } catch (error) {
      request.log.error({ error }, "🔴 [Auth] Error fetching user")
      return reply.status(401).send({
        error: "Invalid session",
      })
    }
  })

  // Logout
  fastify.post("/logout", async (request, _reply) => {
    await request.session.destroy()
    return {
      message: "Logged out successfully",
    }
  })

  // Check authentication status
  fastify.get("/status", async (request, _reply) => {
    request.log.info("🔵 [Auth] /status endpoint called")
    request.log.info(`🔵 [Auth] Session ID: ${request.session.sessionId}`)
    request.log.info(`🔵 [Auth] User ID in session: ${request.session.userId}`)

    return {
      authenticated: !!request.session.userId,
      user: request.session.userId
        ? {
            id: request.session.userId,
            displayName: request.session.displayName,
          }
        : null,
      debug: {
        sessionId: request.session.sessionId,
        hasUserId: !!request.session.userId,
        cookies: Object.keys(request.cookies),
      },
    }
  })
}
