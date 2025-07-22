'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'

interface Audit {
  id: string
  business_name: string
  category: string
  industry: string
  business_type: string | null
  target_market: string | null
  overall_score: number
  created_at: string
  audit_data: any
  status: string
}

interface ActionItem {
  id: string
  audit_id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed'
  due_date: string
  created_at: string
}

export default function AuditHistory() {
  const { user } = useAuth()
  const [audits, setAudits] = useState<Audit[]>([])
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null)
  const [view, setView] = useState<'list' | 'analytics' | 'competitors'>('list')
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    if (user) {
      loadAudits()
      loadActionItems()
    }
  }, [user])

  const loadAudits = async () => {
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAudits(data || [])
    } catch (error) {
      console.error('Error loading audits:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadActionItems = async () => {
    try {
      const { data, error } = await supabase
        .from('action_items')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setActionItems(data || [])
    } catch (error) {
      console.error('Error loading action items:', error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-600'
      case 'medium': return 'bg-yellow-600'
      case 'low': return 'bg-blue-600'
      default: return 'bg-slate-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600'
      case 'in_progress': return 'bg-yellow-600'
      case 'pending': return 'bg-slate-600'
      default: return 'bg-slate-600'
    }
  }

  const calculateTrends = () => {
    const recentAudits = audits.slice(0, 5)
    const avgScore = recentAudits.reduce((sum, audit) => sum + audit.overall_score, 0) / recentAudits.length
    const trend = recentAudits.length > 1 ? 
      (recentAudits[0].overall_score - recentAudits[recentAudits.length - 1].overall_score) : 0
    
    return { avgScore, trend }
  }

  const { avgScore, trend } = calculateTrends()

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Audit History & Analytics</h2>
          <p className="text-slate-400">Track performance and manage action items</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-slate-700 text-white px-3 py-2 rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <div className="flex bg-slate-700 rounded-md">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 text-sm rounded-l-md ${
                view === 'list' ? 'bg-red-600 text-white' : 'text-slate-300'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView('analytics')}
              className={`px-4 py-2 text-sm ${
                view === 'analytics' ? 'bg-red-600 text-white' : 'text-slate-300'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setView('competitors')}
              className={`px-4 py-2 text-sm rounded-r-md ${
                view === 'competitors' ? 'bg-red-600 text-white' : 'text-slate-300'
              }`}
            >
              Competitors
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{audits.length}</div>
          <div className="text-slate-400 text-sm">Total Audits</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
            {avgScore.toFixed(1)}
          </div>
          <div className="text-slate-400 text-sm">Average Score</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{actionItems.length}</div>
          <div className="text-slate-400 text-sm">Action Items</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className={`text-2xl font-bold ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}
          </div>
          <div className="text-slate-400 text-sm">Score Trend</div>
        </div>
      </div>

      {/* Main Content */}
      {view === 'list' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Recent Audits</h3>
          {loading ? (
            <div className="text-center text-slate-400">Loading audits...</div>
          ) : (
            <div className="space-y-3">
              {audits.map((audit) => (
                <div
                  key={audit.id}
                  className="bg-slate-800 p-4 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors"
                  onClick={() => setSelectedAudit(audit)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-white font-medium">{audit.business_name}</h4>
                      <p className="text-slate-400 text-sm">{audit.category}</p>
                      <p className="text-slate-500 text-xs">
                        {new Date(audit.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(audit.overall_score)}`}>
                        {audit.overall_score}
                      </div>
                      <div className="text-slate-400 text-xs">Score</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'analytics' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Performance Analytics</h3>
          
          {/* Performance Chart */}
          <div className="bg-slate-800 p-6 rounded-lg">
            <h4 className="text-white font-medium mb-4">Score Trend</h4>
            <div className="h-64">
              {audits.length > 0 ? (
                <div className="w-full h-full">
                  <div className="text-slate-400 text-sm mb-4">
                    Showing last {Math.min(audits.length, 10)} audits
                  </div>
                  <div className="space-y-2">
                    {audits.slice(0, 10).map((audit, index) => (
                      <div key={audit.id} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                        <div className="text-slate-300 text-sm">
                          {new Date(audit.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-600 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getScoreColor(audit.overall_score).replace('text-', 'bg-')}`}
                              style={{ width: `${audit.overall_score}%` }}
                            />
                          </div>
                          <div className={`text-sm font-medium ${getScoreColor(audit.overall_score)}`}>
                            {audit.overall_score}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 bg-slate-700 rounded-lg flex items-center justify-center">
                  <p className="text-slate-400">No audit data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Category Performance */}
          <div className="bg-slate-800 p-6 rounded-lg">
            <h4 className="text-white font-medium mb-4">Performance by Category</h4>
            <div className="space-y-3">
              {Array.from(new Set(audits.map(a => a.category))).map(category => {
                const categoryAudits = audits.filter(a => a.category === category)
                const avgScore = categoryAudits.reduce((sum, a) => sum + a.overall_score, 0) / categoryAudits.length
                return (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-slate-300">{category}</span>
                    <div className="flex items-center gap-2">
                      <div className={`font-bold ${getScoreColor(avgScore)}`}>
                        {avgScore.toFixed(1)}
                      </div>
                      <div className="text-slate-500 text-sm">({categoryAudits.length} audits)</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {view === 'competitors' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Competitor Analysis</h3>
          
          <div className="bg-slate-800 p-6 rounded-lg">
            <h4 className="text-white font-medium mb-4">Market Position</h4>
            <div className="space-y-4">
              {audits.slice(0, 3).map((audit, index) => (
                <div key={audit.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{audit.business_name}</div>
                    <div className="text-slate-400 text-sm">{audit.category}</div>
                  </div>
                  <div className={`font-bold ${getScoreColor(audit.overall_score)}`}>
                    {audit.overall_score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Items */}
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Action Items</h3>
        <div className="space-y-3">
          {actionItems.length === 0 ? (
            <p className="text-slate-400">No action items yet. Run an audit to generate recommendations.</p>
          ) : (
            actionItems.map((item) => (
              <div key={item.id} className="border border-slate-600 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-medium">{item.title}</h4>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full text-white ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full text-white ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
                <p className="text-slate-300 text-sm mb-2">{item.description}</p>
                <div className="text-slate-500 text-xs">
                  Due: {new Date(item.due_date).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Audit Details Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{selectedAudit.business_name}</h3>
              <button
                onClick={() => setSelectedAudit(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm">Category</label>
                  <div className="text-white">{selectedAudit.category}</div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Score</label>
                  <div className={`font-bold ${getScoreColor(selectedAudit.overall_score)}`}>
                    {selectedAudit.overall_score}/100
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Date</label>
                  <div className="text-white">
                    {new Date(selectedAudit.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Status</label>
                  <div className="text-white">{selectedAudit.status}</div>
                </div>
              </div>

              {selectedAudit.audit_data?.recommendations && (
                <div>
                  <h4 className="text-white font-medium mb-2">Recommendations</h4>
                  <div className="space-y-2">
                    {selectedAudit.audit_data.recommendations.immediate?.map((rec: string, index: number) => (
                      <div key={index} className="text-slate-300 text-sm">• {rec}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 