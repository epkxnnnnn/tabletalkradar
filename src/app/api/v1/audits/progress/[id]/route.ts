import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

async function createSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

// Mock progress tracking (in production, this would be stored in Redis or similar)
const auditProgress = new Map<string, {
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  currentStep: string
  estimatedCompletion: string
  steps: Array<{
    name: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    duration?: number
  }>
}>()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const auditId = resolvedParams.id
    
    // Check if audit exists and belongs to user
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('id, status, created_at, business_name')
      .eq('id', auditId)
      .eq('user_id', session.user.id)
      .single()

    if (auditError || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    // Get progress from mock storage or generate based on audit status
    let progress = auditProgress.get(auditId)
    
    if (!progress) {
      // Generate mock progress based on audit status
      const createdAt = new Date(audit.created_at)
      const now = new Date()
      const elapsed = now.getTime() - createdAt.getTime()
      
      if (audit.status === 'completed') {
        progress = {
          status: 'completed',
          progress: 100,
          currentStep: 'Audit completed',
          estimatedCompletion: audit.created_at,
          steps: [
            { name: 'Analyzing online presence', status: 'completed', duration: 30 },
            { name: 'Checking reviews & reputation', status: 'completed', duration: 45 },
            { name: 'SEO performance audit', status: 'completed', duration: 60 },
            { name: 'Content analysis', status: 'completed', duration: 40 },
            { name: 'Competitor research', status: 'completed', duration: 50 },
            { name: 'Generating recommendations', status: 'completed', duration: 25 }
          ]
        }
      } else if (elapsed < 30000) { // Less than 30 seconds
        const progressPercent = Math.min(95, (elapsed / 30000) * 100)
        progress = {
          status: 'processing',
          progress: progressPercent,
          currentStep: 'Analyzing business data...',
          estimatedCompletion: new Date(createdAt.getTime() + 30000).toISOString(),
          steps: [
            { name: 'Analyzing online presence', status: progressPercent > 20 ? 'completed' : 'processing' },
            { name: 'Checking reviews & reputation', status: progressPercent > 40 ? 'completed' : progressPercent > 20 ? 'processing' : 'pending' },
            { name: 'SEO performance audit', status: progressPercent > 60 ? 'completed' : progressPercent > 40 ? 'processing' : 'pending' },
            { name: 'Content analysis', status: progressPercent > 75 ? 'completed' : progressPercent > 60 ? 'processing' : 'pending' },
            { name: 'Competitor research', status: progressPercent > 90 ? 'completed' : progressPercent > 75 ? 'processing' : 'pending' },
            { name: 'Generating recommendations', status: progressPercent > 95 ? 'processing' : 'pending' }
          ]
        }
      } else {
        progress = {
          status: 'queued',
          progress: 0,
          currentStep: 'Queued for processing',
          estimatedCompletion: new Date(Date.now() + 180000).toISOString(), // 3 minutes
          steps: [
            { name: 'Analyzing online presence', status: 'pending' },
            { name: 'Checking reviews & reputation', status: 'pending' },
            { name: 'SEO performance audit', status: 'pending' },
            { name: 'Content analysis', status: 'pending' },
            { name: 'Competitor research', status: 'pending' },
            { name: 'Generating recommendations', status: 'pending' }
          ]
        }
      }
    }

    return NextResponse.json({
      audit_id: auditId,
      business_name: audit.business_name,
      ...progress
    })
  } catch (error) {
    logger.error('Unexpected error in GET /api/audits/progress/[id]', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, progress, currentStep, steps } = body
    const resolvedParams = await params
    const auditId = resolvedParams.id

    // Validate progress data
    if (progress < 0 || progress > 100) {
      return NextResponse.json({ error: 'Progress must be between 0 and 100' }, { status: 400 })
    }

    // Update progress in mock storage
    auditProgress.set(auditId, {
      status: status || 'processing',
      progress: progress || 0,
      currentStep: currentStep || 'Processing...',
      estimatedCompletion: new Date(Date.now() + 60000).toISOString(),
      steps: steps || []
    })

    logger.info('Audit progress updated', { 
      auditId, 
      progress, 
      status, 
      userId: session.user.id 
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Unexpected error in POST /api/audits/progress/[id]', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}