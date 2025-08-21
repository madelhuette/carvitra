import winston from 'winston'

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

// Custom format for better readability in development
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    return `${timestamp} [${level}]: ${message} ${metaStr}`
  })
)

// Production format - structured JSON
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Create the logger instance
const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: isProduction ? prodFormat : devFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      silent: process.env.DISABLE_LOGGING === 'true'
    })
  ],
  // Don't exit on handled exceptions
  exitOnError: false
})

// Create specialized loggers for different modules
export const createLogger = (module: string) => {
  return {
    debug: (message: string, meta?: any) => {
      if (isDevelopment) {
        logger.debug(`[${module}] ${message}`, meta)
      }
    },
    info: (message: string, meta?: any) => {
      logger.info(`[${module}] ${message}`, meta)
    },
    warn: (message: string, meta?: any) => {
      logger.warn(`[${module}] ${message}`, meta)
    },
    error: (message: string, error?: any) => {
      const errorMeta = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        ...error
      } : error
      
      logger.error(`[${module}] ${message}`, errorMeta)
    }
  }
}

// Default logger export
export default createLogger('app')