'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'

interface ClientLocation {
  id: string
  client_id: string
  agency_id: string
  location_name: string
  business_name: string
  address: string
  city: string
  state: string
  zip_code: string
  phone?: string
  email?: string
  website?: string
  business_description?: string
  google_place_id?: string
  google_rating?: number
  google_review_count?: number
  local_seo_score?: number
  citation_score?: number
  review_score?: number
  visibility_score?: number
  optimization_score?: number
  is_primary_location: boolean
  is_active: boolean
  display_order: number
  created_at: string
}

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
  status: string
  agency_id: string
  agency_name: string
  total_locations: number
  primary_location?: ClientLocation
}

interface LocationKeyword {
  id: string
  location_id: string
  keyword: string
  keyword_type: string
  current_rank?: number
  previous_rank?: number
  rank_change?: number
  search_volume?: number
  priority: string
  is_tracking: boolean
}

interface MultiLocationClientContextType {
  // Current client access
  currentClientUser: ClientUser | null
  currentClient: ClientInfo | null
  
  // Multi-location support
  clientLocations: ClientLocation[]
  selectedLocation: ClientLocation | null
  primaryLocation: ClientLocation | null
  
  // Available clients for this user
  availableClients: ClientInfo[]
  clientsLoading: boolean
  
  // Location management
  switchLocation: (locationId: string) => void
  switchClient: (clientId: string) => Promise<void>
  loadLocations: () => Promise<void>
  
  // SEO and keyword data
  locationKeywords: LocationKeyword[]
  loadLocationKeywords: (locationId: string) => Promise<void>
  
  // Permissions
  canCreatePosts: boolean
  canRespondReviews: boolean
  canViewAnalytics: boolean
  canManageSettings: boolean
  canViewSEOData: boolean
  
  // Utility functions
  refreshClientData: () => Promise<void>
  trackFeatureUsage: (feature: string) => Promise<void>
  
  // Location statistics
  getLocationStats: (locationId?: string) => {
    seoScore: number
    googleRating: number
    reviewCount: number
    keywordCount: number
  }
}

const MultiLocationClientContext = createContext<MultiLocationClientContextType | undefined>(undefined)

