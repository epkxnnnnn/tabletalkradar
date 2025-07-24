'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { googleBusinessService } from '@/lib/google-business'

interface GoogleIntegration {
  id: string
  platform: string
  account_id: string
  account_name: string
  access_token: string
  refresh_token: string
  token_expires_at: string
  is_active: boolean
  integration_data: any
  created_at: string
}

interface GoogleLocation {
  name: string
  locationName: string
  primaryPhone: string
  primaryCategory: {
    displayName: string
  }
  websiteUri?: string
}

interface Props {
  clientId: string
}

export default function GoogleBusinessIntegration({ clientId }: Props) {
  const { user } = useAuth()
  const [integration, setIntegration] = useState<GoogleIntegration | null>(null)
  const [locations, setLocations] = useState<GoogleLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingLoading, setConnectingLoading] = useState(false)
  const [locationsLoading, setLocationsLoading] = useState(false)

  useEffect(() => {
    if (user && clientId) {
      loadIntegration()
    }
  }, [user, clientId])

  const loadIntegration = async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user?.id)
        .eq('client_id', clientId)
        .eq('platform', 'google_my_business')
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      setIntegration(data)
      
      if (data) {
        loadLocations()
      }
    } catch (error) {
      console.error('Error loading Google integration:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLocations = async () => {
    if (!integration) return
    
    setLocationsLoading(true)
    try {
      const response = await fetch('/api/v1/business/google/locations', {
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        setLocations(result.data.locations || [])
      } else {
        console.error('Failed to load locations:', result.error)
      }
    } catch (error) {
      console.error('Error loading Google locations:', error)
    } finally {
      setLocationsLoading(false)
    }
  }

  const handleConnectGoogle = async () => {
    setConnectingLoading(true)
    try {
      // Redirect to Google OAuth with client_id as state
      const authUrl = `/api/v1/business/google/auth?client_id=${clientId}`
      window.location.href = authUrl
    } catch (error) {
      console.error('Error connecting Google:', error)
      setConnectingLoading(false)
    }
  }

  const handleDisconnectGoogle = async () => {
    if (!confirm('Are you sure you want to disconnect Google My Business?')) return

    try {
      const { error } = await supabase
        .from('integrations')
        .update({ is_active: false })
        .eq('user_id', user?.id)
        .eq('client_id', clientId)
        .eq('platform', 'google_my_business')

      if (error) throw error

      setIntegration(null)
      setLocations([])
    } catch (error) {
      console.error('Error disconnecting Google:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="text-slate-400">Loading Google Business integration...</div>
      </div>
    )
  }

  if (!integration) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Google My Business</h3>
            <p className="text-slate-400 text-sm">Connect your Google Business Profile to manage locations and reviews</p>
          </div>
          <div className="text-4xl">🏢</div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="font-medium text-white mb-2">Benefits of connecting:</h4>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>• Manage business locations and hours</li>
              <li>• Respond to customer reviews</li>
              <li>• View business insights and analytics</li>
              <li>• Update business information across Google</li>
            </ul>
          </div>
          
          <button
            onClick={handleConnectGoogle}
            disabled={connectingLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {connectingLoading ? 'Connecting...' : 'Connect Google My Business'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Google My Business</h3>
          <p className="text-slate-400 text-sm">
            Connected as {integration.integration_data?.user_name || integration.integration_data?.user_email}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span className="text-green-400 text-sm">Connected</span>
        </div>
      </div>

      {/* Connection Details */}
      <div className="bg-slate-700 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Account:</span>
            <span className="text-white ml-2">{integration.integration_data?.user_email}</span>
          </div>
          <div>
            <span className="text-slate-400">Connected:</span>
            <span className="text-white ml-2">
              {new Date(integration.created_at).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Status:</span>
            <span className="text-green-400 ml-2">Active</span>
          </div>
          <div>
            <span className="text-slate-400">Expires:</span>
            <span className="text-white ml-2">
              {new Date(integration.token_expires_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Business Locations */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-white">Business Locations</h4>
          <button
            onClick={loadLocations}
            disabled={locationsLoading}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            {locationsLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {locationsLoading ? (
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="text-slate-400">Loading locations...</div>
          </div>
        ) : locations.length > 0 ? (
          <div className="space-y-2">
            {locations.map((location, index) => (
              <div key={index} className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-white">{location.locationName}</h5>
                    <p className="text-slate-400 text-sm">{location.primaryCategory?.displayName}</p>
                    {location.primaryPhone && (
                      <p className="text-slate-400 text-sm">📞 {location.primaryPhone}</p>
                    )}
                    {location.websiteUri && (
                      <p className="text-slate-400 text-sm">🌐 {location.websiteUri}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-slate-400 mb-2">No business locations found</div>
            <p className="text-slate-500 text-sm">
              Make sure your Google Business Profile is set up and verified
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={loadLocations}
          disabled={locationsLoading}
          className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-500 text-white px-4 py-2 rounded-md text-sm"
        >
          {locationsLoading ? 'Loading...' : 'Refresh Data'}
        </button>
        <button
          onClick={handleDisconnectGoogle}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}