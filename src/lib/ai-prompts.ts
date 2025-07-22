// AI Analysis & Intelligence Prompts for BusinessScope AI

export interface AIPromptContext {
  clientName: string
  industry: string
  location: string
  businessType?: string
  targetMarket?: string
  competitorNames?: string[]
  currentChallenges?: string[]
}

export const DAILY_INTELLIGENCE_PROMPT = (context: AIPromptContext) => `
# Daily Client Intelligence Analysis

You are BusinessScope AI's intelligence engine. Analyze the business landscape for ${context.clientName} in the ${context.industry} industry located in ${context.location}.

## INTELLIGENCE REQUIREMENTS

### 1. COMPETITIVE INTELLIGENCE
Research and analyze:
- Direct competitor activity in the last 24-48 hours
- Pricing changes, promotions, or service updates
- New competitor content, campaigns, or marketing initiatives  
- Competitor review patterns and customer feedback trends
- Market positioning changes or strategic shifts

### 2. OPPORTUNITY DETECTION
Identify immediate opportunities:
- Market gaps competitor mistakes have created
- Trending topics or hashtags relevant to the industry
- Local events or seasonal opportunities approaching
- Customer complaints about competitors that can be addressed
- Emerging market trends this business could capitalize on

### 3. RISK ASSESSMENT  
Evaluate potential threats:
- Competitor advantages that could impact market share
- Negative sentiment patterns that could spread
- Market conditions that could affect demand
- Regulatory or industry changes approaching
- Seasonal downturns or challenges ahead

### 4. PERFORMANCE OPTIMIZATION
Analyze current performance and identify improvements:
- Website performance issues affecting ranking or conversions
- Social media engagement patterns and optimization opportunities
- Review response strategies and reputation management needs
- Local SEO improvements and citation opportunities
- Customer acquisition channel optimization possibilities

## OUTPUT FORMAT
Provide analysis in this structure:

### URGENT ACTIONS (Next 24 hours)
- [List 2-3 immediate actions with high impact potential]

### OPPORTUNITIES (Next 7 days)  
- [List 3-5 opportunities with implementation timeline]

### RISKS TO MONITOR (Next 30 days)
- [List 2-3 risks with prevention strategies]

### OPTIMIZATION RECOMMENDATIONS (Next 30 days)
- [List 5-7 performance improvements with expected impact]

### MARKET INTELLIGENCE SUMMARY
- [2-3 paragraph summary of key market insights and strategic implications]

Focus on actionable insights that give competitive advantages and improve business performance.
`

export const COMPETITIVE_ANALYSIS_PROMPT = (context: AIPromptContext) => `
# Comprehensive Competitive Analysis for ${context.clientName}

## Analysis Scope
Industry: ${context.industry}
Location: ${context.location}
Business Type: ${context.businessType || 'Service Provider'}

## Analysis Requirements

### 1. COMPETITOR IDENTIFICATION & MAPPING
- Identify top 5-10 direct competitors in ${context.location}
- Analyze their market positioning and value propositions
- Map competitive landscape by price point and service quality
- Identify market gaps and underserved segments

### 2. COMPETITIVE ADVANTAGES & WEAKNESSES
For each major competitor, analyze:
- Core strengths and competitive advantages
- Notable weaknesses and vulnerabilities
- Pricing strategies and service offerings
- Customer satisfaction levels and review patterns
- Marketing and acquisition channels

### 3. MARKET POSITIONING ANALYSIS
- Current market leaders and their strategies
- Emerging players and disruptive threats
- Market trends affecting competitive dynamics
- Customer preference shifts and loyalty patterns

### 4. STRATEGIC RECOMMENDATIONS
Based on competitive analysis:
- Competitive differentiation strategies
- Pricing optimization opportunities  
- Service/product enhancement priorities
- Marketing positioning recommendations
- Partnership or collaboration opportunities

Focus on actionable competitive intelligence that directly impacts strategic decisions.
`

