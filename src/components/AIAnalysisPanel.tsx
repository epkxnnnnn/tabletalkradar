'use client'

import React, { useState, useEffect } from 'react'
import { useAgency } from './AgencyProvider'
import { supabase } from '@/lib/supabase'

interface AIAnalysisResult {
  id: string
  client_id: string
  client_name: string
  analysis_type: string
  timeframe: string
  task_count: number
  summary: string
  created_at: string
  status: 'processing' | 'completed' | 'error'
}

interface Client {
  id: string
  business_name: string
  industry: string
  location: string
  business_type: string
  health_score: number
  status: string
}

export default function AIAnalysisPanel() {
  const { currentAgency } = useAgency()
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [analysisType, setAnalysisType] = useState<'comprehensive' | 'critical_only' | 'optimization_focus'>('comprehensive')
  const [timeframe, setTimeframe] = useState<'24_hours' | '7_days' | '30_days' | 'long_term'>('7_days')
  const [includeAutomation, setIncludeAutomation] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [recentAnalyses, setRecentAnalyses] = useState<AIAnalysisResult[]>([])
  const [loadingClients, setLoadingClients] = useState(true)

  useEffect(() => {
    if (currentAgency) {
      loadClients()
      loadRecentAnalyses()
    }
  }, [currentAgency])

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, business_name, industry, location, business_type, health_score, status')
        .eq('agency_id', currentAgency?.id)
        .eq('status', 'active')
        .order('business_name')

      if (error) throw error
      setClients(data || [])
      if (data && data.length > 0 && !selectedClient) {
        setSelectedClient(data[0].id)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoadingClients(false)
    }
  }

  const loadRecentAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('task_automation')
        .select(`
          id,
          client_id,
          created_at,
          title,
          category,
          status
        `)
        .eq('agency_id', currentAgency?.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!error && data) {
        const analysesWithClients = await Promise.all(
          data.map(async (analysis) => {
            const client = clients.find(c => c.id === analysis.client_id)
            return {
              id: analysis.id,
              client_id: analysis.client_id || '',
              client_name: client?.business_name || 'All Clients',
              analysis_type: analysis.category || 'comprehensive',
              timeframe: '7_days',
              task_count: 1,
              summary: analysis.title,
              created_at: analysis.created_at,
              status: analysis.status === 'completed' ? 'completed' as const : 'processing' as const
            }
          })
        )
        setRecentAnalyses(analysesWithClients)
      }
    } catch (error) {
      console.error('Error loading recent analyses:', error)
    }
  }

  const runAIAnalysis = async () => {
    if (!selectedClient && analysisType !== 'comprehensive') return

    setIsAnalyzing(true)
    try {
      const selectedClientData = clients.find(c => c.id === selectedClient)
      
      const response = await fetch('/api/tasks/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_id: currentAgency?.id,
          client_id: selectedClient || null,
          analysis_type: analysisType,
          timeframe: timeframe,
          include_automation: includeAutomation,
          industry: selectedClientData?.industry,
          business_name: selectedClientData?.business_name,
          location: selectedClientData?.location
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Add to recent analyses
        const newAnalysis: AIAnalysisResult = {
          id: Date.now().toString(),
          client_id: selectedClient,
          client_name: selectedClientData?.business_name || 'All Clients',
          analysis_type: analysisType,
          timeframe: timeframe,
          task_count: result.taskCount,
          summary: result.analysis,
          created_at: new Date().toISOString(),
          status: 'completed'
        }
        
        setRecentAnalyses(prev => [newAnalysis, ...prev.slice(0, 4)])
        
        alert(`🎉 Analysis Complete!\n\nGenerated ${result.taskCount} AI-powered tasks for ${selectedClientData?.business_name || 'your agency'}.\n\nCheck the Tasks tab to review and manage them.`)
      } else {
        throw new Error(result.error || 'Analysis failed')
      }
    } catch (error) {
      console.error('Error running AI analysis:', error)
      alert('❌ Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
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

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'comprehensive': return '🔍 Comprehensive'
      case 'critical_only': return '⚠️ Critical Only'
      case 'optimization_focus': return '🚀 Optimization'
      default: return '📊 Analysis'
    }
  }

  const getTimeframeLabel = (timeframe: string) => {
    switch (timeframe) {
      case '24_hours': return '24 Hours'
      case '7_days': return '7 Days'
      case '30_days': return '30 Days'
      case 'long_term': return 'Long Term'
      default: return timeframe
    }
  }

  if (loadingClients) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI Analysis Generator */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">🤖 AI Task Generator</h3>
            <p className="text-slate-400 text-sm mt-1">Generate intelligent tasks and insights for your clients</p>
          </div>
          <div className="text-slate-500 text-sm">
            ⚡ Powered by Claude AI
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Select Client
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
              >
                <option value="">All Clients (Agency-wide)</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.business_name} - {client.industry}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Analysis Type
              </label>
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value as any)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
              >
                <option value="comprehensive">🔍 Comprehensive Analysis</option>
                <option value="critical_only">⚠️ Critical Issues Only</option>
                <option value="optimization_focus">🚀 Optimization Focus</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
              >
                <option value="24_hours">⚡ Next 24 Hours</option>
                <option value="7_days">📅 Next 7 Days</option>
                <option value="30_days">📆 Next 30 Days</option>
                <option value="long_term">🎯 Long Term (3+ months)</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="include-automation"
                checked={includeAutomation}
                onChange={(e) => setIncludeAutomation(e.target.checked)}
                className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
              />
              <label htmlFor="include-automation" className="text-slate-300 text-sm">
                Include automation suggestions
              </label>
            </div>

            <button
              onClick={runAIAnalysis}
              disabled={isAnalyzing || (!selectedClient && analysisType !== 'comprehensive')}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                isAnalyzing
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-lg'
              }`}
            >
              {isAnalyzing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                '🚀 Generate AI Tasks'
              )}
            </button>
          </div>

          {/* Preview/Info Panel */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Analysis Preview</h4>
            
            {selectedClient ? (
              <div className="space-y-3">
                {(() => {
                  const client = clients.find(c => c.id === selectedClient)
                  if (!client) return null
                  
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Client:</span>
                        <span className="text-white text-sm font-medium">{client.business_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Industry:</span>
                        <span className="text-white text-sm">{client.industry}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Location:</span>
                        <span className="text-white text-sm">{client.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Health Score:</span>
                        <span className={`text-sm font-medium ${
                          client.health_score >= 80 ? 'text-green-400' :
                          client.health_score >= 60 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {client.health_score}/100
                        </span>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div className="text-slate-400 text-sm">
                <p>Agency-wide analysis will:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Review all active clients</li>
                  <li>Identify cross-client opportunities</li>
                  <li>Generate strategic initiatives</li>
                  <li>Optimize resource allocation</li>
                </ul>
              </div>
            )}
            
            <div className="mt-4 pt-3 border-t border-slate-600">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Expected Output:</span>
                <span className="text-white">5-12 tasks</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      {recentAnalyses.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent AI Analyses</h3>
          <div className="space-y-3">
            {recentAnalyses.map(analysis => (
              <div key={analysis.id} className="bg-slate-700 rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-white font-medium">{analysis.client_name}</span>
                    <span className="text-slate-400 text-sm">•</span>
                    <span className="text-slate-400 text-sm">{getAnalysisTypeLabel(analysis.analysis_type)}</span>
                  </div>
                  <p className="text-slate-300 text-sm">{analysis.summary}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-slate-400">
                    <span>⏱️ {getTimeframeLabel(analysis.timeframe)}</span>
                    <span>📋 {analysis.task_count} tasks</span>
                    <span>🕒 {formatTimeAgo(analysis.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    analysis.status === 'completed' ? 'bg-green-900/20 text-green-400' :
                    analysis.status === 'processing' ? 'bg-yellow-900/20 text-yellow-400' :
                    'bg-red-900/20 text-red-400'
                  }`}>
                    {analysis.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}