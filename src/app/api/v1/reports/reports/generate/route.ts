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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { audit_id, template_id, sections } = await request.json()

    if (!audit_id) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 })
    }

    // Get audit data
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('*')
      .eq('id', audit_id)
      .eq('user_id', session.user.id)
      .single()

    if (auditError || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    // Get template data if provided
    let template = null
    if (template_id) {
      const { data: templateData, error: templateError } = await supabase
        .from('report_templates')
        .select('*')
        .eq('id', template_id)
        .eq('user_id', session.user.id)
        .single()

      if (!templateError) {
        template = templateData
      }
    }

    // Get user profile for branding
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name')
      .eq('id', session.user.id)
      .single()

    // Generate report data
    const reportData = {
      audit,
      profile,
      sections: sections || template?.sections || ['executive_summary', 'audit_results', 'recommendations'],
      generated_at: new Date().toISOString(),
      branding: {
        company_name: profile?.company_name || 'BusinessScope AI',
        logo_url: null,
        color_scheme: 'red'
      }
    }

    // Create report record
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: session.user.id,
        audit_id: audit_id,
        template_id: template_id || null,
        business_name: audit.business_name,
        status: 'generated',
        report_data: reportData,
        download_url: null
      })
      .select()
      .single()

    if (reportError) {
      logger.error('Error creating report', { error: reportError, userId: session.user.id })
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
    }

    // Generate action items from audit recommendations
    const actionItems = generateActionItems(audit)
    
    if (actionItems.length > 0) {
      const actionItemInserts = actionItems.map(item => ({
        user_id: session.user.id,
        audit_id: audit_id,
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: item.status,
        due_date: item.due_date
      }))

      const { error: actionItemsError } = await supabase
        .from('action_items')
        .insert(actionItemInserts)

      if (actionItemsError) {
        logger.warn('Failed to create action items', { error: actionItemsError })
      }
    }

    logger.info('Report generated successfully', { 
      reportId: report.id, 
      auditId: audit_id, 
      userId: session.user.id 
    })

    return NextResponse.json({ 
      report,
      actionItems: actionItems.length
    })
  } catch (error) {
    logger.error('Unexpected error in POST /api/reports/generate', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const auditId = searchParams.get('audit_id')

    let query = supabase
      .from('reports')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (auditId) {
      query = query.eq('audit_id', auditId)
    }

    const { data: reports, error } = await query

    if (error) {
      logger.error('Error fetching reports', { error, userId: session.user.id })
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    return NextResponse.json({ reports })
  } catch (error) {
    logger.error('Unexpected error in GET /api/reports/generate', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateReportContent(audit: any, template: any) {
  // This is a simplified report generation
  // In a real implementation, you would use a PDF library like puppeteer or jsPDF
  
  const sections = template.sections || []
  const content: any = {
    business_name: audit.business_name,
    category: audit.category,
    overall_score: audit.overall_score,
    audit_date: audit.created_at,
    sections: {}
  }

  if (sections.includes('executive_summary')) {
    content.sections.executive_summary = {
      title: 'Executive Summary',
      content: `This audit for ${audit.business_name} reveals an overall performance score of ${audit.overall_score}/100. The business shows ${audit.overall_score >= 80 ? 'excellent' : audit.overall_score >= 60 ? 'good' : 'significant improvement opportunities'} in their digital presence.`
    }
  }

  if (sections.includes('audit_results')) {
    content.sections.audit_results = {
      title: 'Audit Results',
      content: audit.audit_data || {}
    }
  }

  if (sections.includes('recommendations')) {
    content.sections.recommendations = {
      title: 'Recommendations',
      content: audit.audit_data?.recommendations || {}
    }
  }

  if (sections.includes('action_items')) {
    content.sections.action_items = {
      title: 'Action Items',
      content: generateActionItems(audit)
    }
  }

  return content
}

interface ActionItem {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  due_date: string
  status: 'pending' | 'in_progress' | 'completed'
}

function generateActionItems(audit: any): ActionItem[] {
  const recommendations = audit.audit_data?.recommendations || {}
  const actionItems: ActionItem[] = []

  if (recommendations.immediate) {
    recommendations.immediate.forEach((rec: string, index: number) => {
      actionItems.push({
        id: `action-${index}`,
        title: `Immediate Action ${index + 1}`,
        description: rec,
        priority: 'high',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        status: 'pending'
      })
    })
  }

  if (recommendations.shortTerm) {
    recommendations.shortTerm.forEach((rec: string, index: number) => {
      actionItems.push({
        id: `action-short-${index}`,
        title: `Short-term Action ${index + 1}`,
        description: rec,
        priority: 'medium',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        status: 'pending'
      })
    })
  }

  return actionItems
} 