import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-client'

export async function GET() {
  const debug = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    
    // Check environment variables
    envVars: {
      // AI APIs
      hasPerplexity: !!process.env.PERPLEXITY_API_KEY,
      hasKimi: !!process.env.KIMI_API_KEY,
      hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasGemini: !!process.env.GOOGLE_GEMINI_API_KEY,
      
      // Supabase
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      
      // Communications
      hasResend: !!process.env.RESEND_API_KEY,
      hasTwilio: !!process.env.TWILIO_ACCOUNT_SID,
      
      // Auth
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL,
    },
    
    // Test Supabase connection
    supabaseTest: null as any,
    
    // Test AI APIs (simple check)
    aiApisStatus: {
      perplexity: 'pending',
      kimi: 'pending',
      anthropic: 'pending',
      openai: 'pending',
      gemini: 'pending'
    }
  }

  // Test Supabase connection
  try {
    const supabaseAdmin = createSupabaseAdmin()
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('audits')
        .select('count')
        .limit(1)
      
      debug.supabaseTest = {
        connected: !error,
        error: error?.message,
        hasAuditsTable: !error,
      }
    } else {
      debug.supabaseTest = {
        connected: false,
        error: 'Supabase client not initialized - check environment variables',
        hasAuditsTable: false
      }
    }
  } catch (error: any) {
    debug.supabaseTest = {
      connected: false,
      error: error.message,
      hasAuditsTable: false
    }
  }

  // Quick API key validation (check format only)
  if (process.env.PERPLEXITY_API_KEY?.startsWith('pplx-')) {
    debug.aiApisStatus.perplexity = 'key format valid'
  } else {
    debug.aiApisStatus.perplexity = 'invalid key format'
  }

  if (process.env.KIMI_API_KEY?.startsWith('sk-')) {
    debug.aiApisStatus.kimi = 'key format valid'
  } else {
    debug.aiApisStatus.kimi = 'invalid key format'
  }

  if (process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-')) {
    debug.aiApisStatus.anthropic = 'key format valid'
  } else {
    debug.aiApisStatus.anthropic = 'invalid key format'
  }

  if (process.env.OPENAI_API_KEY?.startsWith('sk-')) {
    debug.aiApisStatus.openai = 'key format valid'
  } else {
    debug.aiApisStatus.openai = 'invalid key format'
  }

  if (process.env.GOOGLE_GEMINI_API_KEY?.startsWith('AIza')) {
    debug.aiApisStatus.gemini = 'key format valid'
  } else {
    debug.aiApisStatus.gemini = 'invalid key format'
  }

  // Summary
  const missingEnvVars = Object.entries(debug.envVars)
    .filter(([key, value]) => key.startsWith('has') && !value)
    .map(([key]) => key.replace('has', ''))

  const issues = []
  if (missingEnvVars.length > 0) {
    issues.push(`Missing ${missingEnvVars.length} environment variables: ${missingEnvVars.join(', ')}`)
  }
  if (!debug.supabaseTest?.connected) {
    issues.push('Supabase connection failed')
  }

  return NextResponse.json({
    status: issues.length === 0 ? 'OK' : 'ISSUES_FOUND',
    issues,
    debug,
    
    // Instructions for fixing
    instructions: issues.length > 0 ? {
      message: 'To fix these issues:',
      steps: [
        '1. Go to Vercel Dashboard → Settings → Environment Variables',
        '2. Add all missing variables from your .env.local file',
        '3. Make sure variable names match exactly (NEXT_PUBLIC_ not EXPO_PUBLIC_)',
        '4. After adding variables, redeploy your application',
        '5. Check this endpoint again after deployment'
      ]
    } : null
  })
}