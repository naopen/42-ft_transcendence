import { FastifyError, FastifyReply, FastifyRequest } from "fastify"

export interface AppError extends Error {
  statusCode?: number
  code?: string
}

export class ValidationError extends Error implements AppError {
  statusCode = 400
  code = "VALIDATION_ERROR"

  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

export class AuthenticationError extends Error implements AppError {
  statusCode = 401
  code = "AUTHENTICATION_ERROR"

  constructor(message = "Authentication required") {
    super(message)
    this.name = "AuthenticationError"
  }
}

export class AuthorizationError extends Error implements AppError {
  statusCode = 403
  code = "AUTHORIZATION_ERROR"

  constructor(message = "Access denied") {
    super(message)
    this.name = "AuthorizationError"
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404
  code = "NOT_FOUND"

  constructor(message = "Resource not found") {
    super(message)
    this.name = "NotFoundError"
  }
}

export class ConflictError extends Error implements AppError {
  statusCode = 409
  code = "CONFLICT"

  constructor(message = "Resource conflict") {
    super(message)
    this.name = "ConflictError"
  }
}

export async function errorHandler(
  error: FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const statusCode = (error as AppError).statusCode || 500
  const code = (error as AppError).code || "INTERNAL_SERVER_ERROR"
  const isProduction = process.env.NODE_ENV === "production"

  // Log error for debugging (always log full details server-side)
  if (statusCode >= 500) {
    request.log.error({
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
    })
  } else {
    request.log.warn({
      error: error.message,
      url: request.url,
      method: request.method,
    })
  }

  // Prepare error response
  const errorResponse: {
    error: {
      code: string
      message: string
      statusCode: number
      stack?: string
    }
  } = {
    error: {
      code,
      // In production, hide internal error details for 500 errors
      message:
        isProduction && statusCode >= 500
          ? "Internal server error"
          : error.message,
      statusCode,
    },
  }

  // Only include stack trace in development mode
  if (!isProduction && error.stack) {
    errorResponse.error.stack = error.stack
  }

  // Send error response
  reply.status(statusCode).send(errorResponse)
}
