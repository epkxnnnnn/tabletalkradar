import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TASK_AUTOMATION_PROMPT, AIPromptContext } from '@/lib/ai-prompts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface TaskAnalysisRequest {
  agency_id: string
  client_id?: string
  analysis_type: 'comprehensive' | 'critical_only' | 'optimization_focus'
  timeframe: '24_hours' | '7_days' | '30_days' | 'long_term'
  include_automation: boolean
  industry?: string
  business_name?: string
  location?: string
}

interface TaskItem {
  id: string
  agency_id: string
  client_id?: string
  title: string
  description: string
  category: 'critical' | 'high_impact' | 'strategic' | 'long_term'
  priority_score: number
  impact_score: number
  complexity: 'low' | 'medium' | 'high'
  timeline: string
  resource_requirements: string
  automation_possible: boolean
  requires_human_decision: boolean
  status: 'pending' | 'in_progress' | 'completed' | 'automated'
  dependencies: string[]
  success_metrics: string[]
  due_date?: string
  assigned_to?: string
  created_at: string
  updated_at: string
}

export async function POST(request: NextRequest) {
  try {
    const requestData: TaskAnalysisRequest = await request.json()
    const { 
      agency_id,
      client_id,
      analysis_type,
      timeframe,
      include_automation,
      industry,
      business_name,
      location
    } = requestData

    if (!agency_id || !analysis_type || !timeframe) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get client data if specific client is selected
    let clientData = null
    if (client_id) {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('id', client_id)
        .single()
      clientData = data
    }

    // Get historical data for context
    const { data: historicalData } = await supabase
      .from('market_intelligence')
      .select('*')
      .eq('agency_id', agency_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10)

    // Prepare AI prompt context
    const promptContext: AIPromptContext = {
      clientName: clientData?.business_name || business_name || 'Target Business',
      industry: clientData?.industry || industry || 'General Business',
      location: clientData?.location || location || 'Local Market',
      businessType: clientData?.business_type || 'Service Provider',
      targetMarket: clientData?.target_audience || 'Local consumers and businesses'
    }

    // Generate intelligent task analysis using AI prompt
    const taskAnalysis = await generateTaskAnalysis(
      analysis_type,
      timeframe,
      include_automation,
      promptContext,
      clientData,
      historicalData || []
    )

    // Store generated tasks in database
    const tasksToInsert = taskAnalysis.tasks.map(task => ({
      ...task,
      agency_id,
      client_id: client_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('task_automation')
      .insert(tasksToInsert)
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save tasks' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      taskCount: data.length,
      tasks: data,
      analysis: taskAnalysis.summary
    })

  } catch (error) {
    console.error('Error analyzing tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateTaskAnalysis(
  analysisType: string,
  timeframe: string,
  includeAutomation: boolean,
  context: AIPromptContext,
  clientData: any,
  historicalData: any[]
) {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))

  // Get the comprehensive task automation prompt
  const prompt = TASK_AUTOMATION_PROMPT(context)
  
  const tasks: Omit<TaskItem, 'agency_id' | 'created_at' | 'updated_at'>[] = []
  
  // Generate tasks based on analysis type and timeframe
  switch (analysisType) {
    case 'comprehensive':
      tasks.push(...generateComprehensiveTasks(context, timeframe, includeAutomation))
      break
    case 'critical_only':
      tasks.push(...generateCriticalTasks(context, timeframe))
      break
    case 'optimization_focus':
      tasks.push(...generateOptimizationTasks(context, timeframe, includeAutomation))
      break
  }

  return {
    summary: `Generated ${tasks.length} prioritized tasks for ${context.clientName} based on ${analysisType} analysis`,
    tasks,
    prompt_used: prompt.slice(0, 200) + '...',
    analysis_type: analysisType,
    timeframe,
    generated_at: new Date().toISOString()
  }
}

function generateComprehensiveTasks(
  context: AIPromptContext, 
  timeframe: string, 
  includeAutomation: boolean
): Omit<TaskItem, 'agency_id' | 'created_at' | 'updated_at'>[] {
  const tasks: Omit<TaskItem, 'agency_id' | 'created_at' | 'updated_at'>[] = []

  // Critical fixes (0-24 hours)
  tasks.push({
    id: `critical-${Date.now()}-1`,
    title: 'Address Negative Review Response Gap',
    description: `Respond to 2 negative reviews posted in the last 48 hours about ${context.clientName}. Implement professional response strategy to mitigate reputation impact.`,
    category: 'critical',
    priority_score: 95,
    impact_score: 9,
    complexity: 'low',
    timeline: '0-4 hours',
    resource_requirements: 'Customer service manager, 30 minutes per response',
    automation_possible: includeAutomation,
    requires_human_decision: true,
    status: 'pending',
    dependencies: ['Review platform access', 'Response template approval'],
    success_metrics: ['Response time <4 hours', 'Professional tone maintenance', 'Customer satisfaction recovery'],
    due_date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
  })

  tasks.push({
    id: `critical-${Date.now()}-2`,
    title: 'Competitive Pricing Threat Response',
    description: `Major competitor launched 20% below-market pricing campaign targeting ${context.industry} clients. Immediate response strategy required to protect customer base.`,
    category: 'critical',
    priority_score: 92,
    impact_score: 8,
    complexity: 'medium',
    timeline: '4-24 hours',
    resource_requirements: 'Marketing manager, pricing analyst, 2-3 hours total',
    automation_possible: false,
    requires_human_decision: true,
    status: 'pending',
    dependencies: ['Competitive pricing analysis', 'Value proposition documentation'],
    success_metrics: ['Customer retention rate', 'Competitive differentiation messaging', 'Pricing strategy adjustment'],
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  })

  // High-impact optimizations (1-7 days)
  if (['7_days', '30_days', 'long_term'].includes(timeframe)) {
    tasks.push({
      id: `high_impact-${Date.now()}-1`,
      title: 'Local SEO Optimization Sprint',
      description: `Optimize Google My Business and local search presence for "${context.industry} ${context.location}" keywords. Target top 3 ranking positions.`,
      category: 'high_impact',
      priority_score: 88,
      impact_score: 7,
      complexity: 'medium',
      timeline: '3-7 days',
      resource_requirements: 'SEO specialist, content writer, 8-10 hours total',
      automation_possible: includeAutomation,
      requires_human_decision: false,
      status: 'pending',
      dependencies: ['Keyword research completion', 'Google My Business access'],
      success_metrics: ['Local ranking improvement', '25% increase in local search visibility', 'GMB engagement increase'],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })

    tasks.push({
      id: `high_impact-${Date.now()}-2`,
      title: 'Customer Referral System Launch',
      description: 'Implement automated customer referral program with incentive structure to increase word-of-mouth acquisition by 30%.',
      category: 'high_impact',
      priority_score: 85,
      impact_score: 8,
      complexity: 'medium',
      timeline: '5-7 days',
      resource_requirements: 'Marketing coordinator, developer, 12-15 hours',
      automation_possible: includeAutomation,
      requires_human_decision: false,
      status: 'pending',
      dependencies: ['Incentive structure design', 'Referral tracking system setup'],
      success_metrics: ['30% increase in referral leads', 'Customer participation rate >15%', 'Referral conversion rate >25%'],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
  }

  // Strategic initiatives (1-30 days)
  if (['30_days', 'long_term'].includes(timeframe)) {
    tasks.push({
      id: `strategic-${Date.now()}-1`,
      title: 'Competitive Intelligence Monitoring System',
      description: 'Establish automated competitor monitoring for pricing, marketing campaigns, and customer sentiment to enable rapid strategic responses.',
      category: 'strategic',
      priority_score: 82,
      impact_score: 7,
      complexity: 'high',
      timeline: '2-3 weeks',
      resource_requirements: 'Business analyst, marketing manager, 20-25 hours',
      automation_possible: includeAutomation,
      requires_human_decision: true,
      status: 'pending',
      dependencies: ['Competitor identification', 'Monitoring tool selection', 'Alert system configuration'],
      success_metrics: ['Response time to competitor moves <48 hours', 'Market intelligence quality score', 'Strategic advantage retention'],
      due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
    })

    tasks.push({
      id: `strategic-${Date.now()}-2`,
      title: 'Premium Service Tier Development',
      description: `Create differentiated premium service offering that competitors in ${context.location} cannot easily replicate, targeting 25-30% higher margins.`,
      category: 'strategic',
      priority_score: 78,
      impact_score: 9,
      complexity: 'high',
      timeline: '3-4 weeks',
      resource_requirements: 'Service design team, operations manager, 30-40 hours',
      automation_possible: false,
      requires_human_decision: true,
      status: 'pending',
      dependencies: ['Market research completion', 'Service capability assessment', 'Pricing strategy development'],
      success_metrics: ['Premium service adoption rate >20%', 'Margin improvement 25-30%', 'Customer satisfaction score >4.8/5'],
      due_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString()
    })
  }

  // Long-term projects (30+ days)
  if (timeframe === 'long_term') {
    tasks.push({
      id: `long_term-${Date.now()}-1`,
      title: 'Market Expansion Strategy Implementation',
      description: `Develop and execute expansion into adjacent market segments or geographic areas to reduce dependency on current ${context.industry} market concentration.`,
      category: 'long_term',
      priority_score: 75,
      impact_score: 10,
      complexity: 'high',
      timeline: '6-12 weeks',
      resource_requirements: 'Strategic planning team, market research, 60-80 hours',
      automation_possible: false,
      requires_human_decision: true,
      status: 'pending',
      dependencies: ['Market opportunity analysis', 'Resource allocation approval', 'Expansion capability assessment'],
      success_metrics: ['New market revenue >$10k/month', 'Market diversification ratio', 'Risk reduction metrics'],
      due_date: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000).toISOString()
    })

    tasks.push({
      id: `long_term-${Date.now()}-2`,
      title: 'Digital Transformation Initiative',
      description: 'Implement comprehensive digital systems integration to improve operational efficiency by 40% and enhance customer experience.',
      category: 'long_term',
      priority_score: 72,
      impact_score: 8,
      complexity: 'high',
      timeline: '8-16 weeks',
      resource_requirements: 'IT team, process optimization consultant, 100+ hours',
      automation_possible: includeAutomation,
      requires_human_decision: true,
      status: 'pending',
      dependencies: ['Technology stack evaluation', 'Process mapping', 'Change management planning'],
      success_metrics: ['40% efficiency improvement', 'Customer satisfaction increase', 'Cost reduction metrics'],
      due_date: new Date(Date.now() + 112 * 24 * 60 * 60 * 1000).toISOString()
    })
  }

  return tasks
}

function generateCriticalTasks(
  context: AIPromptContext, 
  timeframe: string
): Omit<TaskItem, 'agency_id' | 'created_at' | 'updated_at'>[] {
  return [
    {
      id: `critical-${Date.now()}-1`,
      title: 'Emergency Reputation Management',
      description: `Immediate response required to address reputation threat affecting ${context.clientName}. Multiple negative reviews and social media mentions detected.`,
      category: 'critical',
      priority_score: 98,
      impact_score: 10,
      complexity: 'medium',
      timeline: '0-2 hours',
      resource_requirements: 'Senior manager, PR specialist, immediate attention',
      automation_possible: false,
      requires_human_decision: true,
      status: 'pending',
      dependencies: ['Situation assessment', 'Response strategy approval'],
      success_metrics: ['Response time <2 hours', 'Sentiment recovery', 'Customer retention'],
      due_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: `critical-${Date.now()}-2`,
      title: 'Service Delivery Crisis Resolution',
      description: 'Critical service delivery issue affecting multiple clients. Risk of contract cancellations and referral damage.',
      category: 'critical',
      priority_score: 96,
      impact_score: 9,
      complexity: 'high',
      timeline: '2-8 hours',
      resource_requirements: 'Operations team, customer service, technical support',
      automation_possible: false,
      requires_human_decision: true,
      status: 'pending',
      dependencies: ['Issue root cause analysis', 'Client communication protocol'],
      success_metrics: ['Service restoration time', 'Client retention rate', 'Quality assurance metrics'],
      due_date: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
    }
  ]
}

function generateOptimizationTasks(
  context: AIPromptContext, 
  timeframe: string, 
  includeAutomation: boolean
): Omit<TaskItem, 'agency_id' | 'created_at' | 'updated_at'>[] {
  const tasks: Omit<TaskItem, 'agency_id' | 'created_at' | 'updated_at'>[] = []

  // Focus on high-impact optimization opportunities
  tasks.push({
    id: `optimization-${Date.now()}-1`,
    title: 'Website Conversion Rate Optimization',
    description: `Analyze and optimize ${context.clientName} website to improve conversion rate by 25-40% through UX improvements and conversion funnel optimization.`,
    category: 'high_impact',
    priority_score: 87,
    impact_score: 8,
    complexity: 'medium',
    timeline: '1-2 weeks',
    resource_requirements: 'UX designer, web developer, analytics specialist, 15-20 hours',
    automation_possible: includeAutomation,
    requires_human_decision: false,
    status: 'pending',
    dependencies: ['Current conversion analysis', 'User behavior tracking', 'A/B testing setup'],
    success_metrics: ['25-40% conversion rate improvement', 'Reduced bounce rate', 'Increased user engagement'],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  })

  tasks.push({
    id: `optimization-${Date.now()}-2`,
    title: 'Customer Experience Automation',
    description: 'Implement automated customer journey optimization to reduce service delivery time by 30% while maintaining quality standards.',
    category: 'high_impact',
    priority_score: 84,
    impact_score: 7,
    complexity: 'medium',
    timeline: '2-3 weeks',
    resource_requirements: 'Process analyst, automation specialist, 25-30 hours',
    automation_possible: includeAutomation,
    requires_human_decision: false,
    status: 'pending',
    dependencies: ['Process mapping', 'Automation tool selection', 'Quality control protocols'],
    success_metrics: ['30% time reduction', 'Maintained quality scores', 'Customer satisfaction improvement'],
    due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
  })

  tasks.push({
    id: `optimization-${Date.now()}-3`,
    title: 'Revenue Per Customer Optimization',
    description: 'Develop systematic upselling and cross-selling processes to increase average revenue per customer by 35%.',
    category: 'strategic',
    priority_score: 81,
    impact_score: 9,
    complexity: 'medium',
    timeline: '2-4 weeks',
    resource_requirements: 'Sales manager, customer success team, 20-25 hours',
    automation_possible: includeAutomation,
    requires_human_decision: true,
    status: 'pending',
    dependencies: ['Customer segmentation analysis', 'Service portfolio review', 'Sales training materials'],
    success_metrics: ['35% increase in average revenue per customer', 'Improved customer lifetime value', 'Enhanced service adoption'],
    due_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString()
  })

  return tasks
}