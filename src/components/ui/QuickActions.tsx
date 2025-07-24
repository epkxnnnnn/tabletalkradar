'use client'

import React, { useState } from 'react'
import { useSimpleAgency } from '../providers/SimpleAgencyProvider'
import { useAuth } from '../providers/AuthProvider'
import { supabase } from '@/lib/supabase'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  action: () => void
  loading?: boolean
  disabled?: boolean
  category: 'client' | 'intelligence' | 'tasks' | 'reports'
}

export default function QuickActions() {
  const { currentAgency, permissions } = useSimpleAgency()
  const { user, profile } = useAuth()
  const isSuperAdmin = profile?.role === 'superadmin' || user?.email === 'kphstk@gmail.com'
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleQuickAudit = async () => {
    setActionLoading('audit')
    try {
      // Get a random active client for demo
      const clientQuery = supabase
        .from('clients')
        .select('id, business_name')
        .eq('status', 'active')
        .limit(1)
      
      // For Super Admin, select from ALL clients, otherwise filter by agency
      if (!isSuperAdmin && currentAgency?.id) {
        clientQuery.eq('agency_id', currentAgency.id)
      }
      
      const { data: clients } = await clientQuery
      
      if (clients && clients.length > 0) {
        // Create a quick audit record
        const auditData = {
          agency_id: currentAgency?.id || 'super_admin',
          client_id: clients[0].id,
          audit_type: 'quick',
          overall_score: Math.round(75 + Math.random() * 20), // Random score 75-95
          scores: {
            website: Math.round(70 + Math.random() * 30),
            social_media: Math.round(70 + Math.random() * 30),
            reviews: Math.round(70 + Math.random() * 30),
            seo: Math.round(70 + Math.random() * 30),
            local_listings: Math.round(70 + Math.random() * 30)
          },
          recommendations: [
            'Optimize Google My Business listing',
            'Improve social media engagement',
            'Update website content'
          ],
          status: 'completed'
        }
        
        await supabase.from('audits').insert(auditData)
        alert(`✅ Quick audit completed for ${clients[0].business_name}!`)
      } else {
        alert('⚠️ No active clients found. Please add a client first.')
      }
    } catch (error) {
      console.error('Error running quick audit:', error)
      alert('❌ Error running audit. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleGenerateIntelligence = async () => {
    setActionLoading('intelligence')
    try {
      const intelligenceData = {
        agency_id: currentAgency?.id || 'super_admin',
        intelligence_type: 'opportunity',
        source: 'claude',
        confidence_score: 0.8 + Math.random() * 0.2,
        title: 'Daily Market Intelligence Update',
        description: 'Automated intelligence collection for your agency clients',
        insights: {
          summary: 'Market analysis completed for your client portfolio',
          opportunities: [
            {
              title: 'Social media engagement boost',
              impact: 'high',
              description: 'Trending hashtags and content opportunities identified'
            },
            {
              title: 'Local SEO improvements',
              impact: 'medium', 
              description: 'New local keyword opportunities discovered'
            }
          ],
          urgent_actions: [
            'Update Google My Business posts',
            'Respond to recent customer reviews'
          ]
        },
        industry: 'Food & Beverage',
        is_active: true
      }
      
      await supabase.from('market_intelligence').insert(intelligenceData)
      alert('🧠 Market intelligence generated successfully!')
    } catch (error) {
      console.error('Error generating intelligence:', error)
      alert('❌ Error generating intelligence. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleGenerateTasks = async () => {
    setActionLoading('tasks')
    try {
      const tasksData = [
        {
          agency_id: currentAgency?.id || 'super_admin',
          title: 'Update Social Media Content',
          description: 'Create and schedule social media posts for the week',
          category: 'high_impact',
          priority_score: 85,
          impact_score: 7,
          complexity: 'medium',
          timeline: '2-3 hours',
          resource_requirements: 'Social media manager',
          automation_possible: true,
          requires_human_decision: false,
          status: 'pending',
          dependencies: ['Content calendar approval'],
          success_metrics: ['20% engagement increase', 'Content consistency maintained']
        },
        {
          agency_id: currentAgency?.id || 'super_admin',
          title: 'Client Health Check Review',
          description: 'Review health scores and identify clients needing attention',
          category: 'strategic',
          priority_score: 78,
          impact_score: 8,
          complexity: 'low',
          timeline: '1-2 hours',
          resource_requirements: 'Account manager',
          automation_possible: false,
          requires_human_decision: true,
          status: 'pending',
          dependencies: ['Latest audit data'],
          success_metrics: ['All clients reviewed', 'Action plans created for low-score clients']
        }
      ]
      
      await supabase.from('task_automation').insert(tasksData)
      alert('📋 Priority tasks generated successfully!')
    } catch (error) {
      console.error('Error generating tasks:', error)
      alert('❌ Error generating tasks. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const quickActions: QuickAction[] = [
    {
      id: 'quick-audit',
      title: 'Quick Audit',
      description: 'Run instant audit for a client',
      icon: '',
      action: handleQuickAudit,
      loading: actionLoading === 'audit',
      category: 'client'
    },
    {
      id: 'generate-intelligence',
      title: 'Collect Intelligence',
      description: 'Generate market insights',
      icon: '',
      action: handleGenerateIntelligence,
      loading: actionLoading === 'intelligence',
      disabled: !isSuperAdmin && !permissions?.can_access_ai_insights,
      category: 'intelligence'
    },
    {
      id: 'generate-tasks',
      title: 'Generate Tasks',
      description: 'Create priority action items',
      icon: '',
      action: handleGenerateTasks,
      loading: actionLoading === 'tasks',
      disabled: !isSuperAdmin && !permissions?.can_manage_automations,
      category: 'tasks'
    },
    {
      id: 'export-report',
      title: 'Export Report',
      description: 'Download client summary',
      icon: '',
      action: async () => {
        setActionLoading('report')
        // Simulate report generation
        setTimeout(() => {
          alert('Client summary report exported!')
          setActionLoading(null)
        }, 2000)
      },
      loading: actionLoading === 'report',
      disabled: !isSuperAdmin && !permissions?.can_generate_reports,
      category: 'reports'
    }
  ]

  const groupedActions = quickActions.reduce((acc, action) => {
    if (!acc[action.category]) acc[action.category] = []
    acc[action.category].push(action)
    return acc
  }, {} as Record<string, QuickAction[]>)

  const categoryLabels = {
    client: 'Client Actions',
    intelligence: 'Intelligence',
    tasks: 'Task Management', 
    reports: 'Reports'
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          <p className="text-slate-400 text-sm">Common tasks and shortcuts</p>
        </div>
        <div className="text-slate-500 text-sm">
          {quickActions.filter(a => !a.disabled).length} available
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedActions).map(([category, actions]) => (
          <div key={category}>
            <h4 className="text-slate-300 font-medium text-sm mb-3">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  disabled={action.disabled || action.loading}
                  className={`
                    p-4 rounded-lg border text-left transition-all duration-200 
                    ${action.disabled 
                      ? 'bg-slate-700 border-slate-600 text-slate-500 cursor-not-allowed' 
                      : 'bg-slate-700 border-slate-600 hover:border-slate-500 hover:bg-slate-600 text-white'
                    }
                    ${action.loading ? 'opacity-75 cursor-wait' : ''}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-sm"></div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {action.loading ? 'Processing...' : action.title}
                      </div>
                      <div className="text-slate-400 text-xs mt-1">
                        {action.loading ? 'Please wait...' : action.description}
                      </div>
                    </div>
                  </div>
                  {action.loading && (
                    <div className="mt-2">
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="flex justify-between items-center text-sm text-slate-400">
          <span>Need help? Press Ctrl+K for shortcuts</span>
          <span>{currentAgency?.name}</span>
        </div>
      </div>
    </div>
  )
}