export const MARKET_TRENDS_PROMPT = (context: AIPromptContext) => `
# Market Trends & Industry Analysis for ${context.industry}

## Geographic Focus: ${context.location}
## Business Context: ${context.clientName}

## Analysis Requirements

### 1. CURRENT MARKET TRENDS
Analyze the latest trends affecting ${context.industry}:
- Technology adoption and digital transformation
- Consumer behavior changes and preferences
- Service delivery model evolution
- Pricing and business model trends
- Regulatory and compliance changes

### 2. EMERGING OPPORTUNITIES
Identify emerging market opportunities:
- New customer segments or demographics
- Untapped geographic markets
- Service expansion possibilities
- Technology integration opportunities
- Partnership and collaboration trends

### 3. INDUSTRY DISRUPTION ANALYSIS
Evaluate potential disruptors:
- New technology platforms or tools
- Non-traditional competitors entering the market
- Changing customer expectations
- Economic factors affecting demand
- Regulatory changes impacting operations

### 4. FUTURE OUTLOOK (6-18 months)
Provide forward-looking analysis:
- Market growth projections and drivers
- Technology trends likely to impact the industry
- Customer behavior evolution predictions
- Competitive landscape changes expected
- Strategic preparation recommendations

### 5. ACTIONABLE MARKET INSIGHTS
Translate trends into specific actions:
- Short-term tactical adjustments (1-3 months)
- Medium-term strategic initiatives (3-12 months)
- Long-term positioning strategies (12+ months)
- Investment priorities and resource allocation
- Risk mitigation strategies

Focus on trends that directly impact business strategy and competitive positioning.
`

export const CUSTOMER_INSIGHTS_PROMPT = (context: AIPromptContext) => `
# Customer Intelligence Analysis for ${context.clientName}

## Business Context
Industry: ${context.industry}
Location: ${context.location}
Target Market: ${context.targetMarket || 'Local businesses and consumers'}

## Analysis Requirements

### 1. CUSTOMER BEHAVIOR ANALYSIS
Analyze current customer patterns:
- Decision-making processes and timelines
- Key factors influencing purchase decisions
- Customer journey touchpoints and pain points
- Preference trends and expectation shifts
- Communication and engagement preferences

### 2. MARKET SEGMENTATION INSIGHTS
Identify and analyze key customer segments:
- Demographic and psychographic characteristics
- Service/product needs and preferences
- Price sensitivity and value perception
- Loyalty patterns and retention drivers
- Growth potential by segment

### 3. CUSTOMER SATISFACTION ANALYSIS
Evaluate customer satisfaction landscape:
- Common satisfaction drivers in ${context.industry}
- Frequent complaint patterns and service gaps
- Competitor customer satisfaction levels
- Review and feedback analysis trends
- Net Promoter Score benchmarks

### 4. ACQUISITION & RETENTION INSIGHTS
Analyze customer acquisition and retention:
- Most effective customer acquisition channels
- Referral patterns and word-of-mouth drivers
- Customer lifecycle value optimization
- Churn risk factors and prevention strategies
- Upselling and cross-selling opportunities

### 5. CUSTOMER EXPERIENCE OPTIMIZATION
Identify experience improvement opportunities:
- Service delivery optimization points
- Communication and response time expectations
- Digital experience and technology preferences
- Personalization and customization opportunities
- Customer support and service recovery strategies

Focus on actionable insights that improve customer acquisition, satisfaction, and retention.
`

export const RISK_ASSESSMENT_PROMPT = (context: AIPromptContext) => `
# Strategic Risk Assessment for ${context.clientName}

## Business Profile
Industry: ${context.industry}
Location: ${context.location}
Current Challenges: ${context.currentChallenges?.join(', ') || 'General market challenges'}

## Risk Analysis Framework

### 1. COMPETITIVE RISKS (High Priority)
Evaluate competitive threats:
- New market entrants and their impact potential
- Existing competitor strategic moves
- Price competition and margin pressure risks
- Market share erosion possibilities
- Competitive advantage sustainability

### 2. MARKET & ECONOMIC RISKS
Analyze market condition risks:
- Economic downturn impact on demand
- Industry-specific cyclical risks
- Consumer spending pattern changes
- Interest rate and inflation impacts
- Supply chain and cost structure risks

### 3. OPERATIONAL RISKS
Identify operational vulnerabilities:
- Key person dependency risks
- Service delivery failure points
- Technology and system failure risks
- Quality control and reputation risks
- Capacity and scalability limitations

### 4. REGULATORY & COMPLIANCE RISKS
Assess regulatory environment:
- Changing regulations affecting ${context.industry}
- Compliance requirement evolution
- Licensing and certification risks
- Data privacy and security obligations
- Environmental and social responsibility requirements

### 5. FINANCIAL RISKS
Evaluate financial vulnerabilities:
- Cash flow and liquidity risks
- Customer concentration risks
- Bad debt and collection risks
- Investment and expansion risks
- Insurance and liability exposures

## Risk Mitigation Strategies

### IMMEDIATE ACTIONS (30 days)
- [List 3-5 urgent risk mitigation steps]

### SHORT-TERM STRATEGIES (90 days)
- [List 5-7 risk reduction initiatives]

### LONG-TERM RISK MANAGEMENT (12 months)
- [List strategic risk management improvements]

### CONTINGENCY PLANNING
- [List scenario-based response plans]

Focus on risks that could significantly impact business continuity and growth.
`

