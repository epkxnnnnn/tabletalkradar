import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Adjust this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Capture unhandled promise rejections
  // captureUnhandledRejections: true, // Removed due to type incompatibility
  
  // Enable automatic error boundary wrapping
  integrations: [
    Sentry.browserTracingIntegration(),
    // Sentry.replayIntegration({
    //   // Capture 10% of all sessions, 100% of sessions with an error
    //   // sessionSampleRate: 0.1, // Removed due to type incompatibility
    //   errorSampleRate: 1.0,
    // }),
  ],

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
  },
  
  beforeSendTransaction(event) {
    // Sample performance monitoring more aggressively in development
    return event
  }
})