export function MultiLocationClientProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [currentClientUser, setCurrentClientUser] = useState<ClientUser | null>(null)
  const [currentClient, setCurrentClient] = useState<ClientInfo | null>(null)
  const [clientLocations, setClientLocations] = useState<ClientLocation[]>([])
  const [selectedLocation, setSelectedLocation] = useState<ClientLocation | null>(null)
  const [primaryLocation, setPrimaryLocation] = useState<ClientLocation | null>(null)
  const [availableClients, setAvailableClients] = useState<ClientInfo[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [locationKeywords, setLocationKeywords] = useState<LocationKeyword[]>([])

  useEffect(() => {
    if (user) {
      loadAvailableClients()
    } else {
      resetState()
    }
  }, [user])

  const resetState = () => {
    setCurrentClientUser(null)
    setCurrentClient(null)
    setClientLocations([])
    setSelectedLocation(null)
    setPrimaryLocation(null)
    setAvailableClients([])
    setLocationKeywords([])
    setClientsLoading(false)
  }

  const loadAvailableClients = async () => {
    if (!user) return

    setClientsLoading(true)
    try {
      // Get all clients this user has access to
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (clientsError) throw clientsError

      // Get location counts for each client
      const clientsWithLocationCounts = await Promise.all(
        (clients || []).map(async (client) => {
          const { count: locationCount } = await supabase
            .from('client_locations')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', client.id)
            .eq('is_active', true)

          return {
            id: client.id,
            business_name: client.business_name,
            industry: client.industry || 'Unknown',
            status: client.status || 'active',
            agency_id: client.agency_id,
            agency_name: 'TableTalk Radar',
            total_locations: locationCount || 0
          }
        })
      )

      setAvailableClients(clientsWithLocationCounts)

      // Auto-select first client if none selected
      if (clientsWithLocationCounts.length > 0 && !currentClient) {
        await switchClient(clientsWithLocationCounts[0].id)
      }
    } catch (error) {
      console.error('Error loading available clients:', error)
    } finally {
      setClientsLoading(false)
    }
  }

  const loadLocations = async () => {
    if (!currentClient) return

    try {
      const { data: locations, error } = await supabase
        .from('client_locations')
        .select('*')
        .eq('client_id', currentClient.id)
        .eq('is_active', true)
        .order('display_order')

      if (error) throw error

      setClientLocations(locations || [])
      
      // Set primary location
      const primary = locations?.find(loc => loc.is_primary_location)
      setPrimaryLocation(primary || locations?.[0] || null)
      
      // Auto-select primary location if none selected
      if (!selectedLocation && primary) {
        setSelectedLocation(primary)
      }
    } catch (error) {
      console.error('Error loading locations:', error)
    }
  }

  const switchLocation = (locationId: string) => {
    const location = clientLocations.find(loc => loc.id === locationId)
    if (location) {
      setSelectedLocation(location)
      // Load keywords for the new location
      loadLocationKeywords(locationId)
    }
  }

  const switchClient = async (clientId: string) => {
    if (!user) return

    try {
      // Get client info
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError) throw clientError

      const { count: locationCount } = await supabase
        .from('client_locations')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('is_active', true)

      // Create a mock client user for now
      const mockClientUser: ClientUser = {
        id: `${user.id}-${clientId}`,
        user_id: user.id,
        client_id: clientId,
        agency_id: client.agency_id || '',
        role: 'owner', // Default to owner role for now
        permissions: {},
        is_active: true,
        dashboard_preferences: {},
        created_at: new Date().toISOString()
      }

      setCurrentClientUser(mockClientUser)
      setCurrentClient({
        id: client.id,
        business_name: client.business_name,
        industry: client.industry || 'Unknown',
        status: client.status || 'active',
        agency_id: client.agency_id,
        agency_name: 'TableTalk Radar',
        total_locations: locationCount || 0
      })

      // Load locations for this client
      await loadLocations()

      // Store in localStorage for persistence
      localStorage.setItem('selectedClientId', clientId)
    } catch (error) {
      console.error('Error switching client:', error)
    }
  }

  const loadLocationKeywords = async (locationId: string) => {
    try {
      const { data: keywords, error } = await supabase
        .from('location_keywords')
        .select('*')
        .eq('location_id', locationId)
        .eq('is_tracking', true)
        .order('priority', { ascending: true })
        .order('current_rank', { ascending: true })

      if (error) throw error
      setLocationKeywords(keywords || [])
    } catch (error) {
      console.error('Error loading location keywords:', error)
    }
  }

  const refreshClientData = async () => {
    if (currentClient) {
      await switchClient(currentClient.id)
    }
    await loadAvailableClients()
  }

  const trackFeatureUsage = async (feature: string) => {
    // Skip tracking for now since client_sessions table doesn't exist
    console.log('Feature usage tracked:', feature, selectedLocation?.id)
  }

  const getLocationStats = (locationId?: string) => {
    const location = locationId 
      ? clientLocations.find(loc => loc.id === locationId)
      : selectedLocation

    return {
      seoScore: location?.local_seo_score || 0,
      googleRating: location?.google_rating || 0,
      reviewCount: location?.google_review_count || 0,
      keywordCount: locationId 
        ? locationKeywords.filter(k => k.location_id === locationId).length
        : locationKeywords.length
    }
  }

  // Permission calculations based on role
  const canCreatePosts = currentClientUser?.role === 'owner' || currentClientUser?.role === 'manager' || currentClientUser?.role === 'editor'
  const canRespondReviews = currentClientUser?.role === 'owner' || currentClientUser?.role === 'manager' || currentClientUser?.role === 'editor'
  const canViewAnalytics = currentClientUser?.role === 'owner' || currentClientUser?.role === 'manager'
  const canManageSettings = currentClientUser?.role === 'owner'
  const canViewSEOData = currentClientUser?.role === 'owner' || currentClientUser?.role === 'manager'

  const value: MultiLocationClientContextType = {
    currentClientUser,
    currentClient,
    clientLocations,
    selectedLocation,
    primaryLocation,
    availableClients,
    clientsLoading,
    switchLocation,
    switchClient,
    loadLocations,
    locationKeywords,
    loadLocationKeywords,
    canCreatePosts,
    canRespondReviews,
    canViewAnalytics,
    canManageSettings,
    canViewSEOData,
    refreshClientData,
    trackFeatureUsage,
    getLocationStats
  }

  return (
    <MultiLocationClientContext.Provider value={value}>
      {children}
    </MultiLocationClientContext.Provider>
  )
}

export function useMultiLocationClient() {
  const context = useContext(MultiLocationClientContext)
  if (context === undefined) {
    throw new Error('useMultiLocationClient must be used within a MultiLocationClientProvider')
  }
  return context
}