// TableTalk Radar - Centralized API Handler with Error Management
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { ApiResponse } from '@/types'
import { validateWithSchema, createApiResponse } from '@/lib/validation'

// HTTP status codes enum
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

// Standard error types
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public errors: string[]) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(message, HttpStatus.UNAUTHORIZED, 'AUTH_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Insufficient permissions') {
    super(message, HttpStatus.FORBIDDEN, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, HttpStatus.NOT_FOUND, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

// API handler wrapper with error handling
export function withApiHandler<T = unknown>(
  handler: (req: NextRequest) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (req: NextRequest): Promise<NextResponse<ApiResponse<T | undefined>>> => {
    try {
      return await handler(req)
    } catch (error) {
      console.error('API Error:', error)
      
      if (error instanceof ApiError) {
        return NextResponse.json(
          createApiResponse(undefined, error.message),
          { status: error.statusCode }
        )
      }
      
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError(
          'Validation failed',
          error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        )
        return NextResponse.json(
          createApiResponse(undefined, validationError.message),
          { status: validationError.statusCode }
        )
      }
      
      // Generic error handling
      return NextResponse.json(
        createApiResponse(undefined, 'Internal server error'),
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      )
    }
  }
}

// Request validation middleware
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return function (
    handler: (req: NextRequest, data: T) => Promise<NextResponse<ApiResponse>>
  ) {
    return withApiHandler(async (req: NextRequest) => {
      let requestData: unknown
      
      if (req.method === 'GET') {
        const url = new URL(req.url)
        requestData = Object.fromEntries(url.searchParams.entries())
      } else {
        try {
          requestData = await req.json()
        } catch {
          throw new ValidationError('Invalid JSON payload', ['Body must be valid JSON'])
        }
      }
      
      const validation = validateWithSchema(schema, requestData)
      if (!validation.success) {
        throw new ValidationError('Request validation failed', validation.errors)
      }
      
      return handler(req, validation.data)
    })
  }
}

// Method validation
export function withMethods(allowedMethods: string[]) {
  return function (
    handler: (req: NextRequest) => Promise<NextResponse<ApiResponse>>
  ) {
    return withApiHandler(async (req: NextRequest) => {
      if (!allowedMethods.includes(req.method || '')) {
        throw new ApiError(
          `Method ${req.method} not allowed`,
          HttpStatus.METHOD_NOT_ALLOWED
        )
      }
      
      return handler(req)
    })
  }
}

// Success response helpers
export function successResponse<T>(
  data: T, 
  message?: string, 
  status = HttpStatus.OK
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    createApiResponse(data, undefined, message),
    { status }
  )
}

export function createdResponse<T>(
  data: T, 
  message?: string
): NextResponse<ApiResponse<T>> {
  return successResponse(data, message, HttpStatus.CREATED)
}

// Error response helpers
export function errorResponse(
  message: string, 
  status = HttpStatus.INTERNAL_SERVER_ERROR
): NextResponse<ApiResponse> {
  return NextResponse.json(
    createApiResponse(undefined, message),
    { status }
  )
}

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  return function (
    handler: (req: NextRequest) => Promise<NextResponse<ApiResponse>>
  ) {
    return withApiHandler(async (req: NextRequest) => {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      const now = Date.now()
      const windowStart = now - windowMs
      
      const existing = rateLimitMap.get(ip)
      if (!existing || existing.resetTime < windowStart) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
      } else {
        existing.count++
        if (existing.count > maxRequests) {
          throw new ApiError('Too many requests', 429)
        }
      }
      
      return handler(req)
    })
  }
}

// CORS helper
export function withCors(options: {
  origin?: string[]
  methods?: string[]
  headers?: string[]
} = {}) {
  const {
    origin = ['*'],
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization']
  } = options
  
  return function (
    handler: (req: NextRequest) => Promise<NextResponse<ApiResponse>>
  ) {
    return withApiHandler(async (req: NextRequest) => {
      const response = await handler(req)
      
      response.headers.set('Access-Control-Allow-Origin', origin.join(', '))
      response.headers.set('Access-Control-Allow-Methods', methods.join(', '))
      response.headers.set('Access-Control-Allow-Headers', headers.join(', '))
      
      return response
    })
  }
}

// Authentication helper (basic implementation)
export function withAuth() {
  return function (
    handler: (req: NextRequest) => Promise<NextResponse<ApiResponse>>
  ) {
    return withApiHandler(async (req: NextRequest) => {
      const authHeader = req.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        throw new AuthenticationError('Missing or invalid authorization header')
      }
      
      // TODO: Implement actual token validation with Supabase
      // const token = authHeader.slice(7)
      // const user = await validateToken(token)
      
      return handler(req)
    })
  }
}

// Combine multiple middlewares
export function compose(...middlewares: Array<(handler: any) => any>) {
  return middlewares.reduce((acc, middleware) => middleware(acc))
}