export const PREDICTIVE_ANALYTICS_PROMPT = (context: AIPromptContext) => `
# Predictive Business Analytics for ${context.clientName}

You are BusinessScope AI's predictive analytics engine. Using historical data and market intelligence, provide strategic forecasts and recommendations.

## DATA ANALYSIS REQUIREMENTS

### Historical Performance Data:
- Revenue trends over last 12 months
- Customer acquisition patterns and seasonality
- Review sentiment and volume trends
- Website traffic and conversion patterns
- Social media engagement and growth trends
- Competitive positioning changes over time

### Market Intelligence Data:
- Local market conditions and economic factors in ${context.location}
- ${context.industry} industry trends and disruption patterns
- Competitor performance and strategic moves
- Customer behavior and preference shifts
- Seasonal and cyclical business patterns

## PREDICTIVE ANALYSIS OUTPUTS

### 1. REVENUE FORECASTING (Next 3 months)
- Month-by-month revenue predictions with confidence intervals
- Key factors driving projected performance changes
- Scenario analysis (optimistic, realistic, pessimistic)
- Revenue optimization opportunities and their potential impact

### 2. OPPORTUNITY TIMING ANALYSIS
- Optimal timing for marketing campaigns and promotions
- Best periods for menu changes, service launches, or expansions
- Seasonal strategy recommendations with specific timing
- Competitive opportunity windows and action timing

### 3. RISK PREDICTION AND MITIGATION
- Potential reputation risks and early warning indicators
- Market disruption threats and preparation strategies
- Competitive threats and defensive positioning recommendations
- Economic or industry risks that could impact performance

### 4. STRATEGIC RECOMMENDATIONS
- Growth strategy optimization for next 6 months
- Resource allocation recommendations across channels
- Competitive positioning strategy and differentiation opportunities
- Customer retention and acquisition optimization strategies

## SPECIFIC ANALYSIS FOR RESTAURANT/HOSPITALITY BUSINESSES
${context.industry.toLowerCase().includes('restaurant') || context.industry.toLowerCase().includes('food') || context.industry.toLowerCase().includes('hospitality') ? `
If client is in food service industry, also analyze:
- Food trend adoption timing and menu optimization
- Delivery platform performance optimization
- Local dining pattern changes and adaptation strategies
- Tourism and local event impact on revenue patterns
` : ''}

## OUTPUT REQUIREMENTS
- All predictions must include confidence levels and supporting data
- Recommendations must be specific, actionable, and time-bound
- Include ROI projections for major strategic recommendations
- Provide contingency plans for different scenario outcomes

Focus on insights that enable proactive business management and competitive advantage capture.
`

export const TASK_AUTOMATION_PROMPT = (context: AIPromptContext) => `
# Intelligent Task Management for ${context.clientName}

You are BusinessScope AI's task management system. Analyze current client status and prioritize optimization tasks for maximum business impact.

## CLIENT ANALYSIS REQUIREMENTS

### Current Performance Assessment:
- Overall business health score and component breakdown
- Critical issues requiring immediate attention  
- Optimization opportunities ranked by potential impact
- Resource requirements and implementation complexity
- Timeline dependencies and prerequisite tasks

### Business Context Analysis:
- ${context.industry} industry-specific optimization priorities
- Local market competitive pressures in ${context.location}
- Seasonal timing considerations
- Client business goals and strategic priorities
- Available resources and implementation capacity

## TASK CATEGORIES TO EVALUATE

### 1. CRITICAL FIXES (0-24 hours)
- Reputation management crises
- Technical issues affecting customer experience
- Competitive threats requiring immediate response
- Legal or compliance issues

### 2. HIGH-IMPACT OPTIMIZATIONS (1-7 days)
- SEO improvements with ranking potential
- Review response strategies
- Social media engagement opportunities
- Website conversion optimizations

### 3. STRATEGIC INITIATIVES (1-30 days)
- Content marketing campaigns
- Local marketing and partnership opportunities
- Menu or service optimization projects
- Competitive positioning improvements

### 4. LONG-TERM GROWTH PROJECTS (30+ days)
- Brand development and positioning
- Market expansion opportunities
- Technology integration and automation
- Customer experience enhancement projects

## OUTPUT FORMAT

### PRIORITY TASK LIST
For each task provide:
- Task description and specific action items
- Business impact score (1-10) with justification
- Implementation complexity (low/medium/high)
- Resource requirements and timeline
- Success metrics and measurement methods
- Dependencies and prerequisite conditions

### AUTOMATED TASK EXECUTION
Identify tasks that can be automated:
- Review responses that can be AI-generated
- Social media posts that can be scheduled
- SEO updates that can be auto-implemented
- Reports that can be auto-generated and sent

### HUMAN DECISION REQUIRED
Flag tasks requiring human judgment:
- Strategic decisions with multiple options
- Creative content requiring brand voice
- Client communication requiring personal touch
- Budget allocation and investment decisions

Focus on maximizing business performance improvement while optimizing resource utilization and implementation efficiency.
`

