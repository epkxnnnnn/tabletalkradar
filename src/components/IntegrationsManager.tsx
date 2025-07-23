'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthProvider'

interface Integration {
  id: string
  name: string
  type: string
  status: 'connected' | 'disconnected' | 'error'
  description: string
  icon: string
  settings?: any
  last_sync?: string
}

const availableIntegrations: Omit<Integration, 'id' | 'status' | 'last_sync'>[] = [
  {
    name: 'Google My Business',
    type: 'google_business',
    description: 'Sync reviews, Q&A, and business information from Google My Business',
    icon: '🔍',
    settings: { location_id: '', api_key: '' }
  },
  {
    name: 'Facebook Pages',
    type: 'facebook',
    description: 'Manage Facebook page posts, reviews, and messages',
    icon: '📘',
    settings: { page_id: '', access_token: '' }
  },
  {
    name: 'Instagram Business',
    type: 'instagram',
    description: 'Schedule posts and track engagement on Instagram',
    icon: '📷',
    settings: { account_id: '', access_token: '' }
  },
  {
    name: 'Yelp Business',
    type: 'yelp',
    description: 'Monitor Yelp reviews and business information',
    icon: '⭐',
    settings: { business_id: '', api_key: '' }
  },
  {
    name: 'Twitter/X',
    type: 'twitter',
    description: 'Schedule tweets and monitor mentions',
    icon: '🐦',
    settings: { username: '', api_key: '', api_secret: '' }
  },
  {
    name: 'LinkedIn Pages',
    type: 'linkedin',
    description: 'Manage LinkedIn company page content',
    icon: '💼',
    settings: { company_id: '', access_token: '' }
  }
]

export default function IntegrationsManager() {
  const { user } = useAuth()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [settings, setSettings] = useState<any>({})

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user?.id)

      if (error) throw error

      // Merge with available integrations to show all options
      const mergedIntegrations = availableIntegrations.map(available => {
        const existing = data?.find(d => d.type === available.type)
        return existing ? { ...available, ...existing } : { ...available, id: `new_${available.type}`, status: 'disconnected' as const }
      })

      setIntegrations(mergedIntegrations)
    } catch (error) {
      console.error('Error loading integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (integration: Integration) => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .upsert({
          user_id: user?.id,
          name: integration.name,
          type: integration.type,
          status: 'connected',
          description: integration.description,
          settings: settings,
          last_sync: new Date().toISOString()
        })
        .select()

      if (error) throw error
      
      await loadIntegrations()
      setSelectedIntegration(null)
      setSettings({})
    } catch (error) {
      console.error('Error connecting integration:', error)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .update({ status: 'disconnected' })
        .eq('id', integrationId)

      if (error) throw error
      await loadIntegrations()
    } catch (error) {
      console.error('Error disconnecting integration:', error)
    }
  }

  const handleSync = async (integrationId: string) => {
    try {
      // Here you would trigger the sync process
      // For now, just update the last_sync timestamp
      const { error } = await supabase
        .from('integrations')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', integrationId)

      if (error) throw error
      await loadIntegrations()
    } catch (error) {
      console.error('Error syncing integration:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-600'
      case 'disconnected': return 'bg-gray-600'
      case 'error': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return '✅'
      case 'disconnected': return '⚪'
      case 'error': return '❌'
      default: return '⚪'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading integrations...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Integrations</h1>
        <div className="text-sm text-gray-400">
          Connect your business accounts to sync data automatically
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div key={integration.id} className="bg-slate-800 p-6 rounded-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{integration.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{integration.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-lg">{getStatusIcon(integration.status)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(integration.status)}`}>
                      {integration.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
              {integration.description}
            </p>

            {integration.last_sync && (
              <p className="text-gray-400 text-xs mb-4">
                Last synced: {new Date(integration.last_sync).toLocaleDateString()}
              </p>
            )}

            <div className="flex space-x-2">
              {integration.status === 'disconnected' ? (
                <button
                  onClick={() => {
                    setSelectedIntegration(integration)
                    setSettings(integration.settings || {})
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex-1"
                >
                  Connect
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleSync(integration.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                  >
                    Sync
                  </button>
                  <button
                    onClick={() => handleDisconnect(integration.id)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                  >
                    Disconnect
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Connection Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-white mb-4">
              Connect {selectedIntegration.name}
            </h2>
            
            <div className="space-y-4">
              {selectedIntegration.type === 'google_business' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Location ID
                    </label>
                    <input
                      type="text"
                      value={settings.location_id || ''}
                      onChange={(e) => setSettings({...settings, location_id: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                      placeholder="Enter your Google Business location ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={settings.api_key || ''}
                      onChange={(e) => setSettings({...settings, api_key: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                      placeholder="Enter your API key"
                    />
                  </div>
                </>
              )}

              {selectedIntegration.type === 'facebook' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Page ID
                    </label>
                    <input
                      type="text"
                      value={settings.page_id || ''}
                      onChange={(e) => setSettings({...settings, page_id: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Access Token
                    </label>
                    <input
                      type="password"
                      value={settings.access_token || ''}
                      onChange={(e) => setSettings({...settings, access_token: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* Add similar forms for other integration types */}
              {!['google_business', 'facebook'].includes(selectedIntegration.type) && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">{selectedIntegration.icon}</div>
                  <p className="text-gray-400">Integration settings coming soon...</p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => handleConnect(selectedIntegration)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex-1"
              >
                Connect
              </button>
              <button
                onClick={() => {
                  setSelectedIntegration(null)
                  setSettings({})
                }}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}