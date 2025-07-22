interface LogLevel {
  ERROR: 'error'
  WARN: 'warn'
  INFO: 'info'
  DEBUG: 'debug'
}

interface LogEntry {
  timestamp: string
  level: string
  message: string
  context?: Record<string, any>
  userId?: string
  sessionId?: string
  requestId?: string
  error?: Error
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logLevel: keyof LogLevel = this.isDevelopment ? 'DEBUG' : 'INFO'

  private log(level: string, message: string, context?: Record<string, any>, error?: Error) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    }

    // In development, log to console
    if (this.isDevelopment) {
      const color = this.getLogColor(level)
      console.log(`%c[${level}] ${message}`, `color: ${color}`, context || '')
      if (error) {
        console.error(error)
      }
    }

    // In production, send to external logging service
    if (!this.isDevelopment) {
      this.sendToLoggingService(logEntry)
    }
  }

  private getLogColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'error': return '#ff0000'
      case 'warn': return '#ffa500'
      case 'info': return '#0000ff'
      case 'debug': return '#808080'
      default: return '#000000'
    }
  }

  private async sendToLoggingService(logEntry: LogEntry) {
    try {
      // Send to external logging service (e.g., Sentry, LogRocket, etc.)
      if (process.env.LOGGING_ENDPOINT) {
        await fetch(process.env.LOGGING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LOGGING_API_KEY}`
          },
          body: JSON.stringify(logEntry)
        })
      }
    } catch (error) {
      // Fallback to console if logging service fails
      console.error('Failed to send log to external service:', error)
    }
  }

  error(message: string, context?: Record<string, any>, error?: Error) {
    this.log('ERROR', message, context, error)
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('WARN', message, context)
  }

  info(message: string, context?: Record<string, any>) {
    this.log('INFO', message, context)
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      this.log('DEBUG', message, context)
    }
  }

  // Performance monitoring
  time(label: string) {
    if (this.isDevelopment) {
      console.time(label)
    }
  }

  timeEnd(label: string) {
    if (this.isDevelopment) {
      console.timeEnd(label)
    }
  }
}

export const logger = new Logger() 