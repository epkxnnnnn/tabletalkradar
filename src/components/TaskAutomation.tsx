'use client'

import React, { useState, useEffect } from 'react'
import { useAgency } from './AgencyProvider'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { EnhancedClient } from '@/lib/types/agency'

interface TaskItem {
  id: string
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
  created_at: string
  due_date?: string
  assigned_to?: string
}

interface TaskAnalysisRequest {
  client_id?: string
  analysis_type: 'comprehensive' | 'critical_only' | 'optimization_focus'
  include_automation: boolean
  timeframe: '24_hours' | '7_days' | '30_days' | 'long_term'
}

interface TaskSuggestion {
  category: string
  tasks: TaskItem[]
  automation_opportunities: number
  total_impact_score: number
}

export default function TaskAutomation() {
  const { currentAgency, permissions } = useAgency()
  const { user } = useAuth()
  
  const [clients, setClients] = useState<EnhancedClient[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [analysisForm, setAnalysisForm] = useState<TaskAnalysisRequest>({
    client_id: '',
    analysis_type: 'comprehensive',
    include_automation: true,
    timeframe: '7_days'
  })
  
  const taskCategories = [
    { 
      id: 'critical', 
      name: 'Critical Fixes', 
      description: 'Urgent issues requiring immediate attention (0-24 hours)', 
      icon: '🚨', 
      color: 'text-red-400',
      bgColor: 'bg-red-900/20'
    },
    { 
      id: 'high_impact', 
      name: 'High-Impact Optimizations', 
      description: 'Quick wins with significant business impact (1-7 days)', 
      icon: '⚡', 
      color: 'text-orange-400',
      bgColor: 'bg-orange-900/20'
    },
    { 
      id: 'strategic', 
      name: 'Strategic Initiatives', 
      description: 'Medium-term projects for growth (1-30 days)', 
      icon: '🎯', 
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20'
    },
    { 
      id: 'long_term', 
      name: 'Long-term Projects', 
      description: 'Strategic developments (30+ days)', 
      icon: '🚀', 
      color: 'text-green-400',
      bgColor: 'bg-green-900/20'
    }
  ]

  const analysisTypes = [
    { id: 'comprehensive', name: 'Comprehensive Analysis', description: 'Full business assessment with all task categories' },
    { id: 'critical_only', name: 'Critical Issues Only', description: 'Focus on urgent fixes and immediate attention items' },
    { id: 'optimization_focus', name: 'Optimization Focus', description: 'High-impact improvements and strategic opportunities' }
  ]

  const timeframeOptions = [
    { id: '24_hours', name: '24 Hours', description: 'Critical and immediate tasks only' },
    { id: '7_days', name: '7 Days', description: 'Short-term tactical improvements' },
    { id: '30_days', name: '30 Days', description: 'Strategic initiatives and medium-term projects' },
    { id: 'long_term', name: 'Long-term', description: 'All projects including strategic developments' }
  ]

  const managementTabs = [
    { id: 'overview', name: 'Task Overview', icon: '📋' },
    { id: 'critical', name: 'Critical Tasks', icon: '🚨' },
    { id: 'automation', name: 'Automation Queue', icon: '🤖' },
    { id: 'analytics', name: 'Task Analytics', icon: '📊' }
  ]

  useEffect(() => {
    if (currentAgency) {
      loadTaskData()
    }
  }, [currentAgency])

  const loadTaskData = async () => {
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

      // Load existing tasks
      const { data: taskData, error: taskError } = await supabase
        .from('task_automation')
        .select('*')
        .eq('agency_id', currentAgency.id)
        .order('priority_score', { ascending: false })
        .limit(50)

      if (!taskError && taskData) {
        setTasks(taskData)
      }

    } catch (error) {
      console.error('Error loading task data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateTaskAnalysis = async () => {
    if (!currentAgency || !user) return

    setAnalyzing(true)
    try {
      const client = analysisForm.client_id ? clients.find(c => c.id === analysisForm.client_id) : null
      
      const response = await fetch('/api/tasks/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agency_id: currentAgency.id,
          client_id: analysisForm.client_id || null,
          analysis_type: analysisForm.analysis_type,
          timeframe: analysisForm.timeframe,
          include_automation: analysisForm.include_automation,
          industry: client?.industry || null,
          business_name: client?.business_name || currentAgency.name,
          location: client?.location || null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze tasks')
      }

      const result = await response.json()
      
      if (result.success) {
        await loadTaskData()
        setShowAnalysisModal(false)
        setAnalysisForm({
          client_id: '',
          analysis_type: 'comprehensive',
          include_automation: true,
          timeframe: '7_days'
        })
        
        alert(`Task analysis complete! Generated ${result.taskCount} prioritized tasks.`)
      } else {
        throw new Error(result.error || 'Unknown error')
      }

    } catch (error) {
      console.error('Error generating task analysis:', error)
      alert(`Failed to analyze tasks: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: TaskItem['status']) => {
    try {
      const { error } = await supabase
        .from('task_automation')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId)

      if (!error) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        ))
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-400 bg-green-900/20'
      case 'medium': return 'text-yellow-400 bg-yellow-900/20'
      case 'high': return 'text-red-400 bg-red-900/20'
      default: return 'text-slate-400 bg-slate-900/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-900/20'
      case 'in_progress': return 'text-blue-400 bg-blue-900/20'
      case 'automated': return 'text-purple-400 bg-purple-900/20'
      default: return 'text-slate-400 bg-slate-900/20'
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

  const renderTaskCard = (task: TaskItem) => {
    const categoryInfo = taskCategories.find(cat => cat.id === task.category)
    
    return (
      <div key={task.id} className={`p-4 rounded-lg border ${categoryInfo?.bgColor} border-slate-600 hover:border-slate-500 transition-colors`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-lg">{categoryInfo?.icon}</span>
              <h3 className="text-white font-semibold">{task.title}</h3>
              {task.automation_possible && (
                <span className="px-2 py-1 text-xs bg-purple-900/30 text-purple-400 rounded-full">
                  Auto
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-2">{task.description}</p>
            {task.client_id && (
              <p className="text-slate-500 text-xs">
                Client: {clients.find(c => c.id === task.client_id)?.business_name}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white mb-1">{task.impact_score}/10</div>
            <div className="text-xs text-slate-400">Impact Score</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-2 py-1 text-xs rounded-full ${getComplexityColor(task.complexity)}`}>
            {task.complexity} complexity
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
            {task.status}
          </span>
          <span className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded-full">
            {task.timeline}
          </span>
        </div>

        <div className="space-y-2 mb-3">
          <div>
            <h4 className="text-xs font-medium text-slate-300 mb-1">Success Metrics:</h4>
            <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5">
              {task.success_metrics.slice(0, 2).map((metric, idx) => (
                <li key={idx}>{metric}</li>
              ))}
            </ul>
          </div>
          
          {task.dependencies.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-slate-300 mb-1">Dependencies:</h4>
              <p className="text-xs text-slate-400">{task.dependencies.join(', ')}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-600">
          <span className="text-xs text-slate-500">
            Created {formatTimeAgo(task.created_at)}
          </span>
          <div className="flex space-x-2">
            {task.status === 'pending' && (
              <button
                onClick={() => updateTaskStatus(task.id, 'in_progress')}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Start Task
              </button>
            )}
            {task.status === 'in_progress' && (
              <button
                onClick={() => updateTaskStatus(task.id, 'completed')}
                className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                Complete
              </button>
            )}
            {task.automation_possible && task.status === 'pending' && (
              <button
                onClick={() => updateTaskStatus(task.id, 'automated')}
                className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              >
                Automate
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!permissions?.can_manage_automations) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <div className="text-slate-400 mb-4">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Access Required</h3>
        <p className="text-slate-400">Task automation requires automation management permissions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Task Automation</h2>
          <p className="text-slate-400">AI-powered task prioritization and automation management</p>
        </div>
        <button
          onClick={() => setShowAnalysisModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Analyze Tasks
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {taskCategories.map(category => {
          const categoryTasks = tasks.filter(t => t.category === category.id)
          return (
            <div key={category.id} className="bg-slate-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{category.icon}</span>
                <span className={`text-lg font-bold ${category.color}`}>
                  {categoryTasks.length}
                </span>
              </div>
              <div className="text-sm text-slate-400">{category.name}</div>
              <div className="text-xs text-slate-500 mt-1">
                {categoryTasks.filter(t => t.automation_possible).length} automatable
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-700">
        <nav className="flex space-x-8 overflow-x-auto">
          {managementTabs.map(tab => (
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

      {/* Task Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="text-center text-slate-400 py-12">Loading task analysis...</div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {tasks.length > 0 ? (
                  taskCategories.map(category => {
                    const categoryTasks = tasks.filter(t => t.category === category.id).slice(0, 3)
                    if (categoryTasks.length === 0) return null
                    
                    return (
                      <div key={category.id} className="space-y-4">
                        <h3 className={`text-lg font-semibold flex items-center space-x-2 ${category.color}`}>
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                          <span className="text-sm font-normal text-slate-400">({categoryTasks.length})</span>
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                          {categoryTasks.map(renderTaskCard)}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center text-slate-400 py-12">
                    <div className="text-4xl mb-4">📋</div>
                    <h3 className="text-lg font-medium mb-2">No Tasks Generated</h3>
                    <p className="mb-4">Run task analysis to generate prioritized action items.</p>
                    <button
                      onClick={() => setShowAnalysisModal(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      Analyze Tasks
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'critical' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {tasks.filter(t => t.category === 'critical').map(renderTaskCard)}
                {tasks.filter(t => t.category === 'critical').length === 0 && (
                  <div className="lg:col-span-2 text-center text-slate-400 py-12">
                    <div className="text-4xl mb-4">🚨</div>
                    <h3 className="text-lg font-medium mb-2">No Critical Tasks</h3>
                    <p>All urgent issues have been resolved or no critical issues detected.</p>
                  </div>
                )}
              </div>
            )}

            {['automation', 'analytics'].includes(activeTab) && (
              <div className="text-center text-slate-400 py-12">
                <div className="text-4xl mb-4">
                  {managementTabs.find(t => t.id === activeTab)?.icon}
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {managementTabs.find(t => t.id === activeTab)?.name}
                </h3>
                <p>Advanced {activeTab} features coming soon.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Task Analysis Modal */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-2xl">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-semibold text-white">Generate Task Analysis</h3>
              <p className="text-slate-400 text-sm mt-1">AI-powered task prioritization and automation recommendations</p>
              <div className="mt-2 text-xs text-slate-500">
                🤖 Uses intelligent task management prompts for optimal prioritization
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Analysis Type
                  </label>
                  <select
                    value={analysisForm.analysis_type}
                    onChange={(e) => setAnalysisForm(prev => ({ ...prev, analysis_type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {analysisTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    {analysisTypes.find(t => t.id === analysisForm.analysis_type)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Timeframe
                  </label>
                  <select
                    value={analysisForm.timeframe}
                    onChange={(e) => setAnalysisForm(prev => ({ ...prev, timeframe: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {timeframeOptions.map(timeframe => (
                      <option key={timeframe.id} value={timeframe.id}>{timeframe.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    {timeframeOptions.find(t => t.id === analysisForm.timeframe)?.description}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target Client (Optional)
                </label>
                <select
                  value={analysisForm.client_id}
                  onChange={(e) => setAnalysisForm(prev => ({ ...prev, client_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">All Clients / Agency-wide Analysis</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.business_name} ({client.industry})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={analysisForm.include_automation}
                    onChange={(e) => setAnalysisForm(prev => ({ ...prev, include_automation: e.target.checked }))}
                    className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
                  />
                  <span className="text-slate-300 text-sm">Include automation opportunities analysis</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-slate-700">
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateTaskAnalysis}
                disabled={analyzing}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {analyzing ? 'Analyzing...' : 'Generate Analysis'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}