import { createLogger } from '@/lib/logger'

const logger = createLogger('ErrorHandler')

// Base error class with additional context
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, any>

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context

    Object.setPrototypeOf(this, AppError.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, true, context)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', context?: Record<string, any>) {
    super(message, 401, true, context)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', context?: Record<string, any>) {
    super(message, 403, true, context)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, context?: Record<string, any>) {
    super(`${resource} not found`, 404, true, context)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 409, true, context)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', context?: Record<string, any>) {
    super(message, 429, true, context)
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: any) {
    super(
      `External service error: ${service}`,
      503,
      true,
      { service, originalError: originalError?.message || originalError }
    )
  }
}

// Error handler for API routes
export function handleApiError(error: unknown): {
  status: number
  message: string
  details?: any
} {
  // Log the error
  if (error instanceof AppError) {
    if (error.isOperational) {
      logger.warn('Operational error', {
        message: error.message,
        statusCode: error.statusCode,
        context: error.context
      })
    } else {
      logger.error('Non-operational error', error)
    }

    return {
      status: error.statusCode,
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.context : undefined
    }
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    logger.warn('Validation error', { error })
    return {
      status: 400,
      message: 'Validation failed',
      details: (error as any).issues
    }
  }

  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as any
    logger.error('Supabase error', {
      code: supabaseError.code,
      message: supabaseError.message,
      details: supabaseError.details
    })

    // Map common Supabase error codes
    switch (supabaseError.code) {
      case '23505': // Unique violation
        return {
          status: 409,
          message: 'Resource already exists',
          details: process.env.NODE_ENV === 'development' ? supabaseError.details : undefined
        }
      case '23503': // Foreign key violation
        return {
          status: 400,
          message: 'Invalid reference',
          details: process.env.NODE_ENV === 'development' ? supabaseError.details : undefined
        }
      case '42501': // Insufficient privilege
        return {
          status: 403,
          message: 'Insufficient permissions',
          details: process.env.NODE_ENV === 'development' ? supabaseError.details : undefined
        }
      default:
        return {
          status: 500,
          message: 'Database error',
          details: process.env.NODE_ENV === 'development' ? supabaseError : undefined
        }
    }
  }

  // Handle unknown errors
  logger.error('Unknown error', error)
  return {
    status: 500,
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error : undefined
  }
}

// Async error wrapper for API routes
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      const errorResponse = handleApiError(error)
      
      // Return NextResponse
      const { NextResponse } = await import('next/server')
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.status }
      )
    }
  }) as T
}

// Client-side error handler
export function handleClientError(error: unknown, fallbackMessage: string = 'Ein Fehler ist aufgetreten'): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof Error) {
    logger.error('Client error', { 
      message: error.message,
      stack: error.stack 
    })
    return process.env.NODE_ENV === 'development' ? error.message : fallbackMessage
  }

  logger.error('Unknown client error', error)
  return fallbackMessage
}

// React Query error handler
export function handleQueryError(error: unknown): void {
  const message = handleClientError(error)
  
  // You can integrate with your notification system here
  // For example: showNotification({ type: 'error', message })
  
  logger.error('Query error', { error, message })
}