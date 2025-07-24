import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAIPrompt, AI_SOURCE_CONFIGURATIONS, AIPromptContext } from '@/lib/ai-prompts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { 
      agency_id, 
      client_id, 
      intelligence_type, 
      source, 
      query, 
      industry, 
      business_name,
      location 
    } = await request.json()

    if (!agency_id || !intelligence_type || !source) {
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

    // Prepare AI prompt context
    const promptContext: AIPromptContext = {
      clientName: clientData?.business_name || business_name || 'Target Business',
      industry: clientData?.industry || industry || 'General Business',
      location: clientData?.location || location || 'Local Market',
      businessType: clientData?.business_type || 'Service Provider',
      targetMarket: clientData?.target_audience || 'Local consumers and businesses'
    }

    // Generate comprehensive AI prompt based on intelligence type
    const aiPrompt = query || getAIPrompt(intelligence_type, promptContext)
    const sourceConfig = AI_SOURCE_CONFIGURATIONS[source as keyof typeof AI_SOURCE_CONFIGURATIONS]
    const enhancedPrompt = sourceConfig ? `${sourceConfig.promptPrefix}${aiPrompt}` : aiPrompt

    // In production, this would call actual AI APIs like Perplexity, OpenAI, etc.
    // For now, we'll generate contextual mock data based on the enhanced prompt
    const aiInsights = await generateEnhancedAIInsights(
      intelligence_type, 
      enhancedPrompt, 
      source, 
      promptContext
    )

    const intelligence = {
      agency_id,
      client_id: client_id || null,
      intelligence_type,
      source,
      confidence_score: aiInsights.confidence,
      title: aiInsights.title,
      description: query,
      insights: aiInsights.insights,
      raw_data: {
        original_query: query,
        enhanced_prompt: enhancedPrompt,
        source,
        generated_at: new Date().toISOString(),
        context: promptContext
      },
      industry: industry || null,
      location: null,
      time_period: 'current',
      is_active: true
    }

    const { data, error } = await supabase
      .from('market_intelligence')
      .insert(intelligence)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save intelligence' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      intelligence: data,
      insights: aiInsights.insights
    })

  } catch (error) {
    console.error('Error collecting intelligence:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateEnhancedAIInsights(
  type: string, 
  enhancedPrompt: string, 
  source: string, 
  context: AIPromptContext
) {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

  const confidence = 0.7 + Math.random() * 0.3 // 70-100% confidence
  
  const title = generateTitle(type, context.clientName, context.industry)
  
  let insights: any = { summary: '', data: {}, prompt_used: enhancedPrompt.slice(0, 200) + '...' }

  // Generate insights based on the comprehensive daily intelligence format
  switch (type) {
    case 'opportunity':
      insights = {
        summary: `Daily intelligence analysis for ${context.clientName} reveals ${2 + Math.floor(Math.random() * 3)} strategic opportunities in ${context.industry}`,
        urgent_actions: [
          `Launch targeted social media campaign addressing competitor service gaps in ${context.location}`,
          `Respond to 3+ negative competitor reviews with superior service offering`,
          `Contact local businesses affected by recent competitor price increases`
        ],
        opportunities_7_days: [
          {
            title: 'Local Market Gap Exploitation',
            timeline: '3-7 days',
            description: `Competitor ${generateCompetitorName(context.industry)} raised prices 15% - capture their price-sensitive customers`,
            implementation: 'Launch "Price Protection" promotional campaign',
            potential_impact: '$' + (3000 + Math.random() * 7000).toFixed(0) + ' additional monthly revenue'
          },
          {
            title: 'Seasonal Demand Surge',
            timeline: '1-2 weeks',
            description: `${context.industry} demand typically increases 25% this time of year`,
            implementation: 'Increase marketing spend and staff capacity',
            potential_impact: '25-40% revenue boost for next 6 weeks'
          },
          {
            title: 'Digital Presence Enhancement',
            timeline: '5-7 days',
            description: 'Top competitor has outdated website - opportunity to showcase superior online experience',
            implementation: 'Launch comparative digital marketing campaign',
            potential_impact: '15-20% increase in online inquiries'
          }
        ],
        risks_30_days: [
          `New competitor entering ${context.location} market with aggressive pricing`,
          `Seasonal demand decline expected in 4-6 weeks without proactive retention strategy`
        ],
        optimization_recommendations: [
          {
            action: 'Implement review response automation system',
            timeline: '2-3 weeks',
            expected_impact: '25% improvement in online reputation score'
          },
          {
            action: `Optimize local SEO for "${context.industry} ${context.location}" keywords`,
            timeline: '3-4 weeks', 
            expected_impact: '30-40% increase in local search visibility'
          },
          {
            action: 'Launch customer referral incentive program',
            timeline: '1-2 weeks',
            expected_impact: '15-25% increase in new customer acquisition'
          }
        ],
        market_intelligence_summary: `Current market analysis reveals ${context.clientName} is well-positioned to capitalize on competitor weaknesses and seasonal demand patterns. The ${context.industry} sector in ${context.location} is experiencing moderate growth with increasing customer quality expectations. Key strategic focus should be on rapid response to competitive gaps while building long-term market position through superior customer experience and digital presence optimization.`
      }
      break

    case 'risk':
      insights = {
        summary: `Strategic risk assessment identifies ${1 + Math.floor(Math.random() * 2)} high-priority risks requiring immediate attention for ${context.clientName}`,
        urgent_actions: [
          `Monitor competitor ${generateCompetitorName(context.industry)} aggressive pricing strategy launched this week`,
          `Address 2 negative reviews posted in last 48 hours before they impact search rankings`,
          `Secure backup suppliers due to supply chain disruptions in ${context.industry}`
        ],
        competitive_risks: [
          {
            risk: 'New Market Entrant Threat',
            severity: 'high',
            timeline: '30-60 days',
            description: `Well-funded competitor planning to enter ${context.location} market with below-market pricing`,
            mitigation_strategy: 'Launch customer loyalty program and lock in annual contracts',
            estimated_impact: '20-35% potential revenue loss'
          },
          {
            risk: 'Service Quality Replication',
            severity: 'medium',
            timeline: '60-90 days',
            description: 'Competitors rapidly copying unique service offerings and value propositions',
            mitigation_strategy: 'Accelerate innovation cycle and create proprietary processes',
            estimated_impact: '10-15% market share erosion'
          }
        ],
        market_risks: [
          {
            risk: 'Economic Downturn Impact',
            severity: 'medium',
            probability: '40%',
            timeline: '3-6 months',
            description: `${context.industry} typically sees 25-40% demand reduction during economic uncertainty`,
            mitigation_strategy: 'Diversify service portfolio and target recession-proof segments',
            financial_impact: '$' + (5000 + Math.random() * 15000).toFixed(0) + ' monthly revenue at risk'
          }
        ],
        operational_risks: [
          'Key team member dependency - 60% of clients prefer specific staff member',
          'Single-supplier vulnerability for critical service components',
          'Technology failure risk - outdated backup systems could cause 3-5 day service disruption'
        ],
        risk_mitigation_recommendations: [
          {
            action: 'Implement competitive intelligence monitoring system',
            priority: 'high',
            timeline: '1-2 weeks',
            cost: '$500-800/month',
            benefit: 'Early warning of competitive threats and market changes'
          },
          {
            action: 'Develop service differentiation through proprietary methodology',
            priority: 'medium',
            timeline: '4-6 weeks',
            cost: '$2000-5000 investment',
            benefit: 'Reduced competitive replication risk'
          },
          {
            action: 'Create emergency response protocols for operational disruptions',
            priority: 'high',
            timeline: '2-3 weeks',
            cost: '$1000-2000',
            benefit: 'Minimize customer impact during service interruptions'
          }
        ],
        market_intelligence_summary: `Risk landscape analysis indicates ${context.clientName} faces moderate competitive pressure with seasonal demand volatility. Primary concerns center around new market entrants and economic sensitivity. Immediate focus should be on competitive differentiation and operational resilience building. The ${context.industry} sector shows signs of increased competition intensity, requiring proactive strategic positioning to maintain market share and profitability.`
      }
      break

    case 'competitor':
      insights = {
        summary: `Comprehensive competitive landscape analysis for ${context.clientName} in ${context.location} ${context.industry} market`,
        urgent_actions: [
          `Counter ${generateCompetitorName(context.industry)}'s new promotion launched yesterday`,
          `Respond to competitor's negative review targeting your services within 24 hours`,
          `Contact customers who recently reviewed competitor negatively - immediate outreach opportunity`
        ],
        recent_competitor_activity: [
          {
            competitor: generateCompetitorName(context.industry),
            activity: 'Launched aggressive pricing campaign - 20% below market rate',
            date: '48 hours ago',
            impact_assessment: 'High threat - targeting your core customer segment',
            response_strategy: 'Emphasize value proposition and service quality differentiation',
            urgency: 'immediate'
          },
          {
            competitor: generateCompetitorName(context.industry),
            activity: 'New marketing campaign focusing on same keyword targets',
            date: '3 days ago',
            impact_assessment: 'Medium threat - may increase customer acquisition costs',
            response_strategy: 'Optimize long-tail keywords and improve Quality Score',
            urgency: '7 days'
          }
        ],
        market_positioning_analysis: [
          {
            competitor: generateCompetitorName(context.industry),
            position: 'Market Leader',
            market_share: (12 + Math.random() * 8).toFixed(1) + '%',
            strengths: ['Established brand recognition', 'Large marketing budget', 'Multiple locations'],
            critical_weaknesses: ['Higher prices (25% above market)', 'Poor customer service reviews', 'Slow response times'],
            opportunity_gaps: 'Price-sensitive customers, personalized service demand',
            threat_level: 'high'
          },
          {
            competitor: generateCompetitorName(context.industry),
            position: 'Aggressive Challenger',
            market_share: (5 + Math.random() * 7).toFixed(1) + '%',
            strengths: ['Competitive pricing', 'Modern technology', 'Fast service delivery'],
            critical_weaknesses: ['Limited service range', 'New to market - unproven reliability', 'Small team capacity'],
            opportunity_gaps: 'Premium service segment, complex projects requiring experience',
            threat_level: 'medium'
          }
        ],
        competitive_advantages: [
          `${Math.floor(Math.random() * 15) + 5} years industry experience vs competitors' 2-3 years average`,
          'Superior customer satisfaction score - 4.8/5 vs industry average 4.2/5',
          'Specialized expertise competitors lack in complex projects',
          `Local market knowledge - established relationships in ${context.location}`
        ],
        strategic_recommendations: [
          {
            action: 'Launch "Experience Matters" campaign highlighting years in business',
            timeline: 'This week',
            competitive_response: 'Counter new entrants emphasizing reliability over price',
            expected_outcome: '15-20% increase in qualified leads'
          },
          {
            action: 'Implement competitive pricing monitoring system',
            timeline: '2-3 weeks',
            competitive_response: 'Rapid response to competitor pricing changes',
            expected_outcome: 'Maintain price competitiveness without race-to-bottom'
          },
          {
            action: 'Develop premium service tier competitors cannot match',
            timeline: '4-6 weeks',
            competitive_response: 'Create differentiated offering for high-value customers',
            expected_outcome: '25-30% higher margins on premium services'
          }
        ],
        market_intelligence_summary: `Competitive analysis reveals ${context.clientName} operates in an increasingly competitive ${context.industry} market with 2-3 new entrants in the past 6 months. Primary competitive pressure comes from price-focused challengers, while established players compete on brand recognition. Key strategic opportunity lies in the "experienced premium" positioning - customers willing to pay more for proven expertise and reliability. Market dynamics favor businesses that can demonstrate clear value differentiation rather than competing solely on price.`
      }
      break

    case 'market_trend':
      insights = {
        summary: `Identified ${3 + Math.floor(Math.random() * 2)} key trends shaping the industry`,
        trends: [
          {
            trend: 'AI Integration Acceleration',
            impact_level: 'transformational',
            timeframe: 'Next 6-12 months',
            description: `Rapid adoption of AI tools in ${context.industry || 'business'} operations`,
            opportunity_rating: 'high',
            adoption_rate: (60 + Math.random() * 30).toFixed(0) + '%'
          },
          {
            trend: 'Sustainability Focus',
            impact_level: 'significant',
            timeframe: 'Current and growing',
            description: 'Increasing emphasis on sustainable and eco-friendly practices',
            opportunity_rating: 'medium',
            adoption_rate: (40 + Math.random() * 40).toFixed(0) + '%'
          },
          {
            trend: 'Remote-First Operations',
            impact_level: 'established',
            timeframe: 'Ongoing',
            description: 'Permanent shift to remote and hybrid work models',
            opportunity_rating: 'medium',
            adoption_rate: (70 + Math.random() * 20).toFixed(0) + '%'
          }
        ],
        market_growth_rate: (5 + Math.random() * 10).toFixed(1) + '%',
        key_drivers: [
          'Technological advancement',
          'Changing consumer preferences',
          'Regulatory changes',
          'Economic factors'
        ]
      }
      break

    case 'predictive_analytics':
      insights = {
        summary: `Comprehensive predictive analysis for ${context.clientName} with ${3 + Math.floor(Math.random() * 2)}-month strategic forecasting`,
        executive_summary: `Predictive modeling indicates ${context.clientName} is positioned for ${5 + Math.random() * 15}% growth over the next quarter with managed risk exposure`,
        
        revenue_forecasting: {
          next_3_months: [
            {
              month: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long' }),
              projected_revenue: Math.round(15000 + Math.random() * 8000),
              confidence_level: Math.round(75 + Math.random() * 20),
              key_drivers: ['Seasonal demand increase', 'Market expansion', 'Customer retention']
            },
            {
              month: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long' }),
              projected_revenue: Math.round(16000 + Math.random() * 9000),
              confidence_level: Math.round(70 + Math.random() * 25),
              key_drivers: ['New service rollout', 'Competitive positioning', 'Economic factors']
            },
            {
              month: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long' }),
              projected_revenue: Math.round(17000 + Math.random() * 10000),
              confidence_level: Math.round(65 + Math.random() * 20),
              key_drivers: ['Market maturation', 'Strategic initiatives', 'Seasonal patterns']
            }
          ],
          growth_trajectory: `${8 + Math.random() * 12}% quarterly growth expected`,
          risk_factors: ['Market volatility', 'Competitive pressure', 'Economic uncertainty']
        },
        
        opportunity_timing: {
          immediate_opportunities: [
            {
              opportunity: 'Premium Service Launch',
              optimal_timing: 'Next 2-4 weeks',
              revenue_potential: `$${(3000 + Math.random() * 5000).toFixed(0)}/month`,
              confidence: Math.round(80 + Math.random() * 15),
              implementation_effort: 'Medium'
            },
            {
              opportunity: 'Strategic Partnership Initiative',
              optimal_timing: 'Next 4-6 weeks',
              revenue_potential: `$${(2000 + Math.random() * 4000).toFixed(0)}/month`,
              confidence: Math.round(75 + Math.random() * 20),
              implementation_effort: 'High'
            }
          ],
          seasonal_timing: `Best growth window: ${['Early Spring', 'Mid Summer', 'Fall Season', 'Holiday Period'][Math.floor(Math.random() * 4)]}`,
          market_timing_factors: ['Consumer spending patterns', 'Industry cycle position', 'Competitive landscape evolution']
        },
        
        risk_predictions: {
          high_probability_risks: [
            {
              risk: 'Market Saturation Impact',
              probability: Math.round(40 + Math.random() * 30),
              timeline: '2-4 months',
              mitigation: 'Accelerate differentiation strategy and explore adjacent markets',
              impact_severity: 'Medium'
            },
            {
              risk: 'Competitive Pricing Pressure',
              probability: Math.round(50 + Math.random() * 25),
              timeline: '1-3 months',
              mitigation: 'Strengthen value proposition and customer loyalty programs',
              impact_severity: 'High'
            }
          ],
          early_warning_indicators: [
            'Customer acquisition cost increases >20%',
            'Customer satisfaction scores decline >10%',
            'Market share erosion >5%',
            'Competitor aggressive expansion in local market'
          ]
        },
        
        strategic_recommendations: {
          priority_actions: [
            {
              action: 'Implement dynamic pricing strategy',
              timeline: '2-3 weeks',
              expected_impact: `${10 + Math.random() * 15}% revenue optimization`,
              resource_requirement: 'Low-Medium'
            },
            {
              action: 'Develop customer retention automation',
              timeline: '4-6 weeks',  
              expected_impact: `${15 + Math.random() * 20}% customer lifetime value increase`,
              resource_requirement: 'Medium'
            },
            {
              action: 'Launch competitive intelligence system',
              timeline: '1-2 weeks',
              expected_impact: 'Improved market positioning and response time',
              resource_requirement: 'Low'
            }
          ],
          success_probability: Math.round(70 + Math.random() * 25)
        },
        
        predictive_confidence: Math.round(75 + Math.random() * 20),
        model_accuracy: `${85 + Math.random() * 10}% based on historical validation`,
        data_quality_score: Math.round(80 + Math.random() * 15),
        
        market_intelligence_summary: `Predictive analysis reveals ${context.clientName} operates in a dynamic ${context.industry} market with favorable growth conditions. Key strategic focus should be on capitalizing on identified timing opportunities while proactively managing competitive and market risks. The forecasting model indicates strong potential for sustained growth through strategic positioning and operational optimization.`
      }
      break

    case 'customer_insight':
      insights = {
        summary: 'Key insights into customer behavior and decision-making patterns',
        insights: [
          {
            insight: 'Value-Driven Decision Making',
            confidence: 'high',
            description: 'Customers increasingly prioritize demonstrable ROI over brand prestige',
            behavioral_pattern: '73% of customers request ROI projections before purchasing',
            implication: 'Focus marketing on concrete results and measurable outcomes',
            action_required: true
          },
          {
            insight: 'Multi-Channel Expectations',
            confidence: 'high',
            description: 'Customers expect seamless experience across all touchpoints',
            behavioral_pattern: '68% abandon services with inconsistent experiences',
            implication: 'Invest in integrated customer experience systems',
            action_required: true
          },
          {
            insight: 'Personalization Demand',
            confidence: 'medium',
            description: 'Growing expectation for personalized service delivery',
            behavioral_pattern: '45% willing to pay premium for personalized solutions',
            implication: 'Develop customer segmentation and personalization capabilities',
            action_required: false
          }
        ],
        customer_segments: [
          {
            segment: 'Value Seekers',
            size: (30 + Math.random() * 20).toFixed(0) + '%',
            characteristics: ['Price-sensitive', 'ROI-focused', 'Research-heavy']
          },
          {
            segment: 'Experience Focused',
            size: (25 + Math.random() * 15).toFixed(0) + '%',
            characteristics: ['Service quality priority', 'Brand loyal', 'Premium willing']
          }
        ],
        recommendations: [
          'Develop ROI-focused sales materials',
          'Implement customer experience tracking',
          'Create value-tier service packages',
          'Enhance personalization capabilities'
        ]
      }
      break

    default:
      insights = {
        summary: 'General market intelligence collected',
        data: { query: enhancedPrompt, processed: true }
      }
  }

  return { title, insights, confidence }
}

function generateTitle(type: string, businessName: string, industry?: string): string {
  const industryText = industry ? ` - ${industry}` : ''
  const timestamp = new Date().toLocaleDateString()
  
  switch (type) {
    case 'opportunity': return `Daily Opportunities Analysis: ${businessName}${industryText} (${timestamp})`
    case 'risk': return `Strategic Risk Assessment: ${businessName}${industryText} (${timestamp})`
    case 'competitor': return `Competitive Intelligence Update: ${businessName}${industryText} (${timestamp})`
    case 'market_trend': return `Market Trends & Industry Analysis${industryText} (${timestamp})`
    case 'customer_insight': return `Customer Intelligence & Behavior Analysis${industryText} (${timestamp})`
    default: return `Daily Intelligence Report: ${businessName} (${timestamp})`
  }
}

function generateCompetitorName(industry?: string): string {
  const prefixes = ['Pro', 'Elite', 'Prime', 'Advanced', 'Smart', 'Digital', 'Strategic', 'Dynamic']
  const suffixes = ['Solutions', 'Services', 'Group', 'Partners', 'Consulting', 'Agency', 'Labs', 'Systems']
  const industryTerms = {
    'technology': ['Tech', 'Digital', 'Systems'],
    'marketing': ['Marketing', 'Media', 'Creative'],
    'healthcare': ['Health', 'Medical', 'Care'],
    'finance': ['Financial', 'Capital', 'Wealth']
  }
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
  
  return `${prefix} ${suffix}`
}