import { NextRequest, NextResponse } from 'next/server'
import { createSuperAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    // Basic security check - you might want to add more sophisticated checks
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    // Simple secret check - in production, use environment variables
    if (secret !== 'tabletalksuperadmin2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await createSuperAdmin()
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to create superadmin account', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Superadmin account created successfully',
      user: {
        id: result.user?.id,
        email: 'kphstk@gmail.com'
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 