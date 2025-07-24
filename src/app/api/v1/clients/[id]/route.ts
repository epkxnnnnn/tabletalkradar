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
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      logger.error('Error fetching client', { error, clientId: resolvedParams.id, userId: session.user.id })
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    logger.error('Unexpected error in GET /api/clients/[id]', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
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
    const { business_name, website, contact_email, contact_phone, category, notes } = body

    if (!business_name) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
    }

    const resolvedParams = await params
    const { data: client, error } = await supabase
      .from('clients')
      .update({
        business_name,
        website: website || null,
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        category: category || 'other',
        notes: notes || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating client', { error, clientId: resolvedParams.id, userId: session.user.id })
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }

    logger.info('Client updated', { clientId: resolvedParams.id, userId: session.user.id })
    return NextResponse.json({ client })
  } catch (error) {
    logger.error('Unexpected error in PUT /api/clients/[id]', { error })
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
    // First check if client exists and belongs to user
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', resolvedParams.id)
      .eq('user_id', session.user.id)
      .single()

    if (checkError || !existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Delete associated audits first
    const { error: auditDeleteError } = await supabase
      .from('audits')
      .delete()
      .eq('client_id', resolvedParams.id)

    if (auditDeleteError) {
      logger.error('Error deleting associated audits', { error: auditDeleteError, clientId: resolvedParams.id })
    }

    // Delete the client
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('user_id', session.user.id)

    if (error) {
      logger.error('Error deleting client', { error, clientId: resolvedParams.id, userId: session.user.id })
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }

    logger.info('Client deleted', { clientId: resolvedParams.id, userId: session.user.id })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Unexpected error in DELETE /api/clients/[id]', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}