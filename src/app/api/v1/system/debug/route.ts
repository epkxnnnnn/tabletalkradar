import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const timestamp = new Date().toISOString()
  
  // Check environment variables
  const envVars = {
    hasPerplexity: !!process.env.PERPLEXITY_API_KEY,
    hasKimi: !!process.env.KIMI_API_KEY,
    hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasGemini: !!process.env.GOOGLE_GEMINI_API_KEY,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    hasResend: !!process.env.RESEND_API_KEY,
    hasTwilio: !!process.env.TWILIO_ACCOUNT_SID,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL,
  }

  // Test AI API keys format
  const aiApisStatus = {
    perplexity: process.env.PERPLEXITY_API_KEY?.startsWith('pplx-') ? 'key format valid' : 'key format invalid',
    kimi: process.env.KIMI_API_KEY?.startsWith('sk-') ? 'key format valid' : 'key format invalid',
    anthropic: process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-') ? 'key format valid' : 'key format invalid',
    openai: process.env.OPENAI_API_KEY?.startsWith('sk-') ? 'key format valid' : 'key format invalid',
    gemini: process.env.GOOGLE_GEMINI_API_KEY?.startsWith('AIza') ? 'key format valid' : 'key format invalid',
  }

  // Test Supabase connection
  let supabaseTest = { connected: false, hasAuditsTable: false }
  
  try {
    const { data, error } = await supabaseAdmin()
      .from('audits')
      .select('count')
      .limit(1)
    
    if (!error) {
      supabaseTest = { connected: true, hasAuditsTable: true }
    }
  } catch (err) {
    console.error('Supabase test error:', err)
  }

  return NextResponse.json({
    status: 'OK',
    timestamp,
    environment: process.env.NODE_ENV,
    envVars,
    supabaseTest,
    aiApisStatus,
    issues: [],
    instructions: null
  })
}