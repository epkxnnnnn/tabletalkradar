'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'

interface SimpleAgency {
  id: string
  name: string
  contact_email?: string
  created_at: string
}

interface SimpleMembership {
  role: 'owner' | 'admin' | 'member'
  user_id: string
  agency_id: string
}

interface SimplePermissions {
  can_create_clients: boolean
  can_edit_clients: boolean
  can_view_all_audits: boolean
  can_access_ai_insights: boolean
  can_manage_automations: boolean
  can_generate_reports: boolean
  can_manage_roles: boolean
  can_invite_members: boolean
  can_edit_agency_settings: boolean
}

interface SimpleAgencyContextType {
  currentAgency: SimpleAgency | null
  membership: SimpleMembership | null
  permissions: SimplePermissions | null
  availableAgencies: SimpleAgency[]
  loading: boolean
  agenciesLoading: boolean
  switchAgency: (agencyId: string) => Promise<void>
  refreshAgencyData: () => Promise<void>
}

const SimpleAgencyContext = createContext<SimpleAgencyContextType | undefined>(undefined)

export function SimpleAgencyProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  
  const [currentAgency, setCurrentAgency] = useState<SimpleAgency | null>(null)
  const [membership, setMembership] = useState<SimpleMembership | null>(null)
  const [permissions, setPermissions] = useState<SimplePermissions | null>(null)
  const [availableAgencies, setAvailableAgencies] = useState<SimpleAgency[]>([])
  const [loading, setLoading] = useState(true)
  const [agenciesLoading, setAgenciesLoading] = useState(false)

  const getDefaultPermissions = (role: string): SimplePermissions => {
    const basePermissions: SimplePermissions = {
      can_create_clients: false,
      can_edit_clients: false,
      can_view_all_audits: false,
      can_access_ai_insights: false,
      can_manage_automations: false,
      can_generate_reports: false,
      can_manage_roles: false,
      can_invite_members: false,
      can_edit_agency_settings: false
    }

    switch (role) {
      case 'owner':
        return {
          can_create_clients: true,
          can_edit_clients: true,
          can_view_all_audits: true,
          can_access_ai_insights: true,
          can_manage_automations: true,
          can_generate_reports: true,
          can_manage_roles: true,
          can_invite_members: true,
          can_edit_agency_settings: true
        }
      case 'admin':
        return {
          ...basePermissions,
          can_create_clients: true,
          can_edit_clients: true,
          can_view_all_audits: true,
          can_access_ai_insights: true,
          can_manage_automations: true,
          can_generate_reports: true,
          can_invite_members: true
        }
      case 'member':
        return {
          ...basePermissions,
          can_create_clients: true,
          can_edit_clients: true,
          can_access_ai_insights: true,
          can_generate_reports: true
        }
      default:
        return basePermissions
    }
  }

  const createDefaultAgency = useCallback(async () => {
    if (!user) return null

    try {
      // Create a simple agency for the user
      const defaultAgency: SimpleAgency = {
        id: `agency_${user.id}`,
        name: user.user_metadata?.company_name || user.email?.split('@')[0] + ' Agency' || 'My Agency',
        contact_email: user.email || '',
        created_at: new Date().toISOString()
      }

      const defaultMembership: SimpleMembership = {
        role: 'owner',
        user_id: user.id,
        agency_id: defaultAgency.id
      }

      setCurrentAgency(defaultAgency)
      setMembership(defaultMembership)
      setAvailableAgencies([defaultAgency])
      setPermissions(getDefaultPermissions('owner'))

      return defaultAgency
    } catch (error) {
      console.error('Error creating default agency:', error)
      return null
    }
  }, [user])

  const loadAgencyData = useCallback(async () => {
    if (!user || authLoading) return

    setLoading(true)
    try {
      // For now, just create a default agency structure
      // This bypasses the database dependency issues
      await createDefaultAgency()
    } catch (error) {
      console.error('Error loading agency data:', error)
      // Still create default agency even if there are errors
      await createDefaultAgency()
    } finally {
      setLoading(false)
    }
  }, [user, authLoading, createDefaultAgency])

  const switchAgency = async (agencyId: string) => {
    // For now, this doesn't do anything since we only have one agency
    return
  }

  const refreshAgencyData = async () => {
    await loadAgencyData()
  }

  useEffect(() => {
    if (user && !authLoading) {
      loadAgencyData()
    } else if (!user && !authLoading) {
      // Reset state when user logs out
      setCurrentAgency(null)
      setMembership(null)
      setPermissions(null)
      setAvailableAgencies([])
      setLoading(false)
    }
  }, [user, authLoading, loadAgencyData])

  return (
    <SimpleAgencyContext.Provider value={{
      currentAgency,
      membership,
      permissions,
      availableAgencies,
      loading,
      agenciesLoading,
      switchAgency,
      refreshAgencyData
    }}>
      {children}
    </SimpleAgencyContext.Provider>
  )
}

export function useSimpleAgency() {
  const context = useContext(SimpleAgencyContext)
  if (context === undefined) {
    throw new Error('useSimpleAgency must be used within a SimpleAgencyProvider')
  }
  return context
}