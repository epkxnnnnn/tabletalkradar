'use client'

import React, { useState, useEffect } from 'react'
import { useAgency } from '../../providers/AgencyProvider'
import { useAuth } from '../../providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { AutomationWorkflow, WorkflowType, WorkflowStatus, EnhancedClient } from '@/lib/types/agency'

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  type: WorkflowType
  icon: string
  triggers: any
  actions: any
  conditions?: any
}

interface AutomationLog {
  id: string
  workflow_id: string
  status: WorkflowStatus
  started_at: string
  completed_at?: string
  actions_taken?: any
  results?: any
  error_message?: string
  client_name?: string
  workflow?: {
    name: string
  }
  client?: {
    business_name: string
  }
}

export default function AutomationWorkflows() {
  const { currentAgency, permissions } = useAgency()
  const { user } = useAuth()
  
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([])
  const [logs, setLogs] = useState<AutomationLog[]>([])
  const [clients, setClients] = useState<EnhancedClient[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null)
  const [workflowForm, setWorkflowForm] = useState({
    name: '',
    description: '',
    client_id: '',
    schedule: 'daily'
  })

  // Pre-defined workflow templates
  const workflowTemplates: WorkflowTemplate[] = [
    {
      id: 'review_monitor',
      name: 'Review Monitoring',
      description: 'Automatically monitor new reviews across all platforms and send alerts for negative feedback',
      type: 'review_management',
      icon: '⭐',
      triggers: {
        type: 'schedule',
        interval: 'hourly',
        platforms: ['google', 'yelp', 'facebook', 'tripadvisor']
      },
      actions: {
        check_reviews: true,
        alert_negative: true,
        score_threshold: 3,
        notification_channels: ['email', 'dashboard']
      },
      conditions: {
        rating_below: 4,
        new_reviews_only: true
      }
    },
    {
      id: 'seo_report',
      name: 'Weekly SEO Report',
      description: 'Generate comprehensive SEO performance reports and send to clients',
      type: 'reporting',
      icon: '📊',
      triggers: {
        type: 'schedule',
        interval: 'weekly',
        day: 'monday',
        time: '09:00'
      },
      actions: {
        generate_seo_report: true,
        include_rankings: true,
        include_traffic: true,
        send_to_client: true,
        save_to_dashboard: true
      }
    },
    {
      id: 'social_posting',
      name: 'Social Media Scheduling',
      description: 'Schedule and post content across social media platforms based on optimal timing',
      type: 'social_media',
      icon: '📱',
      triggers: {
        type: 'schedule',
        interval: 'daily',
        optimal_times: true
      },
      actions: {
        post_content: true,
        platforms: ['facebook', 'instagram', 'linkedin'],
        content_queue: true,
        engagement_tracking: true
      }
    },
    {
      id: 'competitor_watch',
      name: 'Competitor Monitoring',
      description: 'Track competitor activities, pricing changes, and market positioning',
      type: 'monitoring',
      icon: '🔍',
      triggers: {
        type: 'schedule',
        interval: 'daily',
        time: '06:00'
      },
      actions: {
        scan_competitors: true,
        price_monitoring: true,
        content_analysis: true,
        alert_changes: true
      }
    },
    {
      id: 'client_health',
      name: 'Client Health Check',
      description: 'Monitor client website performance, uptime, and key metrics',
      type: 'monitoring',
      icon: '💚',
      triggers: {
        type: 'schedule',
        interval: 'hourly'
      },
      actions: {
        website_uptime: true,
        performance_check: true,
        alert_issues: true,
        health_score_update: true
      }
    }
  ]

  useEffect(() => {
    if (currentAgency) {
      loadWorkflowData()
    }
  }, [currentAgency])

  const loadWorkflowData = async () => {
    if (!currentAgency) return

    setLoading(true)
    try {
      // Load workflows
      const { data: workflowData, error: workflowError } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('agency_id', currentAgency.id)
        .order('created_at', { ascending: false })

      if (!workflowError) {
        setWorkflows(workflowData || [])
      }

      // Load recent logs
      const { data: logData, error: logError } = await supabase
        .from('automation_logs')
        .select(`
          *,
          workflow:automation_workflows(name),
          client:clients(business_name)
        `)
        .eq('agency_id', currentAgency.id)
        .order('started_at', { ascending: false })
        .limit(20)

      if (!logError) {
        const formattedLogs = logData?.map(log => ({
          ...log,
          client_name: log.client?.business_name
        })) || []
        setLogs(formattedLogs)
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
      console.error('Error loading workflow data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkflow = async () => {
    if (!currentAgency || !selectedTemplate || !user) return

    try {
      const workflow = {
        agency_id: currentAgency.id,
        client_id: workflowForm.client_id || null,
        name: workflowForm.name || selectedTemplate.name,
        description: workflowForm.description || selectedTemplate.description,
        workflow_type: selectedTemplate.type,
        triggers: selectedTemplate.triggers,
        actions: selectedTemplate.actions,
        conditions: selectedTemplate.conditions,
        is_active: true,
        total_runs: 0,
        successful_runs: 0,
        failed_runs: 0,
        created_by: user.id
      }

      const { error } = await supabase
        .from('automation_workflows')
        .insert(workflow)

      if (error) throw error

      await loadWorkflowData()
      setShowCreateModal(false)
      setSelectedTemplate(null)
      setWorkflowForm({ name: '', description: '', client_id: '', schedule: 'daily' })

    } catch (error) {
      console.error('Error creating workflow:', error)
      alert('Failed to create workflow. Please try again.')
    }
  }

  const handleToggleWorkflow = async (workflowId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('automation_workflows')
        .update({ is_active: !isActive })
        .eq('id', workflowId)

      if (error) throw error
      await loadWorkflowData()
    } catch (error) {
      console.error('Error toggling workflow:', error)
    }
  }

  const getStatusBadge = (status: WorkflowStatus) => {
    switch (status) {
      case 'running':
        return <span className="px-2 py-1 bg-blue-900/20 text-blue-400 rounded-full text-xs">Running</span>
      case 'completed':
        return <span className="px-2 py-1 bg-green-900/20 text-green-400 rounded-full text-xs">Completed</span>
      case 'failed':
        return <span className="px-2 py-1 bg-red-900/20 text-red-400 rounded-full text-xs">Failed</span>
      case 'cancelled':
        return <span className="px-2 py-1 bg-yellow-900/20 text-yellow-400 rounded-full text-xs">Cancelled</span>
      default:
        return <span className="px-2 py-1 bg-slate-700 text-slate-400 rounded-full text-xs">{status}</span>
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

  const getWorkflowTypeIcon = (type: WorkflowType) => {
    switch (type) {
      case 'review_management': return '⭐'
      case 'social_media': return '📱'
      case 'seo': return '🔍'
      case 'reporting': return '📊'
      case 'monitoring': return '👀'
      default: return '⚡'
    }
  }

  if (!permissions?.can_manage_automations) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <div className="text-slate-400 mb-4">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No Access</h3>
        <p className="text-slate-400">You don&apos;t have permission to manage automation workflows.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Automation Workflows</h2>
          <p className="text-slate-400">Automate repetitive tasks and improve efficiency</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Create Workflow
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{workflows.length}</div>
          <div className="text-sm text-slate-400">Total Workflows</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-400">{workflows.filter(w => w.is_active).length}</div>
          <div className="text-sm text-slate-400">Active</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-400">
            {workflows.reduce((sum, w) => sum + w.total_runs, 0)}
          </div>
          <div className="text-sm text-slate-400">Total Runs</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-400">
            {Math.round((workflows.reduce((sum, w) => sum + w.successful_runs, 0) / Math.max(workflows.reduce((sum, w) => sum + w.total_runs, 0), 1)) * 100)}%
          </div>
          <div className="text-sm text-slate-400">Success Rate</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Workflows */}
        <div className="lg:col-span-2 bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Your Workflows</h3>
          
          {loading ? (
            <div className="text-center text-slate-400 py-8">Loading workflows...</div>
          ) : workflows.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-lg font-medium mb-2">No Workflows Yet</h3>
              <p className="mb-4">Create your first automation workflow to start saving time.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Create Your First Workflow
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {workflows.map(workflow => (
                <div key={workflow.id} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getWorkflowTypeIcon(workflow.workflow_type)}</div>
                      <div>
                        <h4 className="font-medium text-white">{workflow.name}</h4>
                        <p className="text-sm text-slate-400">{workflow.description}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500">
                          <span>{workflow.total_runs} runs</span>
                          <span>{workflow.successful_runs} successful</span>
                          {workflow.last_run_at && (
                            <span>Last run {formatTimeAgo(workflow.last_run_at)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        workflow.is_active 
                          ? 'bg-green-900/20 text-green-400' 
                          : 'bg-red-900/20 text-red-400'
                      }`}>
                        {workflow.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleToggleWorkflow(workflow.id, workflow.is_active)}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          workflow.is_active
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {workflow.is_active ? 'Pause' : 'Start'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          
          {logs.length === 0 ? (
            <div className="text-center text-slate-400 py-6">
              <div className="text-3xl mb-2">📋</div>
              <p>No activity yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.slice(0, 10).map(log => (
                <div key={log.id} className="flex items-start space-x-3 p-3 hover:bg-slate-700 rounded-lg">
                  <div className="text-lg">
                    {log.status === 'completed' ? '✅' : 
                     log.status === 'failed' ? '❌' : 
                     log.status === 'running' ? '⏳' : '⏹️'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-sm font-medium">{log.workflow?.name || 'Unknown Workflow'}</p>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(log.status)}
                        <span className="text-slate-400 text-xs">{formatTimeAgo(log.started_at)}</span>
                      </div>
                    </div>
                    {log.client_name && (
                      <p className="text-slate-400 text-xs">Client: {log.client_name}</p>
                    )}
                    {log.error_message && (
                      <p className="text-red-400 text-xs mt-1">{log.error_message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-semibold text-white">Create Automation Workflow</h3>
            </div>
            
            <div className="p-6">
              {!selectedTemplate ? (
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Choose a Template</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workflowTemplates.map(template => (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className="bg-slate-700 rounded-lg p-4 cursor-pointer hover:bg-slate-600 transition-colors"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="text-2xl">{template.icon}</div>
                          <h5 className="font-medium text-white">{template.name}</h5>
                        </div>
                        <p className="text-slate-400 text-sm">{template.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="text-2xl">{selectedTemplate.icon}</div>
                      <h4 className="font-medium text-white">{selectedTemplate.name}</h4>
                    </div>
                    <p className="text-slate-400 text-sm">{selectedTemplate.description}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Workflow Name
                      </label>
                      <input
                        type="text"
                        value={workflowForm.name}
                        onChange={(e) => setWorkflowForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder={selectedTemplate.name}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        value={workflowForm.description}
                        onChange={(e) => setWorkflowForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 h-20"
                        placeholder={selectedTemplate.description}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Target Client (Optional)
                      </label>
                      <select
                        value={workflowForm.client_id}
                        onChange={(e) => setWorkflowForm(prev => ({ ...prev, client_id: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">All Clients</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.business_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-slate-700">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setSelectedTemplate(null)
                  setWorkflowForm({ name: '', description: '', client_id: '', schedule: 'daily' })
                }}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors"
              >
                Cancel
              </button>
              {selectedTemplate && (
                <button
                  onClick={handleCreateWorkflow}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  Create Workflow
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}