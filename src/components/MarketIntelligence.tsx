'use client'

import React, { useState, useEffect } from 'react'
import { useAgency } from './AgencyProvider'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { MarketIntelligence as Intelligence, IntelligenceType, AISource, EnhancedClient } from '@/lib/types/agency'

interface IntelligenceInsight extends Intelligence {
  client?: {
    business_name: string
    industry: string
  }
}

interface IntelligenceCollection {
  opportunities: IntelligenceInsight[]
  risks: IntelligenceInsight[]
  competitors: IntelligenceInsight[]
  trends: IntelligenceInsight[]
  insights: IntelligenceInsight[]
}

interface CollectionRequest {
  type: IntelligenceType | 'predictive_analytics'
  client_id?: string
  query: string
  source: AISource
}

export default function MarketIntelligence() {
  const { currentAgency, permissions } = useAgency()
  const { user } = useAuth()
  
  const [intelligence, setIntelligence] = useState<IntelligenceCollection>({
    opportunities: [],
    risks: [],
    competitors: [],
    trends: [],
    insights: []
  })
  const [clients, setClients] = useState<EnhancedClient[]>([])
  const [loading, setLoading] = useState(true)
  const [collecting, setCollecting] = useState(false)
  const [activeTab, setActiveTab] = useState<IntelligenceType | 'predictive_analytics'>('opportunity')
  const [showCollectModal, setShowCollectModal] = useState(false)
  const [collectForm, setCollectForm] = useState<CollectionRequest>({
    type: 'opportunity',
    client_id: '',
    query: '',
    source: 'perplexity'
  })

  const intelligenceTypes: { id: IntelligenceType | 'predictive_analytics'; name: string; description: string; icon: string; color: string }[] = [
    {
      id: 'opportunity',
      name: 'Opportunities',
      description: 'Market opportunities and growth potential',
      icon: '🎯',
      color: 'text-green-400'
    },
    {
      id: 'risk',
      name: 'Risks',
      description: 'Market risks and potential threats',
      icon: '⚠️',
      color: 'text-red-400'
    },
    {
      id: 'competitor',
      name: 'Competitors',
      description: 'Competitive landscape analysis',
      icon: '⚔️',
      color: 'text-purple-400'
    },
    {
      id: 'market_trend',
      name: 'Trends',
      description: 'Market trends and industry shifts',
      icon: '📈',
      color: 'text-blue-400'
    },
    {
      id: 'customer_insight',
      name: 'Insights',
      description: 'Customer behavior and preferences',
      icon: '💡',
      color: 'text-yellow-400'
    },
    {
      id: 'predictive_analytics',
      name: 'Predictive',
      description: 'AI-powered forecasting and predictions',
      icon: '🔮',
      color: 'text-indigo-400'
    }
  ]

  const aiSources: { id: AISource; name: string; description: string }[] = [
    { id: 'perplexity', name: 'Perplexity AI', description: 'Real-time web search and analysis' },
    { id: 'claude', name: 'Claude AI', description: 'Advanced reasoning and analysis' },
    { id: 'openai', name: 'OpenAI GPT', description: 'Comprehensive language understanding' },
    { id: 'gemini', name: 'Google Gemini', description: 'Multi-modal intelligence' },
    { id: 'kimi', name: 'Kimi AI', description: 'Specialized market research' }
  ]

  const queryTemplates: { [key in IntelligenceType | 'predictive_analytics']: string[] } = {
    opportunity: [
      'What are emerging market opportunities in {industry} for 2024?',
      'What new customer segments should {business} target?',
      'What partnerships or collaborations could benefit {business}?',
      'What technological trends could {business} leverage?'
    ],
    risk: [
      'What are the main competitive risks facing {industry}?',
      'What regulatory changes could impact {business}?',
      'What economic factors threaten {industry} growth?',
      'What technological disruptions could affect {business}?'
    ],
    competitor: [
      'Who are the top competitors of {business} in {location}?',
      'What marketing strategies are competitors using?',
      'What are competitor pricing strategies in {industry}?',
      'What competitive advantages does {business} have?'
    ],
    market_trend: [
      'What are the latest trends in {industry} for 2024?',
      'How is consumer behavior changing in {industry}?',
      'What seasonal trends affect {industry}?',
      'What digital transformation trends impact {industry}?'
    ],
    customer_insight: [
      'What do customers value most in {industry} services?',
      'What customer pain points exist in {industry}?',
      'What customer demographics are growing in {industry}?',
      'What customer retention strategies work best in {industry}?'
    ],
    predictive_analytics: [
      'Generate comprehensive 3-month revenue forecast for {business} in {industry}',
      'Predict optimal timing for marketing campaigns and service launches',
      'Forecast potential risks and mitigation strategies for next quarter',
      'Analyze future customer behavior trends and demand patterns'
    ]
  }

  useEffect(() => {
    if (currentAgency) {
      loadIntelligenceData()
    }
  }, [currentAgency])

  const loadIntelligenceData = async () => {
    if (!currentAgency) return

    setLoading(true)
    try {
      // Load intelligence data
      const { data: intelligenceData, error: intelligenceError } = await supabase
        .from('market_intelligence')
        .select(`
          *,
          client:clients(business_name, industry)
        `)
        .eq('agency_id', currentAgency.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (!intelligenceError && intelligenceData) {
        const categorized: IntelligenceCollection = {
          opportunities: intelligenceData.filter(i => i.intelligence_type === 'opportunity'),
          risks: intelligenceData.filter(i => i.intelligence_type === 'risk'),
          competitors: intelligenceData.filter(i => i.intelligence_type === 'competitor'),
          trends: intelligenceData.filter(i => i.intelligence_type === 'market_trend'),
          insights: intelligenceData.filter(i => i.intelligence_type === 'customer_insight')
        }
        setIntelligence(categorized)
      }

      // Load clients
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('agency_id', currentAgency.id)
        .eq('status', 'active')

      if (!clientError) {
        setClients(clientData || [])
      }

    } catch (error) {
      console.error('Error loading intelligence data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCollectIntelligence = async () => {
    if (!currentAgency || !user || !collectForm.query.trim()) return

    setCollecting(true)
    try {
      const client = collectForm.client_id ? clients.find(c => c.id === collectForm.client_id) : null
      
      const response = await fetch('/api/intelligence/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agency_id: currentAgency.id,
          client_id: collectForm.client_id || null,
          intelligence_type: collectForm.type,
          source: collectForm.source,
          query: collectForm.query,
          industry: client?.industry || null,
          business_name: client?.business_name || currentAgency.name,
          location: client?.location || null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to collect intelligence')
      }

      const result = await response.json()
      
      if (result.success) {
        await loadIntelligenceData()
        setShowCollectModal(false)
        setCollectForm({ type: 'opportunity', client_id: '', query: '', source: 'perplexity' })
        
        // Show success message with insights summary
        if (result.insights?.summary) {
          alert(`Intelligence collected successfully!\n\n${result.insights.summary}`)
        }
      } else {
        throw new Error(result.error || 'Unknown error')
      }

    } catch (error) {
      console.error('Error collecting intelligence:', error)
      alert(`Failed to collect intelligence: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCollecting(false)
    }
  }


  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    return 'Just now'
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400'
    if (score >= 0.6) return 'text-yellow-400'
    return 'text-red-400'
  }

  const renderIntelligenceCard = (item: IntelligenceInsight) => (
    <div key={item.id} className="bg-slate-700 rounded-lg p-6 hover:bg-slate-600 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg">{item.title}</h3>
          {item.client && (
            <p className="text-slate-400 text-sm">{item.client.business_name} • {item.client.industry}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${getConfidenceColor(item.confidence_score)}`}>
            {Math.round(item.confidence_score * 100)}%
          </span>
          <span className="text-slate-400 text-xs">{formatTimeAgo(item.created_at)}</span>
        </div>
      </div>
      
      <p className="text-slate-300 text-sm mb-4">{item.description}</p>
      
      {item.insights && (
        <div className="space-y-2">
          {item.insights.summary && (
            <div className="bg-slate-800 p-3 rounded">
              <p className="text-slate-200 text-sm font-medium">{item.insights.summary}</p>
            </div>
          )}
          
          {/* Enhanced insight rendering for new structured format */}
          
          {/* Urgent Actions */}
          {item.insights.urgent_actions && (
            <div className="bg-red-900/20 border border-red-500/30 p-3 rounded mb-3">
              <h4 className="text-red-400 font-medium text-sm mb-2">🚨 Urgent Actions (24 hours)</h4>
              <ul className="space-y-1">
                {item.insights.urgent_actions.slice(0, 2).map((action: string, idx: number) => (
                  <li key={idx} className="text-slate-300 text-xs flex items-start">
                    <span className="text-red-400 mr-1">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Opportunities (7 days) */}
          {item.insights.opportunities_7_days && (
            <div className="space-y-2">
              <h4 className="text-green-400 font-medium text-sm">🎯 Opportunities (Next 7 days)</h4>
              {item.insights.opportunities_7_days.slice(0, 2).map((opp: any, idx: number) => (
                <div key={idx} className="bg-green-900/20 border border-green-500/30 p-3 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <h5 className="text-green-400 font-medium text-sm">{opp.title}</h5>
                    <span className="text-xs text-green-300">{opp.timeline}</span>
                  </div>
                  <p className="text-slate-300 text-xs mb-1">{opp.description}</p>
                  <p className="text-green-200 text-xs font-medium">{opp.potential_impact}</p>
                </div>
              ))}
            </div>
          )}

          {/* Risk Analysis */}
          {item.insights.competitive_risks && (
            <div className="space-y-2">
              <h4 className="text-red-400 font-medium text-sm">⚠️ Competitive Risks</h4>
              {item.insights.competitive_risks.slice(0, 2).map((risk: any, idx: number) => (
                <div key={idx} className="bg-red-900/20 border border-red-500/30 p-3 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <h5 className="text-red-400 font-medium text-sm">{risk.risk}</h5>
                    <span className="text-xs text-red-300">{risk.severity} risk</span>
                  </div>
                  <p className="text-slate-300 text-xs mb-1">{risk.description}</p>
                  <p className="text-red-200 text-xs font-medium">{risk.estimated_impact}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recent Competitor Activity */}
          {item.insights.recent_competitor_activity && (
            <div className="space-y-2">
              <h4 className="text-purple-400 font-medium text-sm">🔍 Recent Competitor Activity</h4>
              {item.insights.recent_competitor_activity.slice(0, 2).map((activity: any, idx: number) => (
                <div key={idx} className="bg-purple-900/20 border border-purple-500/30 p-3 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <h5 className="text-purple-400 font-medium text-sm">{activity.competitor}</h5>
                    <span className="text-xs text-purple-300">{activity.date}</span>
                  </div>
                  <p className="text-slate-300 text-xs mb-1">{activity.activity}</p>
                  <p className="text-purple-200 text-xs">{activity.impact_assessment}</p>
                </div>
              ))}
            </div>
          )}

          {/* Legacy format fallback */}
          {item.insights.opportunities && !item.insights.opportunities_7_days && (
            <div className="space-y-2">
              {item.insights.opportunities.slice(0, 2).map((opp: any, idx: number) => (
                <div key={idx} className="bg-green-900/20 border border-green-500/30 p-3 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-green-400 font-medium text-sm">{opp.title}</h4>
                    <span className="text-xs text-green-300">{opp.impact} impact</span>
                  </div>
                  <p className="text-slate-300 text-xs">{opp.description}</p>
                </div>
              ))}
            </div>
          )}
          
          {item.insights.risks && !item.insights.competitive_risks && (
            <div className="space-y-2">
              {item.insights.risks.slice(0, 2).map((risk: any, idx: number) => (
                <div key={idx} className="bg-red-900/20 border border-red-500/30 p-3 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-red-400 font-medium text-sm">{risk.title}</h4>
                    <span className="text-xs text-red-300">{risk.severity}</span>
                  </div>
                  <p className="text-slate-300 text-xs">{risk.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-600">
        <span className="text-xs text-slate-500">Source: {item.source}</span>
        <button className="text-blue-400 hover:text-blue-300 text-xs">View Details</button>
      </div>
    </div>
  )

  if (!permissions?.can_access_ai_insights) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <div className="text-slate-400 mb-4">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No Access</h3>
        <p className="text-slate-400">You don&apos;t have permission to access market intelligence features.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Market Intelligence</h2>
          <p className="text-slate-400">AI-powered insights to drive strategic decisions</p>
        </div>
        <button
          onClick={() => setShowCollectModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Collect Intelligence
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {intelligenceTypes.map(type => (
          <div key={type.id} className="bg-slate-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{type.icon}</span>
              <span className={`text-lg font-bold ${type.color}`}>
                {intelligence[type.id === 'market_trend' ? 'trends' : type.id === 'customer_insight' ? 'insights' : type.id as keyof IntelligenceCollection]?.length || 0}
              </span>
            </div>
            <div className="text-sm text-slate-400">{type.name}</div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-700">
        <nav className="flex space-x-8">
          {intelligenceTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setActiveTab(type.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === type.id
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Intelligence Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="text-center text-slate-400 py-12">Loading intelligence data...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(() => {
              const dataKey = activeTab === 'market_trend' ? 'trends' : 
                             activeTab === 'customer_insight' ? 'insights' : 
                             activeTab as keyof IntelligenceCollection
              const items = intelligence[dataKey] || []
              
              if (items.length === 0) {
                return (
                  <div className="lg:col-span-2 text-center text-slate-400 py-12">
                    <div className="text-4xl mb-4">{intelligenceTypes.find(t => t.id === activeTab)?.icon}</div>
                    <h3 className="text-lg font-medium mb-2">No {intelligenceTypes.find(t => t.id === activeTab)?.name} Yet</h3>
                    <p className="mb-4">Collect AI-powered intelligence to get started.</p>
                    <button
                      onClick={() => setShowCollectModal(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      Collect Intelligence
                    </button>
                  </div>
                )
              }
              
              return items.map(renderIntelligenceCard)
            })()}
          </div>
        )}
      </div>

      {/* Collect Intelligence Modal */}
      {showCollectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-2xl">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-semibold text-white">Collect Market Intelligence</h3>
              <p className="text-slate-400 text-sm mt-1">AI-powered daily intelligence analysis with structured insights</p>
              <div className="mt-2 text-xs text-slate-500">
                🤖 Enhanced with comprehensive prompts for urgent actions, opportunities, risks, and strategic recommendations
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Intelligence Type
                  </label>
                  <select
                    value={collectForm.type}
                    onChange={(e) => setCollectForm(prev => ({ ...prev, type: e.target.value as IntelligenceType }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {intelligenceTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.icon} {type.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    AI Source
                  </label>
                  <select
                    value={collectForm.source}
                    onChange={(e) => setCollectForm(prev => ({ ...prev, source: e.target.value as AISource }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {aiSources.map(source => (
                      <option key={source.id} value={source.id}>{source.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target Client (Optional)
                </label>
                <select
                  value={collectForm.client_id}
                  onChange={(e) => setCollectForm(prev => ({ ...prev, client_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">All Clients / General Market</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.business_name} ({client.industry})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Intelligence Query
                </label>
                <textarea
                  value={collectForm.query}
                  onChange={(e) => setCollectForm(prev => ({ ...prev, query: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 h-24"
                  placeholder="What specific intelligence would you like to gather?"
                />
              </div>

              {/* Query Templates */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Quick Templates
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {queryTemplates[collectForm.type]?.slice(0, 4).map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCollectForm(prev => ({ ...prev, query: template }))}
                      className="text-left p-3 bg-slate-700 hover:bg-slate-600 rounded-md text-sm text-slate-300 transition-colors"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-slate-700">
              <button
                onClick={() => setShowCollectModal(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCollectIntelligence}
                disabled={collecting || !collectForm.query.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {collecting ? 'Collecting...' : 'Collect Intelligence'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}