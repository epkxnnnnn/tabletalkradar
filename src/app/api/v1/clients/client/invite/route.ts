import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { client_id, email, role = 'owner' } = await request.json()

    if (!client_id || !email) {
      return NextResponse.json({ error: 'Client ID and email are required' }, { status: 400 })
    }

    // Verify the requesting user has permission to invite users for this client
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if client belongs to user's agency
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select(`
        id,
        business_name,
        agency_id
      `)
      .eq('id', client_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Verify the agency belongs to the user
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('owner_id')
      .eq('id', client.agency_id)
      .single()

    if (agencyError || !agency || agency.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to invite users for this client' }, { status: 403 })
    }

    // Check if user already exists in auth.users
    const { data: existingUser, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single()

    let inviteResult
    
    if (existingUser) {
      // User exists, create client_user record directly
      const { data: clientUser, error: clientUserError } = await supabase
        .from('client_users')
        .insert({
          user_id: existingUser.id,
          client_id,
          agency_id: client.agency_id,
          role,
          invited_by: user.id,
          is_active: true
        })
        .select()
        .single()

      if (clientUserError) {
        if (clientUserError.code === '23505') { // Unique constraint violation
          return NextResponse.json({ error: 'User already has access to this client' }, { status: 400 })
        }
        throw clientUserError
      }

      // Create default widgets
      await supabase.rpc('create_default_client_widgets', { p_client_id: client_id })

      inviteResult = {
        success: true,
        message: 'User access granted successfully',
        client_user_id: clientUser.id,
        existing_user: true
      }
    } else {
      // User doesn't exist, they need to sign up first
      // For now, we'll return instructions for manual signup
      inviteResult = {
        success: true,
        message: 'User needs to sign up first',
        signup_required: true,
        instructions: `Please ask ${email} to:
          1. Sign up at your application URL
          2. Use email: ${email}
          3. After signup, run this invite again`
      }
    }

    // TODO: Send invitation email here
    // You could integrate with your email service (SendGrid, etc.)

    return NextResponse.json(inviteResult)

  } catch (error) {
    console.error('Error inviting client user:', error)
    return NextResponse.json(
      { error: 'Failed to invite user' },
      { status: 500 }
    )
  }
}