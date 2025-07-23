'use client'

import React, { useState, useEffect } from 'react'
import { useClient } from './ClientProvider'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

// Widget Components
import ClientSocialCalendar from './ClientSocialCalendar'
import ClientReviewManager from './ClientReviewManager'
import ClientQuickActions from './ClientQuickActions'
import ClientOverviewStats from './ClientOverviewStats'
import ClientRecentPosts from './ClientRecentPosts'

interface DashboardWidget {
  id: string
  widget_type: string
  widget_title: string
  widget_config: any
  position_x: number
  position_y: number
  width: number
  height: number
  is_visible: boolean
}

export default function ClientDashboard() {
  const { 
    currentClient, 
    currentClientUser, 
    availableClients, 
    switchClient, 
    clientsLoading,
    canCreatePosts,
    canRespondReviews,
    canViewAnalytics,
    canManageSettings,
    trackFeatureUsage 
  } = useClient()
  const { user, signOut } = useAuth()
  
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    if (currentClient) {
      loadDashboardWidgets()
    }
  }, [currentClient])

  const loadDashboardWidgets = async () => {
    if (!currentClient) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('client_dashboard_widgets')
        .select('*')
        .eq('client_id', currentClient.id)
        .eq('is_visible', true)
        .order('position_y')
        .order('position_x')

      if (error) throw error
      setWidgets(data || [])
    } catch (error) {
      console.error('Error loading dashboard widgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    trackFeatureUsage(`tab_${tab}`)
  }

  const renderWidget = (widget: DashboardWidget) => {
    const commonProps = {
      widget,
      clientId: currentClient?.id,
      config: widget.widget_config
    }

    switch (widget.widget_type) {
      case 'overview_stats':
        return <ClientOverviewStats key={widget.id} {...commonProps} />
      case 'social_calendar':
        return <ClientSocialCalendar key={widget.id} {...commonProps} />
      case 'recent_reviews':
        return <ClientReviewManager key={widget.id} {...commonProps} />
      case 'social_posts':
        return <ClientRecentPosts key={widget.id} {...commonProps} />
      case 'quick_actions':
        return <ClientQuickActions key={widget.id} {...commonProps} />
      default:
        return (
          <div key={widget.id} className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-white font-medium mb-2">{widget.widget_title}</h3>
            <p className="text-slate-400 text-sm">Widget type: {widget.widget_type}</p>
          </div>
        )
    }
  }

  if (clientsLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading your dashboard...</div>
      </div>
    )
  }

  if (availableClients.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🏢</div>
          <h2 className="text-xl font-semibold mb-2">No Dashboard Access</h2>
          <p className="text-slate-400 mb-4">You don&apos;t have access to any client dashboards yet.</p>
          <p className="text-slate-400 text-sm">Contact your agency administrator to get access.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <Image src="/tabletalk-radar-logo.png" alt="TableTalk Radar" width={200} height={60} className="h-14 w-auto" />
              
              {/* Client Selector */}
              <div className="flex items-center space-x-2">
                <select
                  value={currentClient?.id || ''}
                  onChange={(e) => switchClient(e.target.value)}
                  className="bg-slate-700 text-white px-3 py-1 rounded-md text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableClients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.business_name}
                    </option>
                  ))}
                </select>
                
                {currentClientUser && (
                  <span className="px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded-full capitalize">
                    {currentClientUser.role}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-slate-300 text-sm">
                <div>{currentClient?.business_name}</div>
                <div className="text-xs text-slate-500">{currentClient?.industry}</div>
              </div>
              <div className="text-slate-300 text-sm">
                Welcome, {user?.email}
              </div>
              <button
                onClick={signOut}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: '📊', show: true },
              { id: 'social', name: 'Social Media', icon: '📱', show: canCreatePosts },
              { id: 'reviews', name: 'Reviews', icon: '💬', show: canRespondReviews },
              { id: 'analytics', name: 'Analytics', icon: '📈', show: canViewAnalytics },
              { id: 'settings', name: 'Settings', icon: '⚙️', show: canManageSettings }
            ].filter(tab => tab.show).map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Dashboard Header */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-white">{currentClient?.business_name}</h1>
                  <p className="text-slate-400 mt-1">
                    {currentClient?.industry} • {currentClient?.location}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-sm">Managed by</div>
                  <div className="text-white font-medium">{currentClient?.agency_name}</div>
                </div>
              </div>
            </div>

            {/* Dashboard Widgets Grid */}
            {loading ? (
              <div className="bg-slate-800 rounded-lg p-12 text-center">
                <div className="text-slate-400">Loading dashboard...</div>
              </div>
            ) : widgets.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {widgets.map(renderWidget)}
              </div>
            ) : (
              <div className="bg-slate-800 rounded-lg p-12 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-white mb-2">Dashboard Setup</h3>
                <p className="text-slate-400">Your dashboard widgets are being configured...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'social' && canCreatePosts && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Social Media Management</h2>
              <ClientSocialCalendar 
                widget={{ 
                  id: 'social-full', 
                  widget_config: { view: 'month', show_platforms: ['facebook', 'instagram', 'twitter'] } 
                }} 
                clientId={currentClient?.id} 
                config={{ view: 'month', show_platforms: ['facebook', 'instagram', 'twitter'] }} 
              />
            </div>
          </div>
        )}

        {activeTab === 'reviews' && canRespondReviews && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Review Management</h2>
              <ClientReviewManager 
                widget={{ 
                  id: 'reviews-full', 
                  widget_config: { limit: 50, show_rating: true, show_platform: true } 
                }} 
                clientId={currentClient?.id} 
                config={{ limit: 50, show_rating: true, show_platform: true }} 
              />
            </div>
          </div>
        )}

        {activeTab === 'analytics' && canViewAnalytics && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Analytics & Insights</h2>
              <div className="text-center text-slate-400 py-12">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
                <p>Detailed analytics and insights will be available here</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && canManageSettings && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Business Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Business Name</label>
                  <input
                    type="text"
                    value={currentClient?.business_name || ''}
                    readOnly
                    className="w-full bg-slate-700 text-slate-400 px-3 py-2 rounded border border-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Industry</label>
                  <input
                    type="text"
                    value={currentClient?.industry || ''}
                    readOnly
                    className="w-full bg-slate-700 text-slate-400 px-3 py-2 rounded border border-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Location</label>
                  <input
                    type="text"
                    value={currentClient?.location || ''}
                    readOnly
                    className="w-full bg-slate-700 text-slate-400 px-3 py-2 rounded border border-slate-600"
                  />
                </div>
                <div className="text-slate-400 text-sm mt-4">
                  Contact your agency administrator to update business information.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}