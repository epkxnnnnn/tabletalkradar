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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    let query = supabase
      .from('audits')
      .select('*')
      .eq('user_id', session.user.id)

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data: audits, error } = await query.order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching audits', { error, userId: session.user.id })
      return NextResponse.json({ error: 'Failed to fetch audits' }, { status: 500 })
    }

    return NextResponse.json({ audits })
  } catch (error) {
    logger.error('Unexpected error in GET /api/audits', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { business_name, website, category, client_id, audit_data, overall_score } = body

    if (!business_name || !audit_data || overall_score === undefined) {
      return NextResponse.json(
        { error: 'Business name, audit data, and overall score are required' }, 
        { status: 400 }
      )
    }

    const { data: audit, error } = await supabase
      .from('audits')
      .insert({
        user_id: session.user.id,
        client_id: client_id || null,
        business_name,
        website: website || null,
        category: category || 'other',
        audit_data,
        overall_score: Math.round(overall_score),
        status: 'completed'
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating audit', { error, userId: session.user.id })
      return NextResponse.json({ error: 'Failed to create audit' }, { status: 500 })
    }

    // Create action items from audit recommendations
    if (audit_data.recommendations?.immediate) {
      const actionItems = audit_data.recommendations.immediate.map((rec: string) => ({
        user_id: session.user.id,
        audit_id: audit.id,
        title: rec,
        description: `Action item generated from audit recommendations`,
        priority: 'medium',
        status: 'pending',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      }))

      const { error: actionError } = await supabase
        .from('action_items')
        .insert(actionItems)

      if (actionError) {
        logger.error('Error creating action items', { error: actionError, auditId: audit.id })
      }
    }

    logger.info('Audit created', { auditId: audit.id, userId: session.user.id })
    return NextResponse.json({ audit })
  } catch (error) {
    logger.error('Unexpected error in POST /api/audits', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}