import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Lower sample rate for edge functions due to cold starts
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  
  beforeSend(event, hint) {
    // Filter out sensitive information
    if (event.request?.headers) {
      delete event.request.headers.authorization
      delete event.request.headers.cookie
    }
    
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV !== 'production' && !process.env.SENTRY_DEVELOPMENT_MODE) {
      return null
    }
    
    return event
  }
})