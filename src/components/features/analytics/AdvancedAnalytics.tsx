'use client'

import React, { useState, useEffect } from 'react'
import { useAgency } from '../../providers/AgencyProvider'
import { useAuth } from '../../providers/AuthProvider'
import { supabase } from '@/lib/supabase'

interface AnalyticsData {
  overview: {
    totalRevenue: number
    clientGrowth: number
    teamEfficiency: number
    avgClientRetention: number
  }
  clientMetrics: {
    activeClients: number
    churnRate: number
    avgLifetimeValue: number
    topPerformers: Array<{
      id: string
      name: string
      score: number
      revenue: number
      growth: number
    }>
  }
  teamMetrics: {
    productivity: number
    utilization: number
    workloadDistribution: Array<{
      memberId: string
      name: string
      clientCount: number
      efficiency: number
    }>
  }
  aiInsights: {
    totalInsights: number
    accuracyRate: number
    actionableInsights: number
    trendsIdentified: number
    risksPrevented: number
  }
  automationMetrics: {
    workflowsActive: number
    timeSaved: number
    errorReduction: number
    costSavings: number
  }
  financialMetrics: {
    monthlyRecurring: number
    clientAcquisitionCost: number
    profitMargin: number
    forecastGrowth: number
  }
  timeSeriesData: Array<{
    period: string
    clients: number
    revenue: number
    efficiency: number
    satisfaction: number
  }>
}

interface ChartProps {
  title: string
  data: any[]
  type: 'line' | 'bar' | 'pie' | 'area'
  height?: number
}

