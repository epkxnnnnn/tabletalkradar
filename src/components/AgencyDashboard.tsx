'use client'

import React, { useState, useEffect } from 'react'
import { useSimpleAgency as useAgency } from './SimpleAgencyProvider'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import ClientOnboarding from './ClientOnboarding'
import TeamManagementAgency from './TeamManagementAgency'
import AutomationWorkflows from './AutomationWorkflows'
import MarketIntelligenceComponent from './MarketIntelligence'
import AgencySettings from './AgencySettings'
import AdvancedAnalytics from './AdvancedAnalytics'
import PredictiveAnalytics from './PredictiveAnalytics'
import TaskAutomation from './TaskAutomation'
import QuickActions from './QuickActions'
import AIAnalysisPanel from './AIAnalysisPanel'
import ReviewResponder from './ReviewResponder'
import ManualPostHelper from './ManualPostHelper'
import ClientUserInvite from './ClientUserInvite'
import { 
  EnhancedClient, 
  ClientPerformanceMetrics,
  MarketIntelligence,
  AutomationWorkflow,
  AgencyDashboardData 
} from '@/lib/types/agency'

interface DashboardStats {
  totalClients: number
  activeClients: number
  avgClientScore: number
  monthlyAudits: number
  pendingAlerts: number
  opportunities: number
}

