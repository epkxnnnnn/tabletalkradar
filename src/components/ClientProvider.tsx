'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'

interface ClientUser {
  id: string
  user_id: string
  client_id: string
  agency_id: string
  role: 'owner' | 'manager' | 'editor' | 'viewer'
  permissions: any
  is_active: boolean
  dashboard_preferences: any
  last_login?: string
  created_at: string
}

interface ClientInfo {
  id: string
  business_name: string
  industry: string
  location: string
  website: string
  status: string
  agency_id: string
  agency_name: string
}

interface ClientContextType {
  // Current client access
  currentClientUser: ClientUser | null
  currentClient: ClientInfo | null
  
  // Available clients for this user
  availableClients: ClientInfo[]
  clientsLoading: boolean
  
  // Client switching
  switchClient: (clientId: string) => Promise<void>
  
  // Permissions
  canCreatePosts: boolean
  canRespondReviews: boolean
  canViewAnalytics: boolean
  canManageSettings: boolean
  
  // Utility functions
  refreshClientData: () => Promise<void>
  trackFeatureUsage: (feature: string) => Promise<void>
}

const ClientContext = createContext<ClientContextType | undefined>(undefined)

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [currentClientUser, setCurrentClientUser] = useState<ClientUser | null>(null)
  const [currentClient, setCurrentClient] = useState<ClientInfo | null>(null)
  const [availableClients, setAvailableClients] = useState<ClientInfo[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadAvailableClients()
    } else {
      setCurrentClientUser(null)
      setCurrentClient(null)
      setAvailableClients([])
      setClientsLoading(false)
    }
  }, [user])

  const loadAvailableClients = async () => {
    if (!user) return

    setClientsLoading(true)
    try {
      // Get all clients this user has access to
      const { data: clientUsers, error: clientUsersError } = await supabase
        .from('client_users')
        .select(`
          *,
          clients (
            *,
            agencies (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (clientUsersError) throw clientUsersError

      const clients = (clientUsers || []).map(cu => ({
        id: cu.clients.id,
        business_name: cu.clients.business_name,
        industry: cu.clients.industry,
        location: cu.clients.location,
        website: cu.clients.website,
        status: cu.clients.status,
        agency_id: cu.clients?.[0]?.agency_id,
        agency_name: cu.clients.agencies?.name || 'Unknown Agency'
      }))

      setAvailableClients(clients)

      // Auto-select first client if none selected
      if (clients.length > 0 && !currentClient) {
        await switchClient(clients[0].id)
      }
    } catch (error) {
      console.error('Error loading available clients:', error)
    } finally {
      setClientsLoading(false)
    }
  }

  const switchClient = async (clientId: string) => {
    if (!user) return

    try {
      // Get client user record
      const { data: clientUser, error: clientUserError } = await supabase
        .from('client_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single()

      if (clientUserError) throw clientUserError

      // Get client info
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select(`
          *,
          agencies (
            name
          )
        `)
        .eq('id', clientId)
        .single()

      if (clientError) throw clientError

      // Update last login
      await supabase
        .from('client_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', clientUser.id)

      // Track session start
      await supabase
        .from('client_sessions')
        .insert({
          client_user_id: clientUser.id,
          client_id: clientId,
          session_start: new Date().toISOString(),
          features_used: []
        })

      setCurrentClientUser(clientUser)
      setCurrentClient({
        id: client.id,
        business_name: client.business_name,
        industry: client.industry,
        location: client.location,
        website: client.website,
        status: client.status,
        agency_id: client.agency_id,
        agency_name: client.agencies?.name || 'Unknown Agency'
      })

      // Store in localStorage for persistence
      localStorage.setItem('selectedClientId', clientId)
    } catch (error) {
      console.error('Error switching client:', error)
    }
  }

  const refreshClientData = async () => {
    if (currentClient) {
      await switchClient(currentClient.id)
    }
    await loadAvailableClients()
  }

  const trackFeatureUsage = async (feature: string) => {
    if (!currentClientUser) return

    try {
      // Get current session
      const { data: session } = await supabase
        .from('client_sessions')
        .select('*')
        .eq('client_user_id', currentClientUser.id)
        .is('session_end', null)
        .order('session_start', { ascending: false })
        .limit(1)
        .single()

      if (session) {
        const currentFeatures = session.features_used || []
        const updatedFeatures = [...currentFeatures, {
          feature,
          timestamp: new Date().toISOString()
        }]

        await supabase
          .from('client_sessions')
          .update({ features_used: updatedFeatures })
          .eq('id', session.id)
      }
    } catch (error) {
      console.error('Error tracking feature usage:', error)
    }
  }

  // Permission calculations based on role
  const canCreatePosts = currentClientUser?.role === 'owner' || currentClientUser?.role === 'manager' || currentClientUser?.role === 'editor'
  const canRespondReviews = currentClientUser?.role === 'owner' || currentClientUser?.role === 'manager' || currentClientUser?.role === 'editor'
  const canViewAnalytics = currentClientUser?.role === 'owner' || currentClientUser?.role === 'manager'
  const canManageSettings = currentClientUser?.role === 'owner'

  const value: ClientContextType = {
    currentClientUser,
    currentClient,
    availableClients,
    clientsLoading,
    switchClient,
    canCreatePosts,
    canRespondReviews,
    canViewAnalytics,
    canManageSettings,
    refreshClientData,
    trackFeatureUsage
  }

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  )
}

export function useClient() {
  const context = useContext(ClientContext)
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider')
  }
  return context
}