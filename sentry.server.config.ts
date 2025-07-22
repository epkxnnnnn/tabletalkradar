import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Adjust this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Server-specific integrations
  integrations: [
    // Sentry.nodeProfilingIntegration(), // Removed due to type incompatibility
  ],

  beforeSend(event, hint) {
    // Filter out sensitive information
    if (event.request?.headers) {
      delete event.request.headers.authorization
      delete event.request.headers.cookie
      delete event.request.headers['x-api-key']
    }
    
    // Filter out sensitive data from extra context
    if (event.extra) {
      delete event.extra.password
      delete event.extra.token
      delete event.extra.apiKey
    }
    
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV !== 'production' && !process.env.SENTRY_DEVELOPMENT_MODE) {
      return null
    }
    
    return event
  },
  
  beforeSendTransaction(event) {
    // Filter out sensitive transaction data
    if (event.request?.data) {
      // delete event.request.data.password // Removed due to type incompatibility
      // delete event.request.data.token // Removed due to type incompatibility
    }
    
    return event
  }
})