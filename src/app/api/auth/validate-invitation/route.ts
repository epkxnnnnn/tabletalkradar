import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { token, agencyName } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    const { data: invitation, error } = await supabaseAdmin()
      .from('agency_memberships')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'invited')
      .gt('invitation_expires_at', new Date().toISOString())
      .single()

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      invitation: {
        agencyName: agencyName || 'Unknown Agency',
        role: invitation.role
      }
    })
  } catch (error) {
    console.error('Error validating invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
