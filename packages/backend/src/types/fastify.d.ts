import "@fastify/oauth2"

declare module "fastify" {
  interface FastifyInstance {
    googleOAuth2: {
      getAccessTokenFromAuthorizationCodeFlow: (
        request: FastifyRequest,
      ) => Promise<{ token: { access_token: string } }>
    }
  }
}
