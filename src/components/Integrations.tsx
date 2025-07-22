'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { useToast } from './Toast'
import LoadingSpinner from './LoadingSpinner'
import Tooltip from './Tooltip'

interface Integration {
  id: string
  user_id: string
  platform: string
  account_name: string
  account_id: string
  is_connected: boolean
  last_sync: string | null
  permissions: string[]
  created_at: string
}

interface Platform {
  id: string
  name: string
  description: string
  icon: string
  color: string
  features: string[]
  is_available: boolean
}

export default function Integrations() {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)

  const platforms: Platform[] = [
    {
      id: 'google_my_business',
      name: 'Google My Business',
      description: 'Connect your Google My Business account to automatically sync business information and reviews.',
      icon: '🏢',
      color: 'bg-blue-600',
      features: ['Business Information Sync', 'Review Monitoring', 'Performance Analytics'],
      is_available: true
    },
    {
      id: 'facebook',
      name: 'Facebook Business',
      description: 'Connect your Facebook Business page to monitor engagement and reviews.',
      icon: '📘',
      color: 'bg-blue-700',
      features: ['Page Analytics', 'Review Monitoring', 'Post Performance'],
      is_available: true
    },
    {
      id: 'instagram',
      name: 'Instagram Business',
      description: 'Connect your Instagram Business account to track engagement and growth.',
      icon: '📷',
      color: 'bg-pink-600',
      features: ['Engagement Analytics', 'Follower Growth', 'Content Performance'],
      is_available: true
    },
    {
      id: 'yelp',
      name: 'Yelp',
      description: 'Connect your Yelp Business account to monitor reviews and ratings.',
      icon: '⭐',
      color: 'bg-red-600',
      features: ['Review Monitoring', 'Rating Tracking', 'Response Management'],
      is_available: true
    },
    {
      id: 'google_calendar',
      name: 'Google Calendar',
      description: 'Connect your Google Calendar to schedule audit reminders and follow-ups.',
      icon: '📅',
      color: 'bg-green-600',
      features: ['Audit Scheduling', 'Follow-up Reminders', 'Team Coordination'],
      is_available: true
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Connect Slack to receive notifications and alerts in your workspace.',
      icon: '💬',
      color: 'bg-purple-600',
      features: ['Real-time Notifications', 'Team Alerts', 'Audit Reports'],
      is_available: false
    }
  ]

  useEffect(() => {
    if (user) {
      loadIntegrations()
    }
  }, [user])

  const loadIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setIntegrations(data || [])
    } catch (error) {
      console.error('Error loading integrations:', error)
      showError('Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }

  const connectIntegration = async (platformId: string) => {
    setConnecting(platformId)
    try {
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const { data, error } = await supabase
        .from('integrations')
        .insert({
          user_id: user?.id,
          platform: platformId,
          account_name: `Connected ${platformId}`,
          account_id: `acc_${Math.random().toString(36).substr(2, 9)}`,
          is_connected: true,
          permissions: ['read', 'write'],
          last_sync: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      setIntegrations(prev => [...prev, data])
      showSuccess('Integration connected successfully!')
    } catch (error) {
      console.error('Error connecting integration:', error)
      showError('Failed to connect integration')
    } finally {
      setConnecting(null)
    }
  }

  const disconnectIntegration = async (integrationId: string) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId)

      if (error) throw error

      setIntegrations(prev => prev.filter(i => i.id !== integrationId))
      showSuccess('Integration disconnected successfully!')
    } catch (error) {
      console.error('Error disconnecting integration:', error)
      showError('Failed to disconnect integration')
    }
  }

  const syncIntegration = async (integrationId: string) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .update({
          last_sync: new Date().toISOString()
        })
        .eq('id', integrationId)

      if (error) throw error

      setIntegrations(prev => prev.map(i => 
        i.id === integrationId 
          ? { ...i, last_sync: new Date().toISOString() }
          : i
      ))
      showSuccess('Integration synced successfully!')
    } catch (error) {
      console.error('Error syncing integration:', error)
      showError('Failed to sync integration')
    }
  }

  const getConnectedIntegration = (platformId: string) => {
    return integrations.find(i => i.platform === platformId)
  }

  if (loading) {
    return <LoadingSpinner text="Loading integrations..." />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Integrations</h2>
        <p className="text-slate-400">Connect your business accounts to enhance audit capabilities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((platform) => {
          const integration = getConnectedIntegration(platform.id)
          const isConnected = !!integration

          return (
            <div key={platform.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${platform.color}`}>
                    {platform.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{platform.name}</h3>
                    <p className="text-slate-400 text-sm">{platform.description}</p>
                  </div>
                </div>
                {!platform.is_available && (
                  <span className="px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <h4 className="text-slate-300 font-medium text-sm">Features:</h4>
                <ul className="space-y-1">
                  {platform.features.map((feature, index) => (
                    <li key={index} className="text-slate-400 text-sm flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {integration && (
                <div className="mb-4 p-3 bg-slate-700 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white text-sm font-medium">{integration.account_name}</p>
                      <p className="text-slate-400 text-xs">
                        Last synced: {integration.last_sync ? new Date(integration.last_sync).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Tooltip content="Sync data from this integration">
                        <button
                          onClick={() => syncIntegration(integration.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                        >
                          Sync
                        </button>
                      </Tooltip>
                      <Tooltip content="Disconnect this integration">
                        <button
                          onClick={() => disconnectIntegration(integration.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                        >
                          Disconnect
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              )}

              {platform.is_available && !isConnected && (
                <button
                  onClick={() => connectIntegration(platform.id)}
                  disabled={connecting === platform.id}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connecting === platform.id ? (
                    <LoadingSpinner size="sm" text="Connecting..." />
                  ) : (
                    'Connect'
                  )}
                </button>
              )}

              {!platform.is_available && (
                <button
                  disabled
                  className="w-full bg-slate-600 text-slate-400 px-4 py-2 rounded-md cursor-not-allowed"
                >
                  Coming Soon
                </button>
              )}
            </div>
          )
        })}
      </div>

      {integrations.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Connected Integrations</h3>
          <div className="space-y-3">
            {integrations.map((integration) => (
              <div key={integration.id} className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                <div>
                  <p className="text-white font-medium">{integration.platform}</p>
                  <p className="text-slate-400 text-sm">{integration.account_name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                    Connected
                  </span>
                  <button
                    onClick={() => disconnectIntegration(integration.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 