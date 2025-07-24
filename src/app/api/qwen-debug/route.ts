import { NextRequest, NextResponse } from 'next/server'
import { qwenAssistant, debugHelpers } from '@/lib/qwen-code-assistant'

export async function POST(request: NextRequest) {
  try {
    const { type, error, code, file, context } = await request.json()

    if (!type || !error) {
      return NextResponse.json(
        { error: 'Missing required fields: type, error' },
        { status: 400 }
      )
    }

    let response: string

    switch (type) {
      case 'auth':
        response = await debugHelpers.analyzeAuthError(error, code)
        break
      
      case 'supabase':
        response = await debugHelpers.fixSupabaseQuery(code || '', error)
        break
      
      case 'build':
        response = await debugHelpers.fixBuildError(error, context)
        break
      
      case 'typescript':
        if (!code || !file) {
          return NextResponse.json(
            { error: 'TypeScript debugging requires code and file parameters' },
            { status: 400 }
          )
        }
        response = await debugHelpers.fixTypeScriptError(error, code, file)
        break
      
      case 'component':
        if (!code || !file) {
          return NextResponse.json(
            { error: 'Component optimization requires code and file parameters' },
            { status: 400 }
          )
        }
        response = await debugHelpers.optimizeReactComponent(code, file)
        break
      
      case 'general':
        response = await qwenAssistant.analyzeError(error, context)
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: auth, supabase, build, typescript, component, general' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      solution: response,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Qwen debug error:', error)
    
    if (error.message.includes('not configured')) {
      return NextResponse.json(
        { 
          error: 'Qwen3 API not configured. Please set RUNPOD_ENDPOINT and RUNPOD_API_KEY environment variables.',
          configuration: {
            required_env_vars: ['RUNPOD_ENDPOINT', 'RUNPOD_API_KEY'],
            example_endpoint: 'https://your-runpod-id-8000.proxy.runpod.net/v1/chat/completions'
          }
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Qwen3 analysis failed', details: error.message },
      { status: 500 }
    )
  }
}

// Test endpoint to verify Qwen3 connection
export async function GET() {
  try {
    const testResponse = await qwenAssistant.analyzeError(
      'Test connection to Qwen3 coding assistant',
      'TableTalk Radar Next.js project setup verification'
    )

    return NextResponse.json({
      success: true,
      message: 'Qwen3 coding assistant is connected and ready',
      test_response: testResponse.substring(0, 200) + '...',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      configuration_needed: {
        env_vars: ['RUNPOD_ENDPOINT', 'RUNPOD_API_KEY'],
        endpoint_format: 'https://your-runpod-id-8000.proxy.runpod.net/v1/chat/completions'
      }
    }, { status: 500 })
  }
}