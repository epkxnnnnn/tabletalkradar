'use client'

import React, { useState, useEffect } from 'react'
import { useAgency } from './AgencyProvider'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { EnhancedClient } from '@/lib/types/agency'

interface PredictiveData {
  client_id: string
  forecast_type: 'revenue' | 'risk' | 'opportunity' | 'comprehensive'
  forecast_period: '3_months' | '6_months' | '12_months'
  predictions: any
  confidence_score: number
  generated_at: string
}

interface ForecastRequest {
  client_id?: string
  forecast_type: 'revenue' | 'risk' | 'opportunity' | 'comprehensive'
  forecast_period: '3_months' | '6_months' | '12_months'
  include_scenarios: boolean
  include_recommendations: boolean
}

interface RevenueProjection {
  period: string
  projected_revenue: number
  confidence_interval: {
    low: number
    high: number
  }
  key_factors: string[]
  confidence_level: number
}

interface OpportunityForecast {
  opportunity_type: string
  optimal_timing: string
  implementation_timeline: string
  expected_roi: string
  confidence_level: number
  prerequisites: string[]
}

interface RiskPrediction {
  risk_category: string
  probability: number
  potential_impact: string
  timeline: string
  early_indicators: string[]
  mitigation_strategy: string
}

export default function PredictiveAnalytics() {
  const { currentAgency, permissions } = useAgency()
  const { user } = useAuth()
  
  const [clients, setClients] = useState<EnhancedClient[]>([])
  const [predictions, setPredictions] = useState<PredictiveData[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showForecastModal, setShowForecastModal] = useState(false)
  const [forecastForm, setForecastForm] = useState<ForecastRequest>({
    client_id: '',
    forecast_type: 'comprehensive',
    forecast_period: '3_months',
    include_scenarios: true,
    include_recommendations: true
  })

  const forecastTypes = [
    { id: 'comprehensive', name: 'Comprehensive Analysis', description: 'Complete business forecasting with all metrics', icon: '📊' },
    { id: 'revenue', name: 'Revenue Forecasting', description: 'Financial projections and growth analysis', icon: '💰' },
    { id: 'opportunity', name: 'Opportunity Timing', description: 'Strategic opportunity and timing analysis', icon: '🎯' },
    { id: 'risk', name: 'Risk Prediction', description: 'Risk assessment and mitigation planning', icon: '⚠️' }
  ]

  const forecastPeriods = [
    { id: '3_months', name: '3 Months', description: 'Short-term tactical forecasting' },
    { id: '6_months', name: '6 Months', description: 'Medium-term strategic planning' },
    { id: '12_months', name: '12 Months', description: 'Long-term strategic forecasting' }
  ]

  const analyticsTabs = [
    { id: 'overview', name: 'Forecast Overview', icon: '📊' },
    { id: 'revenue', name: 'Revenue Projections', icon: '💰' },
    { id: 'opportunities', name: 'Opportunity Timing', icon: '🎯' },
    { id: 'risks', name: 'Risk Predictions', icon: '⚠️' },
    { id: 'recommendations', name: 'Strategic Recommendations', icon: '🎯' }
  ]

  useEffect(() => {
    if (currentAgency) {
      loadPredictiveData()
    }
  }, [currentAgency])

  const loadPredictiveData = async () => {
    if (!currentAgency) return

    setLoading(true)
    try {
      // Load clients
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('agency_id', currentAgency.id)
        .eq('status', 'active')

      if (!clientError) {
        setClients(clientData || [])
      }

      // Load existing predictions
      const { data: predictionData, error: predictionError } = await supabase
        .from('predictive_analytics')
        .select('*')
        .eq('agency_id', currentAgency.id)
        .order('generated_at', { ascending: false })
        .limit(10)

      if (!predictionError && predictionData) {
        setPredictions(predictionData)
      }

    } catch (error) {
      console.error('Error loading predictive data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateForecast = async () => {
    if (!currentAgency || !user) return

    setGenerating(true)
    try {
      const client = forecastForm.client_id ? clients.find(c => c.id === forecastForm.client_id) : null
      
      const response = await fetch('/api/predictive/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agency_id: currentAgency.id,
          client_id: forecastForm.client_id || null,
          forecast_type: forecastForm.forecast_type,
          forecast_period: forecastForm.forecast_period,
          include_scenarios: forecastForm.include_scenarios,
          include_recommendations: forecastForm.include_recommendations,
          industry: client?.industry || null,
          business_name: client?.business_name || currentAgency.name,
          location: client?.location || null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate forecast')
      }

      const result = await response.json()
      
      if (result.success) {
        await loadPredictiveData()
        setShowForecastModal(false)
        setForecastForm({
          client_id: '',
          forecast_type: 'comprehensive',
          forecast_period: '3_months',
          include_scenarios: true,
          include_recommendations: true
        })
        
        alert('Predictive analytics forecast generated successfully!')
      } else {
        throw new Error(result.error || 'Unknown error')
      }

    } catch (error) {
      console.error('Error generating forecast:', error)
      alert(`Failed to generate forecast: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setGenerating(false)
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

  const getConfidenceLevel = (score: number) => {
    if (score >= 0.8) return 'High'
    if (score >= 0.6) return 'Medium'
    return 'Low'
  }

  const renderForecastCard = (prediction: PredictiveData) => (
    <div key={prediction.client_id + prediction.generated_at} className="bg-slate-700 rounded-lg p-6 hover:bg-slate-600 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg capitalize">
            {prediction.forecast_type.replace('_', ' ')} Forecast
          </h3>
          <p className="text-slate-400 text-sm">
            {clients.find(c => c.id === prediction.client_id)?.business_name || 'Agency-wide Analysis'}
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Period: {prediction.forecast_period.replace('_', ' ')} • Generated {formatTimeAgo(prediction.generated_at)}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-sm font-medium ${getConfidenceColor(prediction.confidence_score)}`}>
            {Math.round(prediction.confidence_score * 100)}% confidence
          </span>
          <p className="text-xs text-slate-400">{getConfidenceLevel(prediction.confidence_score)}</p>
        </div>
      </div>

      {prediction.predictions && (
        <div className="space-y-4">
          {/* Revenue Projections */}
          {prediction.predictions.revenue_forecasting && (
            <div className="bg-slate-800 p-4 rounded">
              <h4 className="text-green-400 font-medium text-sm mb-3">💰 Revenue Projections</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {prediction.predictions.revenue_forecasting.monthly_projections?.slice(0, 3).map((proj: RevenueProjection, idx: number) => (
                  <div key={idx} className="text-center">
                    <div className="text-lg font-bold text-white">${proj.projected_revenue.toLocaleString()}</div>
                    <div className="text-xs text-slate-400">{proj.period}</div>
                    <div className="text-xs text-green-300">{proj.confidence_level}% confidence</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strategic Opportunities */}
          {prediction.predictions.opportunity_timing && (
            <div className="bg-slate-800 p-4 rounded">
              <h4 className="text-blue-400 font-medium text-sm mb-3">🎯 Strategic Opportunities</h4>
              {prediction.predictions.opportunity_timing.opportunities?.slice(0, 2).map((opp: OpportunityForecast, idx: number) => (
                <div key={idx} className="mb-2 last:mb-0">
                  <div className="flex justify-between items-center">
                    <span className="text-white text-sm font-medium">{opp.opportunity_type}</span>
                    <span className="text-blue-300 text-xs">{opp.optimal_timing}</span>
                  </div>
                  <div className="text-slate-300 text-xs">{opp.expected_roi} ROI potential</div>
                </div>
              ))}
            </div>
          )}

          {/* Risk Predictions */}
          {prediction.predictions.risk_prediction && (
            <div className="bg-slate-800 p-4 rounded">
              <h4 className="text-red-400 font-medium text-sm mb-3">⚠️ Risk Predictions</h4>
              {prediction.predictions.risk_prediction.identified_risks?.slice(0, 2).map((risk: RiskPrediction, idx: number) => (
                <div key={idx} className="mb-2 last:mb-0">
                  <div className="flex justify-between items-center">
                    <span className="text-white text-sm font-medium">{risk.risk_category}</span>
                    <span className="text-red-300 text-xs">{Math.round(risk.probability * 100)}% probability</span>
                  </div>
                  <div className="text-slate-300 text-xs">{risk.potential_impact}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-600">
        <span className="text-xs text-slate-500">AI Model: {prediction.predictions?.model_used || 'BusinessScope AI'}</span>
        <button className="text-blue-400 hover:text-blue-300 text-xs">View Full Analysis</button>
      </div>
    </div>
  )

  if (!permissions?.can_access_ai_insights) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <div className="text-slate-400 mb-4">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Access Required</h3>
        <p className="text-slate-400">Predictive analytics requires AI insights permissions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Predictive Analytics</h2>
          <p className="text-slate-400">AI-powered business forecasting and strategic planning</p>
        </div>
        <button
          onClick={() => setShowForecastModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Generate Forecast
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📊</span>
            <span className="text-lg font-bold text-white">{predictions.length}</span>
          </div>
          <div className="text-sm text-slate-400">Total Forecasts</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🎯</span>
            <span className="text-lg font-bold text-green-400">{predictions.filter(p => p.confidence_score >= 0.8).length}</span>
          </div>
          <div className="text-sm text-slate-400">High Confidence</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">💰</span>
            <span className="text-lg font-bold text-blue-400">{predictions.filter(p => p.forecast_type === 'revenue').length}</span>
          </div>
          <div className="text-sm text-slate-400">Revenue Models</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">⚠️</span>
            <span className="text-lg font-bold text-orange-400">{predictions.filter(p => p.forecast_type === 'risk').length}</span>
          </div>
          <div className="text-sm text-slate-400">Risk Assessments</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-700">
        <nav className="flex space-x-8 overflow-x-auto">
          {analyticsTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Analytics Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="text-center text-slate-400 py-12">Loading predictive analytics...</div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {predictions.length > 0 ? (
                  predictions.slice(0, 6).map(renderForecastCard)
                ) : (
                  <div className="lg:col-span-2 text-center text-slate-400 py-12">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-lg font-medium mb-2">No Forecasts Yet</h3>
                    <p className="mb-4">Generate your first predictive analysis to get started.</p>
                    <button
                      onClick={() => setShowForecastModal(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      Generate Forecast
                    </button>
                  </div>
                )}
              </div>
            )}

            {['revenue', 'opportunities', 'risks', 'recommendations'].includes(activeTab) && (
              <div className="text-center text-slate-400 py-12">
                <div className="text-4xl mb-4">
                  {analyticsTabs.find(t => t.id === activeTab)?.icon}
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {analyticsTabs.find(t => t.id === activeTab)?.name}
                </h3>
                <p className="mb-4">Detailed {activeTab} analysis will be displayed here after generating forecasts.</p>
                <button
                  onClick={() => setShowForecastModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Generate Analysis
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Generate Forecast Modal */}
      {showForecastModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-2xl">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-semibold text-white">Generate Predictive Forecast</h3>
              <p className="text-slate-400 text-sm mt-1">AI-powered business forecasting with strategic recommendations</p>
              <div className="mt-2 text-xs text-slate-500">
                🤖 Uses comprehensive predictive analytics prompts for accurate forecasting
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Forecast Type
                  </label>
                  <select
                    value={forecastForm.forecast_type}
                    onChange={(e) => setForecastForm(prev => ({ ...prev, forecast_type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {forecastTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.icon} {type.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    {forecastTypes.find(t => t.id === forecastForm.forecast_type)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Forecast Period
                  </label>
                  <select
                    value={forecastForm.forecast_period}
                    onChange={(e) => setForecastForm(prev => ({ ...prev, forecast_period: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {forecastPeriods.map(period => (
                      <option key={period.id} value={period.id}>{period.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    {forecastPeriods.find(p => p.id === forecastForm.forecast_period)?.description}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target Client (Optional)
                </label>
                <select
                  value={forecastForm.client_id}
                  onChange={(e) => setForecastForm(prev => ({ ...prev, client_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">All Clients / Agency-wide Analysis</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.business_name} ({client.industry})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={forecastForm.include_scenarios}
                    onChange={(e) => setForecastForm(prev => ({ ...prev, include_scenarios: e.target.checked }))}
                    className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
                  />
                  <span className="text-slate-300 text-sm">Include scenario analysis</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={forecastForm.include_recommendations}
                    onChange={(e) => setForecastForm(prev => ({ ...prev, include_recommendations: e.target.checked }))}
                    className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
                  />
                  <span className="text-slate-300 text-sm">Include strategic recommendations</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-slate-700">
              <button
                onClick={() => setShowForecastModal(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateForecast}
                disabled={generating}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate Forecast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}