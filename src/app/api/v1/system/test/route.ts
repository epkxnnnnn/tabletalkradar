import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    hasPerplexity: !!process.env.PERPLEXITY_API_KEY,
    hasKimi: !!process.env.KIMI_API_KEY,
    hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasGemini: !!process.env.GOOGLE_GEMINI_API_KEY,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasResend: !!process.env.RESEND_API_KEY,
    hasTwilio: !!process.env.TWILIO_ACCOUNT_SID,
  }

  const missingKeys = Object.entries(envCheck)
    .filter(([_key, value]) => !value)
    .map(([key, _value]) => key)

  return NextResponse.json({
    status: missingKeys.length === 0 ? 'OK' : 'MISSING_ENV_VARS',
    envCheck,
    missingKeys,
    message: missingKeys.length === 0 
      ? 'All environment variables are set!' 
      : `Missing ${missingKeys.length} environment variables`
  })
}