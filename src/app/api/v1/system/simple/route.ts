import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'BusinessScope AI API is responding!',
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnyEnvVars: Object.keys(process.env).length > 0
    }
  })
}