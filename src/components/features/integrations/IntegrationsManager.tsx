'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../providers/AuthProvider'
import { useSimpleAgency as useAgency } from '../../providers/SimpleAgencyProvider'
import GoogleBusinessIntegration from './GoogleBusinessIntegration'

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

interface Client {
  id: string
  business_name: string
  website: string | null
  category: string
  status: string
}

export default function IntegrationsManager() {
  const { user, profile } = useAuth()
  const { currentAgency, membership } = useAgency()
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [settings, setSettings] = useState<any>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (user) {
      loadClients()
      loadIntegrations()
      handleCallbackMessages()
    }
  }, [user, currentAgency])

  useEffect(() => {
    if (clients.length > 0 && !selectedClient) {
      setSelectedClient(clients[0])
    }
  }, [clients, selectedClient])

  const loadClients = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('clients')
        .select('id, business_name, website, category, status')
        .eq('status', 'active')
        .order('business_name')

      // Filter by agency if user is not super admin
      if (currentAgency && profile?.role !== 'superadmin') {
        query = query.eq('agency_id', currentAgency.id)
      } else if (profile?.role !== 'superadmin') {
        query = query.eq('user_id', user?.id)
      }

      const { data, error } = await query

      if (error) throw error

      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
      setErrorMessage('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  const handleCallbackMessages = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')
    const account = urlParams.get('account')

    if (success === 'google_connected') {
      setSuccessMessage(`Successfully connected Google Business Profile${account ? ` for ${decodeURIComponent(account)}` : ''}`)
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (error) {
      const errorMessages = {
        oauth_denied: 'Google OAuth was cancelled or denied',
        invalid_callback: 'Invalid callback parameters',
        connection_failed: 'Failed to establish connection with Google Business Profile'
      }
      setErrorMessage(errorMessages[error as keyof typeof errorMessages] || 'Connection failed')
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }

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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading integrations...</div>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800 rounded-lg p-12 text-center">
            <div className="text-4xl mb-4">🔌</div>
            <h3 className="text-lg font-medium text-white mb-2">No Active Clients</h3>
            <p className="text-slate-400 mb-4">
              You need to have active clients before setting up integrations.
            </p>
            <a
              href="/dashboard"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md inline-block"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Integrations</h1>
            <p className="text-slate-400">
              Connect third-party services to enhance your business management
            </p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-900/20 border border-green-500 text-green-400 px-4 py-2 rounded-lg mb-4">
            {successMessage}
            <button
              onClick={() => setSuccessMessage('')}
              className="float-right text-green-300 hover:text-green-100"
            >
              ✕
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg mb-4">
            {errorMessage}
            <button
              onClick={() => setErrorMessage('')}
              className="float-right text-red-300 hover:text-red-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Client Selector */}
        <div className="max-w-md">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Select Client
          </label>
          <select
            value={selectedClient?.id || ''}
            onChange={(e) => {
              const client = clients.find(c => c.id === e.target.value)
              setSelectedClient(client || null)
            }}
            className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.business_name} ({client.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Integrations Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {selectedClient ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">
                  Integrations for {selectedClient.business_name}
                </h2>
                <p className="text-slate-400">
                  Configure and manage third-party service connections for this client.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Google Business Profile Integration */}
                <GoogleBusinessIntegration
                  clientId={selectedClient.id}
                  clientName={selectedClient.business_name}
                />

                {/* Legacy integrations converted to placeholders */}
                <div className="bg-slate-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">f</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Facebook Business</h3>
                        <p className="text-slate-400 text-sm">Manage Facebook pages and ads</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm">
                      Coming Soon
                    </span>
                  </div>
                  <div className="text-slate-400 text-sm">
                    Facebook Business integration will be available in a future update.
                  </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">📷</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Instagram Business</h3>
                        <p className="text-slate-400 text-sm">Manage Instagram posts and stories</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm">
                      Coming Soon
                    </span>
                  </div>
                  <div className="text-slate-400 text-sm">
                    Instagram Business integration will be available in a future update.
                  </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">🐦</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Twitter/X Business</h3>
                        <p className="text-slate-400 text-sm">Manage tweets and engagement</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm">
                      Coming Soon
                    </span>
                  </div>
                  <div className="text-slate-400 text-sm">
                    Twitter/X Business integration will be available in a future update.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔌</div>
              <h3 className="text-lg font-medium text-white mb-2">Select a Client</h3>
              <p className="text-slate-400">
                Choose a client from the dropdown above to manage their integrations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
