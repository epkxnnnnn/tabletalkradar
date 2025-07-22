interface Config {
  // Database
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceKey: string
  
  // Authentication
  authSecret: string
  
  // API Keys
  openaiApiKey: string
  anthropicApiKey: string
  googleApiKey: string
  geminiApiKey: string
  kimiApiKey: string
  
  // Security
  csrfSecret: string
  sessionSecret: string
  
  // Environment
  nodeEnv: string
  isProduction: boolean
  isDevelopment: boolean
}

function validateConfig(): Config {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'AUTH_SECRET',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'GOOGLE_API_KEY',
    'GEMINI_API_KEY',
    'KIMI_API_KEY',
    'CSRF_SECRET',
    'SESSION_SECRET'
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }

  return {
    // Database
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    
    // Authentication
    authSecret: process.env.AUTH_SECRET!,
    
    // API Keys
    openaiApiKey: process.env.OPENAI_API_KEY!,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    googleApiKey: process.env.GOOGLE_API_KEY!,
    geminiApiKey: process.env.GEMINI_API_KEY!,
    kimiApiKey: process.env.KIMI_API_KEY!,
    
    // Security
    csrfSecret: process.env.CSRF_SECRET!,
    sessionSecret: process.env.SESSION_SECRET!,
    
    // Environment
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development'
  }
}

export const config = validateConfig()

// Environment-specific configurations
export const envConfig = {
  development: {
    logLevel: 'debug',
    enableDebugTools: true,
    cacheEnabled: false,
    rateLimitEnabled: false
  },
  production: {
    logLevel: 'info',
    enableDebugTools: false,
    cacheEnabled: true,
    rateLimitEnabled: true
  },
  test: {
    logLevel: 'error',
    enableDebugTools: false,
    cacheEnabled: false,
    rateLimitEnabled: false
  }
} as const

export const currentEnvConfig = envConfig[config.nodeEnv as keyof typeof envConfig] || envConfig.development 