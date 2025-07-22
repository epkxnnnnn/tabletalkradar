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

export async function PUT(
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
    const { title, description, priority, status, due_date } = body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (priority !== undefined) updateData.priority = priority
    if (status !== undefined) updateData.status = status
    if (due_date !== undefined) updateData.due_date = due_date

    const resolvedParams = await params
    const { data: actionItem, error } = await supabase
      .from('action_items')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating action item', { error, actionItemId: resolvedParams.id, userId: session.user.id })
      return NextResponse.json({ error: 'Failed to update action item' }, { status: 500 })
    }

    logger.info('Action item updated', { actionItemId: resolvedParams.id, userId: session.user.id })
    return NextResponse.json({ actionItem })
  } catch (error) {
    logger.error('Unexpected error in PUT /api/action-items/[id]', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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
    const { error } = await supabase
      .from('action_items')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('user_id', session.user.id)

    if (error) {
      logger.error('Error deleting action item', { error, actionItemId: resolvedParams.id, userId: session.user.id })
      return NextResponse.json({ error: 'Failed to delete action item' }, { status: 500 })
    }

    logger.info('Action item deleted', { actionItemId: resolvedParams.id, userId: session.user.id })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Unexpected error in DELETE /api/action-items/[id]', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}