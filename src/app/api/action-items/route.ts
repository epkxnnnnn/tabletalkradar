import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

async function getUserRole(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  return profile?.role || 'user'
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          }
        },
      }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userRole = await getUserRole(supabase, user.id)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    let query = supabase.from('action_items').select('*')
    if (userRole !== 'superadmin') {
      query = query.eq('user_id', user.id)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }
    const { data: actionItems, error } = await query.order('created_at', { ascending: false })
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch action items' }, { status: 500 })
    }
    return NextResponse.json({ actionItems })
  } catch (error) {
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
    const { audit_id, title, description, priority, due_date } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const { data: actionItem, error } = await supabase
      .from('action_items')
      .insert({
        user_id: session.user.id,
        audit_id: audit_id || null,
        title,
        description: description || '',
        priority: priority || 'medium',
        status: 'pending',
        due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating action item', { error, userId: session.user.id })
      return NextResponse.json({ error: 'Failed to create action item' }, { status: 500 })
    }

    logger.info('Action item created', { actionItemId: actionItem.id, userId: session.user.id })
    return NextResponse.json({ actionItem })
  } catch (error) {
    logger.error('Unexpected error in POST /api/action-items', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}