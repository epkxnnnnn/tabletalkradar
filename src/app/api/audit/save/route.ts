import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          }
        },
      }
    )
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      business_name, 
      website, 
      category, 
      overall_score, 
      audit_data,
      client_id = null 
    } = body

    // Validate required fields
    if (!business_name || !category || !audit_data) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    // Save audit to database
    const { data, error } = await supabase
      .from('audits')
      .insert({
        client_id: client_id || user.id, // Use client_id if provided (for agencies), otherwise use user_id
        business_name,
        website: website || null,
        category,
        overall_score: overall_score || 0,
        audit_data,
        status: 'completed'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save audit' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      audit_id: data.id,
      message: 'Audit saved successfully' 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          }
        },
      }
    )
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('audits')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // If client_id is provided, filter by it (for agencies)
    if (clientId) {
      query = query.eq('client_id', clientId)
    } else {
      // For business owners, show their own audits
      query = query.eq('client_id', user.id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch audits' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      audits: data || [],
      count: data?.length || 0
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 