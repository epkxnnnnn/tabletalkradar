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

    const body = await request.json()
    const { businessName, website, address, phone, category, clientId } = body

    if (!businessName) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
    }

    // Simulate audit processing with progress updates
    // In a real implementation, this would call actual AI services
    logger.info('Starting audit', { businessName, userId: session.user.id })
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Mock audit results
    const mockAuditData = {
      sections: {
        online_presence: {
          score: 75,
          issues: ['Missing Google My Business optimization', 'Limited social media presence'],
          suggestions: ['Optimize Google My Business listing', 'Increase social media activity']
        },
        reviews_reputation: {
          score: 60,
          issues: ['Mixed review sentiment', 'Slow response to negative reviews'],
          suggestions: ['Implement review management system', 'Respond to all reviews promptly']
        },
        seo_performance: {
          score: 65,
          issues: ['Poor mobile optimization', 'Missing meta descriptions'],
          suggestions: ['Improve mobile responsiveness', 'Add meta descriptions to all pages']
        },
        content_marketing: {
          score: 55,
          issues: ['Outdated blog content', 'Inconsistent posting schedule'],
          suggestions: ['Create content calendar', 'Publish fresh content regularly']
        },
        competitor_analysis: {
          score: 70,
          comparison: 'Above average in local search, below average in social media',
          suggestions: ['Focus on social media growth', 'Maintain local search advantage']
        }
      },
      overall_score: Math.round((75 + 60 + 65 + 55 + 70) / 5),
      recommendations: {
        immediate: [
          'Set up Google My Business account',
          'Respond to recent negative reviews',
          'Fix mobile site issues'
        ],
        short_term: [
          'Implement review collection system',
          'Create social media content calendar',
          'Optimize website for search engines'
        ],
        long_term: [
          'Develop comprehensive content strategy',
          'Build local partnership network',
          'Monitor competitor activities monthly'
        ]
      },
      competitor_insights: [
        `${businessName} ranks #3 in local search results`,
        'Main competitors have stronger social media presence',
        'Opportunity to dominate review platforms'
      ]
    }

    // Save audit to database
    const { data: audit, error } = await supabase
      .from('audits')
      .insert({
        user_id: session.user.id,
        client_id: clientId || null,
        business_name: businessName,
        website: website || null,
        category: category || 'other',
        audit_data: mockAuditData,
        overall_score: mockAuditData.overall_score,
        status: 'completed'
      })
      .select()
      .single()

    if (error) {
      logger.error('Error saving audit', { error, userId: session.user.id })
      return NextResponse.json({ error: 'Failed to save audit' }, { status: 500 })
    }

    // Create action items from recommendations
    if (mockAuditData.recommendations?.immediate) {
      const actionItems = mockAuditData.recommendations.immediate.map((rec: string) => ({
        user_id: session.user.id,
        audit_id: audit.id,
        title: rec,
        description: `High priority action item from ${businessName} audit`,
        priority: 'high' as const,
        status: 'pending' as const,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      }))

      const { error: actionError } = await supabase
        .from('action_items')
        .insert(actionItems)

      if (actionError) {
        logger.error('Error creating action items', { error: actionError, auditId: audit.id })
      }
    }

    logger.info('Audit completed and saved', { 
      auditId: audit.id, 
      userId: session.user.id, 
      businessName,
      score: mockAuditData.overall_score 
    })

    return NextResponse.json({ 
      success: true, 
      audit: {
        id: audit.id,
        business_name: businessName,
        overall_score: mockAuditData.overall_score,
        audit_data: mockAuditData,
        created_at: audit.created_at
      }
    })
  } catch (error) {
    logger.error('Unexpected error in POST /api/audits/run-safe', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}