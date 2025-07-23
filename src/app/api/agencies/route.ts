import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

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
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: agency, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('owner_id', session.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'No agency found' }, { status: 404 })
      }
      logger.error('Error fetching agency', { error, userId: session.user.id })
      return NextResponse.json({ error: 'Failed to fetch agency' }, { status: 500 })
    }

    return NextResponse.json({ agency })
  } catch (error) {
    logger.error('Unexpected error in GET /api/agencies', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, industry, location, business_type, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Agency name is required' }, { status: 400 })
    }

    // Check if user already has an agency
    const { data: existingAgency } = await supabase
      .from('agencies')
      .select('id')
      .eq('owner_id', session.user.id)
      .single()

    if (existingAgency) {
      return NextResponse.json({ error: 'User already has an agency' }, { status: 400 })
    }

    const { data: agency, error } = await supabase
      .from('agencies')
      .insert({
        name,
        industry: industry || null,
        location: location || null,
        business_type: business_type || null,
        description: description || null,
        owner_id: session.user.id
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating agency', { error, userId: session.user.id })
      return NextResponse.json({ error: 'Failed to create agency' }, { status: 500 })
    }

    logger.info('Agency created', { agencyId: agency.id, userId: session.user.id })
    return NextResponse.json({ agency })
  } catch (error) {
    logger.error('Unexpected error in POST /api/agencies', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}