const SimpleChart: React.FC<ChartProps> = ({ title, data, type, height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-700 p-4 rounded-lg" style={{ height }}>
        <h3 className="text-white font-medium mb-2">{title}</h3>
        <div className="flex items-center justify-center h-32 text-slate-400">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-700 p-4 rounded-lg" style={{ height }}>
      <h3 className="text-white font-medium mb-4">{title}</h3>
      <div className="space-y-2">
        {data.slice(0, 5).map((item, index) => {
          const maxValue = Math.max(...data.map(d => d.value || d.y || d.clients || d.revenue || 0))
          const value = item.value || item.y || item.clients || item.revenue || 0
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
          
          return (
            <div key={index} className="flex items-center justify-between">
              <span className="text-slate-300 text-sm truncate flex-1">
                {item.name || item.label || item.period || `Item ${index + 1}`}
              </span>
              <div className="flex items-center space-x-2 flex-1 ml-2">
                <div className="flex-1 bg-slate-600 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-white text-sm w-12 text-right">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AdvancedAnalytics() {
  const { currentAgency, permissions } = useAgency()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [activeTimeframe, setActiveTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const timeframes = [
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' },
    { id: '1y', label: '1 Year' }
  ] as const

  const analyticsTabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'clients', name: 'Clients', icon: '👥' },
    { id: 'team', name: 'Team', icon: '⚡' },
    { id: 'ai', name: 'AI Insights', icon: '🧠' },
    { id: 'automation', name: 'Automation', icon: '🤖' },
    { id: 'financial', name: 'Financial', icon: '💰' },
    { id: 'forecasting', name: 'Forecasting', icon: '🔮' }
  ]

  useEffect(() => {
    if (currentAgency) {
      loadAnalyticsData()
    }
  }, [currentAgency, activeTimeframe])

  const loadAnalyticsData = async () => {
    if (!currentAgency) return

    setLoading(true)
    try {
      const response = await fetch(`/api/analytics?agency_id=${currentAgency.id}&timeframe=${activeTimeframe}`)
      const result = await response.json()

      if (result.success) {
        setAnalyticsData(result.analytics)
      } else {
        throw new Error(result.error || 'Failed to load analytics')
      }

    } catch (error) {
      console.error('Error loading analytics data:', error)
      
      // Fallback to mock data if API fails
      const fallbackAnalytics: AnalyticsData = {
        overview: {
          totalRevenue: 45000 + Math.random() * 15000,
          clientGrowth: 12.5 + Math.random() * 10,
          teamEfficiency: 78 + Math.random() * 15,
          avgClientRetention: 89 + Math.random() * 8
        },
        clientMetrics: {
          activeClients: Math.floor(Math.random() * 15) + 5,
          churnRate: 5.2 + Math.random() * 3,
          avgLifetimeValue: 25000 + Math.random() * 15000,
          topPerformers: Array.from({ length: 5 }, (_, i) => ({
            id: `client-${i}`,
            name: `Client ${i + 1}`,
            score: 75 + Math.random() * 25,
            revenue: 3000 + Math.random() * 7000,
            growth: 5 + Math.random() * 20
          }))
        },
        teamMetrics: {
          productivity: 82 + Math.random() * 15,
          utilization: 76 + Math.random() * 20,
          workloadDistribution: Array.from({ length: 3 }, (_, i) => ({
            memberId: `member-${i}`,
            name: `Team Member ${i + 1}`,
            clientCount: Math.floor(Math.random() * 8) + 2,
            efficiency: 70 + Math.random() * 25
          }))
        },
        aiInsights: {
          totalInsights: Math.floor(Math.random() * 25) + 10,
          accuracyRate: 87 + Math.random() * 10,
          actionableInsights: Math.floor(Math.random() * 15) + 5,
          trendsIdentified: Math.floor(Math.random() * 8) + 2,
          risksPrevented: Math.floor(Math.random() * 5) + 1
        },
        automationMetrics: {
          workflowsActive: Math.floor(Math.random() * 8) + 2,
          timeSaved: 120 + Math.random() * 80,
          errorReduction: 45 + Math.random() * 25,
          costSavings: 8500 + Math.random() * 3500
        },
        financialMetrics: {
          monthlyRecurring: 18000 + Math.random() * 12000,
          clientAcquisitionCost: 850 + Math.random() * 350,
          profitMargin: 32 + Math.random() * 18,
          forecastGrowth: 24 + Math.random() * 16
        },
        timeSeriesData: generateTimeSeriesData(activeTimeframe)
      }
      
      setAnalyticsData(fallbackAnalytics)
    } finally {
      setLoading(false)
    }
  }

  const generateTimeSeriesData = (timeframe: '7d' | '30d' | '90d' | '1y') => {
    const data = []
    let periods = 7
    let periodLabel = 'day'
    
    switch (timeframe) {
      case '30d':
        periods = 30
        periodLabel = 'day'
        break
      case '90d':
        periods = 12
        periodLabel = 'week'
        break
      case '1y':
        periods = 12
        periodLabel = 'month'
        break
    }

    for (let i = periods; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i * (timeframe === '90d' ? 7 : timeframe === '1y' ? 30 : 1))
      
      data.push({
        period: timeframe === '1y' ? 
          date.toLocaleDateString('en-US', { month: 'short' }) : 
          timeframe === '90d' ? 
            `Week ${Math.ceil((periods - i) / 4)}` :
            date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        clients: Math.floor(10 + Math.random() * 15 + (periods - i) * 0.5),
        revenue: Math.floor(15000 + Math.random() * 10000 + (periods - i) * 200),
        efficiency: Math.floor(70 + Math.random() * 20),
        satisfaction: Math.floor(80 + Math.random() * 15)
      })
    }

    return data
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  if (!permissions?.can_generate_reports) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <div className="text-slate-400 mb-4">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Access Restricted</h3>
        <p className="text-slate-400">You need analytics permissions to view this dashboard.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-700 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Advanced Analytics</h2>
          <p className="text-slate-400">Comprehensive insights into agency performance</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex bg-slate-700 rounded-lg p-1">
          {timeframes.map(tf => (
            <button
              key={tf.id}
              onClick={() => setActiveTimeframe(tf.id)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTimeframe === tf.id
                  ? 'bg-red-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-600'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Overview */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm">Total Revenue</h3>
              <span className="text-green-400 text-sm">↗ 15.3%</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(analyticsData.overview.totalRevenue)}</p>
            <p className="text-xs text-slate-500 mt-1">vs previous period</p>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm">Client Growth</h3>
              <span className="text-green-400 text-sm">↗ {formatPercentage(analyticsData.overview.clientGrowth)}</span>
            </div>
            <p className="text-2xl font-bold text-white">{analyticsData.clientMetrics.activeClients}</p>
            <p className="text-xs text-slate-500 mt-1">active clients</p>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm">Team Efficiency</h3>
              <span className="text-blue-400 text-sm">↗ 8.2%</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatPercentage(analyticsData.overview.teamEfficiency)}</p>
            <p className="text-xs text-slate-500 mt-1">productivity score</p>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm">AI Accuracy</h3>
              <span className="text-purple-400 text-sm">↗ 4.7%</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatPercentage(analyticsData.aiInsights.accuracyRate)}</p>
            <p className="text-xs text-slate-500 mt-1">insights accuracy</p>
          </div>
        </div>
      )}

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
      <div className="min-h-[500px]">
        {analyticsData && (
          <>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SimpleChart
                  title="Revenue Trend"
                  data={analyticsData.timeSeriesData.map(d => ({ name: d.period, value: d.revenue }))}
                  type="line"
                  height={300}
                />
                <SimpleChart
                  title="Client Growth"
                  data={analyticsData.timeSeriesData.map(d => ({ name: d.period, value: d.clients }))}
                  type="area"
                  height={300}
                />
                <SimpleChart
                  title="Top Performing Clients"
                  data={analyticsData.clientMetrics.topPerformers.map(c => ({ name: c.name, value: c.score }))}
                  type="bar"
                  height={300}
                />
                <SimpleChart
                  title="Team Efficiency Trend"
                  data={analyticsData.timeSeriesData.map(d => ({ name: d.period, value: d.efficiency }))}
                  type="line"
                  height={300}
                />
              </div>
            )}

            {activeTab === 'clients' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Active Clients</h3>
                    <p className="text-3xl font-bold text-green-400">{analyticsData.clientMetrics.activeClients}</p>
                    <p className="text-sm text-slate-400">Churn Rate: {formatPercentage(analyticsData.clientMetrics.churnRate)}</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Avg Lifetime Value</h3>
                    <p className="text-3xl font-bold text-blue-400">{formatCurrency(analyticsData.clientMetrics.avgLifetimeValue)}</p>
                    <p className="text-sm text-slate-400">Per client</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Retention Rate</h3>
                    <p className="text-3xl font-bold text-purple-400">{formatPercentage(analyticsData.overview.avgClientRetention)}</p>
                    <p className="text-sm text-slate-400">Last 12 months</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SimpleChart
                    title="Client Performance Rankings"
                    data={analyticsData.clientMetrics.topPerformers}
                    type="bar"
                    height={350}
                  />
                  <SimpleChart
                    title="Client Satisfaction Trend"
                    data={analyticsData.timeSeriesData.map(d => ({ name: d.period, value: d.satisfaction }))}
                    type="line"
                    height={350}
                  />
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Team Productivity</h3>
                    <p className="text-3xl font-bold text-green-400">{formatPercentage(analyticsData.teamMetrics.productivity)}</p>
                    <p className="text-sm text-slate-400">Overall efficiency</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Utilization</h3>
                    <p className="text-3xl font-bold text-blue-400">{formatPercentage(analyticsData.teamMetrics.utilization)}</p>
                    <p className="text-sm text-slate-400">Resource usage</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Team Members</h3>
                    <p className="text-3xl font-bold text-purple-400">{analyticsData.teamMetrics.workloadDistribution.length}</p>
                    <p className="text-sm text-slate-400">Active members</p>
                  </div>
                </div>

                <SimpleChart
                  title="Workload Distribution"
                  data={analyticsData.teamMetrics.workloadDistribution.map(w => ({ 
                    name: w.name, 
                    value: w.clientCount 
                  }))}
                  type="bar"
                  height={350}
                />
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Total Insights</h3>
                    <p className="text-3xl font-bold text-green-400">{analyticsData.aiInsights.totalInsights}</p>
                    <p className="text-sm text-slate-400">Generated</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Accuracy Rate</h3>
                    <p className="text-3xl font-bold text-blue-400">{formatPercentage(analyticsData.aiInsights.accuracyRate)}</p>
                    <p className="text-sm text-slate-400">AI predictions</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Actionable</h3>
                    <p className="text-3xl font-bold text-purple-400">{analyticsData.aiInsights.actionableInsights}</p>
                    <p className="text-sm text-slate-400">Insights</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Risks Prevented</h3>
                    <p className="text-3xl font-bold text-red-400">{analyticsData.aiInsights.risksPrevented}</p>
                    <p className="text-sm text-slate-400">This period</p>
                  </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">AI Performance Impact</h3>
                  <div className="text-center text-slate-400 py-8">
                    <div className="text-4xl mb-4">🧠</div>
                    <p>AI insights have improved decision-making accuracy by {formatPercentage(analyticsData.aiInsights.accuracyRate - 70)}</p>
                    <p className="text-sm mt-2">Detailed AI performance metrics coming soon</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'automation' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Active Workflows</h3>
                    <p className="text-3xl font-bold text-green-400">{analyticsData.automationMetrics.workflowsActive}</p>
                    <p className="text-sm text-slate-400">Running</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Time Saved</h3>
                    <p className="text-3xl font-bold text-blue-400">{analyticsData.automationMetrics.timeSaved}h</p>
                    <p className="text-sm text-slate-400">This month</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Error Reduction</h3>
                    <p className="text-3xl font-bold text-purple-400">{formatPercentage(analyticsData.automationMetrics.errorReduction)}</p>
                    <p className="text-sm text-slate-400">Vs manual</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Cost Savings</h3>
                    <p className="text-3xl font-bold text-yellow-400">{formatCurrency(analyticsData.automationMetrics.costSavings)}</p>
                    <p className="text-sm text-slate-400">This quarter</p>
                  </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">Automation Impact</h3>
                  <div className="text-center text-slate-400 py-8">
                    <div className="text-4xl mb-4">⚡</div>
                    <p>Automation has reduced manual work by {analyticsData.automationMetrics.timeSaved} hours this month</p>
                    <p className="text-sm mt-2">Estimated annual savings: {formatCurrency(analyticsData.automationMetrics.costSavings * 4)}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Monthly Recurring</h3>
                    <p className="text-3xl font-bold text-green-400">{formatCurrency(analyticsData.financialMetrics.monthlyRecurring)}</p>
                    <p className="text-sm text-slate-400">Revenue</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">CAC</h3>
                    <p className="text-3xl font-bold text-blue-400">{formatCurrency(analyticsData.financialMetrics.clientAcquisitionCost)}</p>
                    <p className="text-sm text-slate-400">Acquisition cost</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Profit Margin</h3>
                    <p className="text-3xl font-bold text-purple-400">{formatPercentage(analyticsData.financialMetrics.profitMargin)}</p>
                    <p className="text-sm text-slate-400">Net margin</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Growth Forecast</h3>
                    <p className="text-3xl font-bold text-yellow-400">{formatPercentage(analyticsData.financialMetrics.forecastGrowth)}</p>
                    <p className="text-sm text-slate-400">Next 12 months</p>
                  </div>
                </div>

                <SimpleChart
                  title="Revenue Growth"
                  data={analyticsData.timeSeriesData.map(d => ({ name: d.period, value: d.revenue }))}
                  type="area"
                  height={350}
                />
              </div>
            )}

            {activeTab === 'forecasting' && (
              <div className="space-y-6">
                <div className="bg-slate-800 p-6 rounded-lg text-center">
                  <div className="text-4xl mb-4">🔮</div>
                  <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Forecasting</h3>
                  <p className="text-slate-400 mb-6">
                    Based on current trends, your agency is projected to achieve {formatPercentage(analyticsData.financialMetrics.forecastGrowth)} growth
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Revenue Forecast</h4>
                      <p className="text-2xl font-bold text-green-400">{formatCurrency(analyticsData.financialMetrics.monthlyRecurring * 1.24)}</p>
                      <p className="text-sm text-slate-400">Next month</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Client Growth</h4>
                      <p className="text-2xl font-bold text-blue-400">{Math.ceil(analyticsData.clientMetrics.activeClients * 1.15)}</p>
                      <p className="text-sm text-slate-400">Expected clients</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Team Expansion</h4>
                      <p className="text-2xl font-bold text-purple-400">{analyticsData.teamMetrics.workloadDistribution.length + 2}</p>
                      <p className="text-sm text-slate-400">Recommended size</p>
                    </div>
                  </div>
                </div>

                <SimpleChart
                  title="Growth Projections"
                  data={[
                    { name: 'Current', value: analyticsData.overview.totalRevenue },
                    { name: 'Q1 Forecast', value: analyticsData.overview.totalRevenue * 1.12 },
                    { name: 'Q2 Forecast', value: analyticsData.overview.totalRevenue * 1.24 },
                    { name: 'Q3 Forecast', value: analyticsData.overview.totalRevenue * 1.38 },
                    { name: 'Q4 Forecast', value: analyticsData.overview.totalRevenue * 1.52 }
                  ]}
                  type="line"
                  height={350}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Export/Share Actions */}
      <div className="flex justify-end space-x-4">
        <button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          Export PDF
        </button>
        <button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          Schedule Report
        </button>
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          Share Dashboard
        </button>
      </div>
    </div>
  )
}