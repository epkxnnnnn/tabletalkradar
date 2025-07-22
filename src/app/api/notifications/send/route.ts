import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'
import NotificationService from '@/lib/notifications'

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json({ error: 'Type and data are required' }, { status: 400 })
    }

    // Get user profile and notification settings
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (settingsError) {
      logger.warn('No notification settings found for user', { userId: session.user.id })
    }

    let result
    
    switch (type) {
      case 'audit_complete':
        if (settings?.email_audit_complete !== false) {
          result = await NotificationService.sendAuditCompleteEmail({
            email: profile.email || session.user.email!,
            businessName: data.businessName,
            score: data.score,
            auditId: data.auditId
          })
        } else {
          result = { success: true, message: 'Notification disabled by user' }
        }
        break

      case 'weekly_report':
        if (settings?.email_weekly_reports !== false) {
          result = await NotificationService.sendWeeklyReport({
            email: profile.email || session.user.email!,
            fullName: profile.full_name || 'User',
            stats: data.stats
          })
        } else {
          result = { success: true, message: 'Notification disabled by user' }
        }
        break

      case 'critical_alert':
        if (settings?.sms_critical_alerts || settings?.email_audit_complete !== false) {
          result = await NotificationService.sendCriticalAlert({
            email: profile.email || session.user.email!,
            businessName: data.businessName,
            alertType: data.alertType,
            description: data.description,
            severity: data.severity || 'high'
          })
        } else {
          result = { success: true, message: 'Notification disabled by user' }
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    if (result.success) {
      logger.info('Notification sent successfully', { 
        type, 
        userId: session.user.id,
        message: (result as any).message 
      })
      return NextResponse.json({ success: true, message: (result as any).message })
    } else {
      logger.error('Failed to send notification', { 
        type, 
        userId: session.user.id,
        error: result.error 
      })
      return NextResponse.json({ 
        error: 'Failed to send notification',
        details: result.error 
      }, { status: 500 })
    }
  } catch (error) {
    logger.error('Unexpected error in POST /api/notifications/send', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}