interface RecentActivity {
  id: string
  type: 'audit' | 'alert' | 'opportunity' | 'client'
  title: string
  description: string
  timestamp: string
  client?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

export default function AgencyDashboard() {
  const { currentAgency, membership, permissions, availableAgencies, switchAgency, agenciesLoading } = useAgency()
  const { user, signOut, profile } = useAuth()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [showClientOnboarding, setShowClientOnboarding] = useState(false)
  const [dashboardData, setDashboardData] = useState<AgencyDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    avgClientScore: 0,
    monthlyAudits: 0,
    pendingAlerts: 0,
    opportunities: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [topClients, setTopClients] = useState<EnhancedClient[]>([])

  const isSuperAdmin = profile?.role === 'superadmin' || user?.email === 'kphstk@gmail.com'

  // Load dashboard data
  useEffect(() => {
    if (user && (currentAgency || isSuperAdmin)) {
      loadDashboardData()
    }
  }, [user, currentAgency, membership, isSuperAdmin])

  const loadDashboardData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Load clients using API endpoint which handles Super Admin permissions
      let clients = []
      try {
        const response = await fetch('/api/clients')
        if (response.ok) {
          const data = await response.json()
          clients = data.clients || data.locations || []
        } else {
          console.log('API clients endpoint failed, trying direct query')
          // Fallback to direct query
          const query = supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false })
          
          // For Super Admin, load ALL clients, otherwise filter by user
          if (!isSuperAdmin) {
            query.eq('user_id', user?.id)
          }
          
          const { data: clientsData, error: clientsError } = await query
          if (!clientsError && clientsData) {
            clients = clientsData
          }
        }
      } catch (error) {
        console.log('Error loading clients:', error)
        clients = []
      }

      // Try to load recent audits, but handle errors gracefully
      let audits = []
      try {
        const auditsQuery = supabase
          .from('audits')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
        
        // For Super Admin, load ALL audits, otherwise filter by user
        if (!isSuperAdmin) {
          auditsQuery.eq('user_id', user?.id)
        }

        const { data: auditsData, error: auditsError } = await auditsQuery
        if (!auditsError && auditsData) {
          audits = auditsData
        }
      } catch (error) {
        console.log('Audits table not found, using empty array')
        audits = []
      }

      // Try to load market intelligence, but handle errors gracefully
      let intelligence = []
      try {
        const intelligenceQuery = supabase
          .from('market_intelligence')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(5)
        
        // For Super Admin, load ALL intelligence, otherwise filter by user
        if (!isSuperAdmin) {
          intelligenceQuery.eq('user_id', user?.id)
        }

        const { data: intelligenceData, error: intelligenceError } = await intelligenceQuery
        if (!intelligenceError && intelligenceData) {
          intelligence = intelligenceData
        }
      } catch (error) {
        console.log('Market intelligence table not found, using empty array')
        intelligence = []
      }

      // Calculate stats safely
      const activeClientsCount = clients?.filter((c: any) => c.status === 'active' || !c.status).length || 0
      const avgScore = audits && audits.length > 0 
        ? audits.reduce((sum, audit) => sum + (audit.overall_score || 0), 0) / audits.length 
        : 0

      setStats({
        totalClients: clients?.length || 0,
        activeClients: activeClientsCount,
        avgClientScore: Math.round(avgScore),
        monthlyAudits: audits?.filter(a => {
          if (!a.created_at) return false
          const auditDate = new Date(a.created_at)
          const now = new Date()
          return auditDate.getMonth() === now.getMonth() && auditDate.getFullYear() === now.getFullYear()
        }).length || 0,
        pendingAlerts: intelligence?.filter(i => i.intelligence_type === 'risk').length || 0,
        opportunities: intelligence?.filter(i => i.intelligence_type === 'opportunity').length || 0
      })

      // Set top performing clients safely
      const clientsWithScores = clients?.map((client: any) => {
        const recentAudit = audits?.find((a: any) => a.client_id === client.id)
        return {
          ...client,
          last_score: recentAudit?.overall_score || 0,
          last_audit_at: recentAudit?.created_at,
          business_name: client.business_name || client.name || 'Unknown Business',
          industry: client.industry || 'General',
          status: client.status || 'active'
        }
      }).sort((a: any, b: any) => (b.last_score || 0) - (a.last_score || 0)).slice(0, 5) || []
      
      setTopClients(clientsWithScores as EnhancedClient[])

      // Create recent activity safely
      const activities: RecentActivity[] = []
      
      // Add recent audits
      audits?.slice(0, 3).forEach(audit => {
        if (audit.id && audit.created_at) {
          const clientName = clients?.find((c: any) => c.id === audit.client_id)?.business_name || 'Unknown Client'
          activities.push({
            id: audit.id,
            type: 'audit',
            title: 'Audit Completed',
            description: `${clientName} - Score: ${audit.overall_score || 'N/A'}`,
            timestamp: audit.created_at,
            client: clientName,
            priority: (audit.overall_score || 0) > 80 ? 'low' : (audit.overall_score || 0) > 60 ? 'medium' : 'high'
          })
        }
      })

      // Add intelligence as activities
      intelligence?.slice(0, 2).forEach(intel => {
        if (intel.id && intel.created_at) {
          activities.push({
            id: intel.id,
            type: intel.intelligence_type === 'opportunity' ? 'opportunity' : 'alert',
            title: intel.title || 'Market Insight',
            description: intel.description || 'New market intelligence available',
            timestamp: intel.created_at,
            priority: (intel.confidence_score || 0) > 0.8 ? 'high' : 'medium'
          })
        }
      })

      setRecentActivity(activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ))

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
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

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-900/20'
      case 'high': return 'text-orange-400 bg-orange-900/20'
      case 'medium': return 'text-yellow-400 bg-yellow-900/20'
      default: return 'text-green-400 bg-green-900/20'
    }
  }


  const handleClientCreated = async (client: any) => {
    // Refresh dashboard data to show the new client
    await loadDashboardData()
  }

  if (showClientOnboarding) {
    return (
      <ClientOnboarding
        onClientCreated={handleClientCreated}
        onClose={() => setShowClientOnboarding(false)}
      />
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <div className="text-white text-lg font-medium">Loading Dashboard...</div>
          <div className="text-slate-400 text-sm mt-2">
            {isSuperAdmin ? 'Loading all system data as Super Admin' : 'Loading your agency data'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <Image src="/tabletalk-radar-logo.png" alt="TableTalk Radar" width={200} height={60} className="h-12 w-auto" />
        </div>

        {/* Agency Selector */}
        <div className="p-4 border-b border-slate-700">
          <div className="space-y-2">
            <select
              value={currentAgency?.id || ''}
              onChange={(e) => switchAgency(e.target.value)}
              disabled={agenciesLoading}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-md text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {availableAgencies.map(agency => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>
            
            <div className="flex items-center space-x-2">
              {membership && (
                <span className="px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded-full capitalize">
                  {membership.role}
                </span>
              )}
              
              {isSuperAdmin && (
                <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                  SUPER ADMIN
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'overview', name: 'Overview', show: true },
            { id: 'clients', name: 'Clients', show: isSuperAdmin || permissions?.can_create_clients || permissions?.can_edit_clients || permissions?.can_view_all_audits },
            { id: 'reviews', name: 'Reviews', show: isSuperAdmin || permissions?.can_create_clients || permissions?.can_edit_clients },
            { id: 'social', name: 'Social Media', show: isSuperAdmin || permissions?.can_create_clients || permissions?.can_edit_clients },
            { id: 'client-access', name: 'Client Access', show: isSuperAdmin || permissions?.can_create_clients || permissions?.can_edit_clients },
            { id: 'ai-analysis', name: 'AI Analysis', show: isSuperAdmin || permissions?.can_access_ai_insights },
            { id: 'intelligence', name: 'Intelligence', show: isSuperAdmin || permissions?.can_access_ai_insights },
            { id: 'predictive', name: 'Predictive', show: isSuperAdmin || permissions?.can_access_ai_insights },
            { id: 'tasks', name: 'Tasks', show: isSuperAdmin || permissions?.can_manage_automations },
            { id: 'automation', name: 'Automation', show: isSuperAdmin || permissions?.can_manage_automations },
            { id: 'analytics', name: 'Analytics', show: isSuperAdmin || permissions?.can_generate_reports },
            { id: 'reports', name: 'Reports', show: isSuperAdmin || permissions?.can_generate_reports },
            { id: 'team', name: 'Team', show: isSuperAdmin || permissions?.can_manage_roles || permissions?.can_invite_members },
            { id: 'settings', name: 'Settings', show: isSuperAdmin || permissions?.can_edit_agency_settings },
            { id: 'admin', name: 'Admin Panel', show: isSuperAdmin }
          ].filter(tab => tab.show).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>

        {/* User Info & Sign Out */}
        <div className="p-4 border-t border-slate-700">
          <div className="mb-3">
            <div className="text-slate-300 text-sm">
              {user?.email}
              {isSuperAdmin && (
                <span className="block text-xs text-red-400">(Super Admin)</span>
              )}
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
          >
            Sign Out
          </button>
          <div className="mt-2 text-xs text-slate-500 text-center">
            Press Ctrl+K for shortcuts
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <div className="bg-slate-800 p-6 rounded-lg border-l-4 border-blue-500">
                <div>
                  <p className="text-slate-400 text-sm">Total Clients</p>
                  <p className="text-2xl font-bold text-white">{stats.totalClients}</p>
                </div>
              </div>
              
              <div className="bg-slate-800 p-6 rounded-lg border-l-4 border-green-500">
                <div>
                  <p className="text-slate-400 text-sm">Active Clients</p>
                  <p className="text-2xl font-bold text-green-400">{stats.activeClients}</p>
                </div>
              </div>
              
              <div className="bg-slate-800 p-6 rounded-lg border-l-4 border-blue-500">
                <div>
                  <p className="text-slate-400 text-sm">Avg Score</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.avgClientScore}</p>
                </div>
              </div>
              
              <div className="bg-slate-800 p-6 rounded-lg border-l-4 border-purple-500">
                <div>
                  <p className="text-slate-400 text-sm">This Month</p>
                  <p className="text-2xl font-bold text-purple-400">{stats.monthlyAudits}</p>
                </div>
              </div>
              
              <div className="bg-slate-800 p-6 rounded-lg border-l-4 border-orange-500">
                <div>
                  <p className="text-slate-400 text-sm">Alerts</p>
                  <p className="text-2xl font-bold text-orange-400">{stats.pendingAlerts}</p>
                </div>
              </div>
              
              <div className="bg-slate-800 p-6 rounded-lg border-l-4 border-green-500">
                <div>
                  <p className="text-slate-400 text-sm">Opportunities</p>
                  <p className="text-2xl font-bold text-green-400">{stats.opportunities}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <QuickActions />
            
            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Activity */}
              <div className="lg:col-span-2 bg-slate-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-slate-700 rounded-lg transition-colors">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-medium">{activity.title}</h3>
                          <div className="flex items-center space-x-2">
                            {activity.priority && (
                              <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(activity.priority)}`}>
                                {activity.priority}
                              </span>
                            )}
                            <span className="text-slate-400 text-sm">{formatTimeAgo(activity.timestamp)}</span>
                          </div>
                        </div>
                        <p className="text-slate-300 text-sm">{activity.description}</p>
                        {activity.client && (
                          <p className="text-slate-400 text-xs mt-1">Client: {activity.client}</p>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-slate-400 py-8">
                      <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="w-8 h-8 bg-slate-600 rounded"></div>
                      </div>
                      <p>No recent activity</p>
                      <p className="text-sm">Activity will appear here as you work with clients</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Performing Clients */}
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Top Performing Clients</h2>
                <div className="space-y-3">
                  {topClients.length > 0 ? topClients.map((client, index) => (
                    <div key={client.id} className="flex items-center justify-between p-3 hover:bg-slate-700 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-slate-400 text-black' :
                          index === 2 ? 'bg-amber-600 text-black' :
                          'bg-slate-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{client.business_name}</p>
                          <p className="text-slate-400 text-xs">{client.industry || 'General'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${
                          (client as any).last_score >= 80 ? 'text-green-400' :
                          (client as any).last_score >= 60 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {(client as any).last_score || 'N/A'}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {(client as any).last_audit_at ? formatTimeAgo((client as any).last_audit_at) : 'No audit'}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-slate-400 py-6">
                      <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <div className="w-6 h-6 bg-slate-600 rounded"></div>
                      </div>
                      <p>No clients yet</p>
                      <p className="text-sm">Add clients to see performance rankings</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clients' && (isSuperAdmin || permissions?.can_create_clients || permissions?.can_edit_clients || permissions?.can_view_all_audits) && (
          <div className="space-y-6">
            {/* Client Management Header */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Client Management</h2>
                  <p className="text-slate-400 text-sm mt-1">Manage your client portfolio and run AI analysis</p>
                </div>
                {(isSuperAdmin || permissions?.can_create_clients) && (
                  <button 
                    onClick={() => setShowClientOnboarding(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Add New Client
                  </button>
                )}
              </div>
              
              {/* Search and Filter Bar */}
              <div className="mb-6">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search clients by name, industry, location..."
                      className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <select className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none">
                    <option value="">All Industries</option>
                    <option value="food_beverage">Food & Beverage</option>
                    <option value="health_wellness">Health & Wellness</option>
                    <option value="professional_services">Professional Services</option>
                  </select>
                  <select className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="prospect">Prospect</option>
                  </select>
                </div>
              </div>
            </div>

            {topClients.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {topClients.map(client => (
                  <div key={client.id} className="bg-slate-800 rounded-lg p-6 hover:bg-slate-750 transition-colors">
                    {/* Client Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{client.business_name}</h3>
                        <p className="text-slate-400 text-sm">{client.industry} • {client.location || 'Location not set'}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            client.status === 'active' ? 'bg-green-900/20 text-green-400' :
                            client.status === 'inactive' ? 'bg-yellow-900/20 text-yellow-400' :
                            'bg-red-900/20 text-red-400'
                          }`}>
                            {client.status}
                          </span>
                          <span className="text-slate-500 text-xs">Tier: {(client as any).service_tier || 'standard'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          (client as any).last_score >= 80 ? 'text-green-400' :
                          (client as any).last_score >= 60 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {(client as any).last_score || 'N/A'}
                        </div>
                        <p className="text-slate-400 text-xs">
                          {(client as any).last_audit_at ? formatTimeAgo((client as any).last_audit_at) : 'No audit'}
                        </p>
                      </div>
                    </div>

                    {/* Client Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-slate-400">Health Score</p>
                        <p className="text-white font-medium">{(client as any).health_score || 'N/A'}/100</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Next Audit</p>
                        <p className="text-white font-medium">
                          {(client as any).next_audit_due ? new Date((client as any).next_audit_due).toLocaleDateString() : 'Not scheduled'}
                        </p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                        onClick={() => {
                          // Navigate to audit for this client
                          setActiveTab('overview')
                        }}
                      >
                        Run Audit
                      </button>
                      <button 
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/tasks/analyze', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                agency_id: currentAgency?.id,
                                client_id: client.id,
                                analysis_type: 'comprehensive',
                                timeframe: '7_days',
                                include_automation: true,
                                industry: client.industry,
                                business_name: client.business_name,
                                location: (client as any).location
                              })
                            })
                            const result = await response.json()
                            if (result.success) {
                              alert(`Generated ${result.taskCount} AI tasks for ${client.business_name}`)
                              loadDashboardData() // Refresh data
                            }
                          } catch (error) {
                            console.error('Error generating AI tasks:', error)
                          }
                        }}
                      >
                        AI Tasks
                      </button>
                    </div>

                    {/* Client Insights */}
                    {(client as any).unique_selling_proposition && (
                      <div className="mt-4 p-3 bg-slate-700 rounded-lg">
                        <p className="text-slate-300 text-xs font-medium mb-1">Business Focus</p>
                        <p className="text-slate-400 text-sm">{(client as any).unique_selling_proposition}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800 rounded-lg">
                <div className="text-center text-slate-400 py-12">
                  <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 bg-slate-600 rounded"></div>
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    {isSuperAdmin ? 'No Clients in System' : 'No Clients Yet'}
                  </h3>
                  <p className="mb-4">
                    {isSuperAdmin 
                      ? 'No clients have been created in the system yet. As Super Admin, you can view all clients across all agencies.'
                      : 'Get started by adding your first client to the agency.'
                    }
                  </p>
                  {(isSuperAdmin || permissions?.can_create_clients) && (
                    <button 
                      onClick={() => setShowClientOnboarding(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      {isSuperAdmin ? 'Add First System Client' : 'Add Your First Client'}
                    </button>
                  )}
                  {isSuperAdmin && (
                    <div className="mt-4 text-xs text-slate-500">
                      Super Admin: You have access to all clients across all agencies
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (isSuperAdmin || permissions?.can_create_clients || permissions?.can_edit_clients) && (
          <ReviewResponder />
        )}

        {activeTab === 'social' && (isSuperAdmin || permissions?.can_create_clients || permissions?.can_edit_clients) && (
          <ManualPostHelper />
        )}

        {activeTab === 'client-access' && (isSuperAdmin || permissions?.can_create_clients || permissions?.can_edit_clients) && (
          <ClientUserInvite />
        )}

        {activeTab === 'ai-analysis' && (isSuperAdmin || permissions?.can_access_ai_insights) && (
          <AIAnalysisPanel />
        )}

        {activeTab === 'intelligence' && (isSuperAdmin || permissions?.can_access_ai_insights) && (
          <MarketIntelligenceComponent />
        )}

        {activeTab === 'predictive' && (isSuperAdmin || permissions?.can_access_ai_insights) && (
          <PredictiveAnalytics />
        )}

        {activeTab === 'tasks' && (isSuperAdmin || permissions?.can_manage_automations) && (
          <TaskAutomation />
        )}
        {activeTab === 'automation' && (isSuperAdmin || permissions?.can_manage_automations) && (
          <AutomationWorkflows />
        )}

        {activeTab === 'analytics' && (isSuperAdmin || permissions?.can_generate_reports) && (
          <AdvancedAnalytics />
        )}

        {activeTab === 'reports' && (isSuperAdmin || permissions?.can_generate_reports) && (
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Agency Reports</h2>
            <div className="text-center text-slate-400 py-12">
              <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-slate-600 rounded"></div>
              </div>
              <h3 className="text-lg font-medium mb-2">Comprehensive Reporting</h3>
              <p>Generate agency-wide performance reports and client-specific insights</p>
            </div>
          </div>
        )}

        {activeTab === 'team' && (isSuperAdmin || permissions?.can_manage_roles || permissions?.can_invite_members) && (
          <TeamManagementAgency />
        )}

        {activeTab === 'settings' && (isSuperAdmin || permissions?.can_edit_agency_settings) && (
          <AgencySettings />
        )}

        {activeTab === 'admin' && isSuperAdmin && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Super Admin Dashboard</h2>
              
              {/* System Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-white">{stats.totalClients}</div>
                  <div className="text-slate-300 text-sm">Total Clients</div>
                  <div className="text-green-400 text-xs">System-wide</div>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-white">{stats.activeClients}</div>
                  <div className="text-slate-300 text-sm">Active Clients</div>
                  <div className="text-green-400 text-xs">All agencies</div>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-white">{recentActivity.length}</div>
                  <div className="text-slate-300 text-sm">Recent Activities</div>
                  <div className="text-blue-400 text-xs">Last 24h</div>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-white">{availableAgencies.length}</div>
                  <div className="text-slate-300 text-sm">Total Agencies</div>
                  <div className="text-purple-400 text-xs">Active</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-slate-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">System Overview</h3>
                  <p className="text-slate-300 mb-4">Monitor system performance and usage</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Database Status:</span>
                      <span className="text-green-400">Connected</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">API Endpoints:</span>
                      <span className="text-green-400">Active</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">User Management</h3>
                  <p className="text-slate-300 mb-4">Manage users and agency access</p>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm">
                    Manage Users
                  </button>
                </div>
                <div className="bg-slate-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
                  <p className="text-slate-300 mb-4">Platform-wide usage and performance metrics</p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                    View Reports
                  </button>
                </div>
              </div>
            </div>

            {/* Debug Information */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Debug Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="text-slate-300 font-medium mb-2">User Details</h4>
                  <div className="space-y-1 text-slate-400">
                    <div>Email: {user?.email}</div>
                    <div>Role: {profile?.role || 'Not set'}</div>
                    <div>Super Admin: {isSuperAdmin ? 'Yes' : 'No'}</div>
                    <div>User ID: {user?.id}</div>
                  </div>
                </div>
                <div>
                  <h4 className="text-slate-300 font-medium mb-2">Data Access</h4>
                  <div className="space-y-1 text-slate-400">
                    <div>Loading: {loading ? 'Yes' : 'No'}</div>
                    <div>Current Agency: {currentAgency?.name || 'None'}</div>
                    <div>Membership Role: {membership?.role || 'None'}</div>
                    <div>Clients Loaded: {topClients.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  )
}