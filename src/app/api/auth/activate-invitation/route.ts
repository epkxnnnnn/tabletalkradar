import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    // Get the current user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const tokenParts = authHeader.split(' ')
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return NextResponse.json(
        { error: 'Invalid authorization format' },
        { status: 401 }
      )
    }

    const accessToken = tokenParts[1]
    const { data: { user }, error: authError } = await supabaseAdmin().auth.getUser(accessToken)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Update the invitation to link it to the new user and activate it
    const { error: updateError } = await supabaseAdmin()
      .from('agency_memberships')
      .update({
        user_id: user.id,
        status: 'active',
        joined_at: new Date().toISOString()
      })
      .eq('invitation_token', token)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to activate invitation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error activating invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
