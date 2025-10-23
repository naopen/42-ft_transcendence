import "@fastify/oauth2"
import type { Server as SocketIOServer } from "socket.io"

declare module "fastify" {
  interface FastifyInstance {
    googleOAuth2: {
      getAccessTokenFromAuthorizationCodeFlow: (
        request: FastifyRequest,
      ) => Promise<{ token: { access_token: string } }>
    }
    io: SocketIOServer
  }
}