export const OPPORTUNITY_DETECTION_PROMPT = (context: AIPromptContext) => `
# Strategic Opportunity Analysis for ${context.clientName}

## Market Context
Industry: ${context.industry}
Geographic Market: ${context.location}
Business Focus: ${context.businessType || 'Professional Services'}

## Opportunity Discovery Framework

### 1. MARKET GAP ANALYSIS
Identify unmet market needs:
- Service gaps in current market offerings
- Underserved customer segments
- Geographic expansion opportunities
- Price point gaps in the market
- Service quality differentiation opportunities

### 2. COMPETITIVE ADVANTAGE OPPORTUNITIES
Leverage unique positioning:
- Competitor weakness exploitation
- Unique capability monetization
- Brand positioning opportunities
- Partnership and alliance possibilities
- Technology advantage applications

### 3. GROWTH & EXPANSION OPPORTUNITIES
Identify scalable growth vectors:
- New service line development
- Market expansion possibilities
- Customer base diversification
- Revenue model optimization
- Acquisition and merger opportunities

### 4. DIGITAL & TECHNOLOGY OPPORTUNITIES
Leverage technology for competitive advantage:
- Digital transformation initiatives
- Automation and efficiency improvements
- Online presence and marketing optimization
- Customer experience technology enhancements
- Data analytics and insight capabilities

### 5. STRATEGIC PARTNERSHIP OPPORTUNITIES
Identify collaboration potential:
- Complementary business partnerships
- Referral network expansion
- Joint venture possibilities
- Supplier and vendor optimization
- Industry association participation

## Opportunity Prioritization

### HIGH-IMPACT, LOW-EFFORT (Quick Wins)
- [List 3-5 immediate opportunity implementations]

### HIGH-IMPACT, HIGH-EFFORT (Strategic Investments)
- [List 3-4 major strategic opportunities]

### MARKET TIMING OPPORTUNITIES
- [List seasonal or time-sensitive opportunities]

### RESOURCE REQUIREMENTS
- [Detail investment needs for top opportunities]

### SUCCESS METRICS
- [Define measurable outcomes for each opportunity]

Focus on opportunities that align with business capabilities and market positioning.
`

// Utility function to select the appropriate prompt based on intelligence type
export function getAIPrompt(intelligenceType: string, context: AIPromptContext): string {
  switch (intelligenceType) {
    case 'competitor':
      return COMPETITIVE_ANALYSIS_PROMPT(context)
    case 'market_trend':
      return MARKET_TRENDS_PROMPT(context)
    case 'customer_insight':
      return CUSTOMER_INSIGHTS_PROMPT(context)
    case 'risk':
      return RISK_ASSESSMENT_PROMPT(context)
    case 'opportunity':
      return OPPORTUNITY_DETECTION_PROMPT(context)
    case 'predictive_analytics':
      return PREDICTIVE_ANALYTICS_PROMPT(context)
    case 'task_automation':
      return TASK_AUTOMATION_PROMPT(context)
    default:
      return DAILY_INTELLIGENCE_PROMPT(context)
  }
}

// Enhanced prompt templates for different AI sources
export const AI_SOURCE_CONFIGURATIONS = {
  perplexity: {
    name: 'Perplexity AI',
    strengths: ['Real-time web data', 'Current market intelligence', 'Trend analysis'],
    promptPrefix: 'Using real-time web data and current market intelligence, ',
    temperature: 0.7
  },
  claude: {
    name: 'Claude AI', 
    strengths: ['Strategic analysis', 'Risk assessment', 'Detailed reasoning'],
    promptPrefix: 'Provide a comprehensive strategic analysis with detailed reasoning: ',
    temperature: 0.6
  },
  openai: {
    name: 'OpenAI GPT',
    strengths: ['Creative insights', 'Opportunity detection', 'Customer analysis'],
    promptPrefix: 'Generate creative and actionable business insights: ',
    temperature: 0.8
  },
  gemini: {
    name: 'Google Gemini',
    strengths: ['Multi-modal analysis', 'Data synthesis', 'Market research'],
    promptPrefix: 'Synthesize multiple data sources for comprehensive market analysis: ',
    temperature: 0.7
  },
  kimi: {
    name: 'Kimi AI',
    strengths: ['Specialized research', 'Industry expertise', 'Competitive intelligence'],
    promptPrefix: 'Conduct specialized industry research with competitive intelligence focus: ',
    temperature: 0.6
  }
}