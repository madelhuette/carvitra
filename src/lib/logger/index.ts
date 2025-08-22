// Logger-Implementierung für Client und Server
// Winston kann nicht im Browser verwendet werden (benötigt Node.js fs-Modul)

const isDevelopment = process.env.NODE_ENV === 'development'

// Einfache Logger-Implementierung die sowohl Client als auch Server funktioniert
export const createLogger = (module: string) => {
  const formatMessage = (level: string, message: string, meta?: any) => {
    const timestamp = new Date().toISOString()
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] [${module}] ${message}${metaStr}`
  }

  // Nur in Development loggen, um Production-Konsole sauber zu halten
  const shouldLog = (level: string) => {
    if (level === 'error' || level === 'warn') return true
    return isDevelopment
  }

  return {
    debug: (message: string, meta?: any) => {
      if (shouldLog('debug')) {
        console.debug(formatMessage('debug', message, meta))
      }
    },
    info: (message: string, meta?: any) => {
      if (shouldLog('info')) {
        console.info(formatMessage('info', message, meta))
      }
    },
    warn: (message: string, meta?: any) => {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', message, meta))
      }
    },
    error: (message: string, error?: any) => {
      if (shouldLog('error')) {
        if (error instanceof Error) {
          console.error(formatMessage('error', message, {
            error: error.message,
            stack: error.stack,
          }))
        } else {
          console.error(formatMessage('error', message, error))
        }
      }
    },
  }
}

// Default logger export
export default createLogger('app')