import { FastifyReply, FastifyRequest } from "fastify"
import { ZodError, ZodType, ZodTypeDef, z } from "zod"

import { ValidationError } from "./error-handler"

export function validateBody<TOutput, TDef extends ZodTypeDef, TInput>(
  schema: ZodType<TOutput, TDef, TInput>,
) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      request.body = schema.parse(request.body)
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`,
        )
        throw new ValidationError(messages.join(", "))
      }
      throw error
    }
  }
}

export function validateQuery<TOutput, TDef extends ZodTypeDef, TInput>(
  schema: ZodType<TOutput, TDef, TInput>,
) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      request.query = schema.parse(request.query)
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`,
        )
        throw new ValidationError(messages.join(", "))
      }
      throw error
    }
  }
}

export function validateParams<TOutput, TDef extends ZodTypeDef, TInput>(
  schema: ZodType<TOutput, TDef, TInput>,
) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      request.params = schema.parse(request.params)
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`,
        )
        throw new ValidationError(messages.join(", "))
      }
      throw error
    }
  }
}

// Common validation schemas
export const schemas = {
  id: z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
  }),

  alias: z.object({
    alias: z.string().min(2).max(20).trim(),
  }),

  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
}
