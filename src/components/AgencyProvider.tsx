'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { 
  Agency, 
  AgencyMembership, 
  AgencyPermissions, 
  AgencyContextData,
  AgencyRole
} from '@/lib/types/agency'

interface AgencyContextType {
  // Current agency context
  currentAgency: Agency | null
  membership: AgencyMembership | null
  permissions: AgencyPermissions | null
  
  // Available agencies for user
  availableAgencies: Agency[]
  
  // Loading states
  loading: boolean
  agenciesLoading: boolean
  
  // Actions
  switchAgency: (agencyId: string) => Promise<void>
  refreshAgencyData: () => Promise<void>
  
  // Helper functions
  hasPermission: (permission: keyof AgencyPermissions) => boolean
  hasRole: (role: AgencyRole | AgencyRole[]) => boolean
  canAccessClient: (clientId: string) => Promise<boolean>
  
  // Agency management
  createAgency: (data: { name: string; contact_email?: string }) => Promise<Agency>
  inviteMember: (email: string, role: AgencyRole) => Promise<void>
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined)

export function AgencyProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  
  const [currentAgency, setCurrentAgency] = useState<Agency | null>(null)
  const [membership, setMembership] = useState<AgencyMembership | null>(null)
  const [permissions, setPermissions] = useState<AgencyPermissions | null>(null)
  const [availableAgencies, setAvailableAgencies] = useState<Agency[]>([])
  
  const [loading, setLoading] = useState(true)
  const [agenciesLoading, setAgenciesLoading] = useState(false)

  // Default permissions based on role
  const getDefaultPermissions = (role: AgencyRole): AgencyPermissions => {
    const basePermissions: AgencyPermissions = {
      can_create_clients: false,
      can_edit_clients: false,
      can_delete_clients: false,
      can_assign_clients: false,
      can_run_audits: true,
      can_view_all_audits: false,
      can_delete_audits: false,
      can_generate_reports: true,
      can_customize_reports: false,
      can_share_reports: false,
      can_invite_members: false,
      can_manage_roles: false,
      can_remove_members: false,
      can_edit_agency_settings: false,
      can_manage_billing: false,
      can_access_analytics: false,
      can_manage_automations: false,
      can_access_ai_insights: false,
      can_manage_integrations: false
    }

    switch (role) {
      case 'owner':
        return Object.fromEntries(
          Object.keys(basePermissions).map(key => [key, true])
        ) as AgencyPermissions

      case 'admin':
        return {
          ...basePermissions,
          can_create_clients: true,
          can_edit_clients: true,
          can_delete_clients: true,
          can_assign_clients: true,
          can_view_all_audits: true,
          can_delete_audits: true,
          can_generate_reports: true,
          can_customize_reports: true,
          can_share_reports: true,
          can_invite_members: true,
          can_manage_roles: true,
          can_remove_members: true,
          can_access_analytics: true,
          can_manage_automations: true,
          can_access_ai_insights: true,
          can_manage_integrations: true
        }

      case 'manager':
        return {
          ...basePermissions,
          can_create_clients: true,
          can_edit_clients: true,
          can_assign_clients: true,
          can_view_all_audits: true,
          can_generate_reports: true,
          can_customize_reports: true,
          can_share_reports: true,
          can_access_analytics: true,
          can_manage_automations: true,
          can_access_ai_insights: true
        }

      case 'client_manager':
        return {
          ...basePermissions,
          can_edit_clients: true,
          can_assign_clients: true,
          can_view_all_audits: true,
          can_generate_reports: true,
          can_share_reports: true,
          can_access_ai_insights: true
        }

      case 'analyst':
      default:
        return {
          ...basePermissions,
          can_run_audits: true,
          can_generate_reports: true
        }
    }
  }

  // Setup superadmin with main agency
  const setupSuperAdminAgency = useCallback(async () => {
    if (!user) return

    try {
      // First, check if main agency already exists
      const { data: existingAgency } = await supabase
        .from('agencies')
        .select('*')
        .eq('name', 'TableTalk Agency')
        .single()

      let mainAgency = existingAgency

      if (!mainAgency) {
        // Create the main agency for superadmin
        const { data: newAgency, error: createError } = await supabase
          .from('agencies')
          .insert({
            name: 'TableTalk Agency',
            owner_id: user.id,
            subscription_plan: 'enterprise',
            subscription_status: 'active',
            settings: {
              branding: {
                company_name: 'TableTalk Agency',
                primary_color: '#3b82f6',
                logo_url: null
              }
            }
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating main agency:', createError)
          return
        }
        mainAgency = newAgency
      }

      // Check if membership exists
      const { data: existingMembership } = await supabase
        .from('agency_memberships')
        .select('*')
        .eq('agency_id', mainAgency.id)
        .eq('user_id', user.id)
        .single()

      let membership = existingMembership

      if (!membership) {
        // Create membership for superadmin
        const { data: newMembership, error: membershipError } = await supabase
          .from('agency_memberships')
          .insert({
            agency_id: mainAgency.id,
            user_id: user.id,
            role: 'owner',
            status: 'active'
          })
          .select()
          .single()

        if (membershipError) {
          console.error('Error creating agency membership:', membershipError)
          return
        }
        membership = newMembership
      }

      // Set up the superadmin context
      setCurrentAgency(mainAgency)
      setMembership(membership)
      setAvailableAgencies([mainAgency])
      setPermissions(getDefaultPermissions('owner'))

      // Update user's current agency in profile
      await supabase
        .from('profiles')
        .update({ current_agency_id: mainAgency.id })
        .eq('id', user.id)

    } catch (error) {
      console.error('Error setting up superadmin agency:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Load user's agencies and current agency context
  const loadAgencyData = useCallback(async () => {
    if (!user) {
      setCurrentAgency(null)
      setMembership(null)
      setPermissions(null)
      setAvailableAgencies([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Check if user is superadmin
      const isSuperAdmin = user.email === 'kphstk@gmail.com'
      
      if (isSuperAdmin) {
        // For superadmin, create or get the main agency
        await setupSuperAdminAgency()
        return
      }

      // Get user's agency memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('agency_memberships')
        .select(`
          *,
          agency:agencies(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })

      if (membershipsError) {
        console.error('Error loading agency memberships:', membershipsError)
        return
      }

      const agencies = memberships?.map(m => m.agency).filter(Boolean) as Agency[] || []
      setAvailableAgencies(agencies)

      // Get user's current agency from profile or use first available
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_agency_id')
        .eq('id', user.id)
        .single()

      let targetAgencyId = profile?.current_agency_id
      
      // If no current agency set or agency not in user's memberships, use first available
      if (!targetAgencyId || !agencies.find(a => a.id === targetAgencyId)) {
        targetAgencyId = agencies[0]?.id
      }

      if (targetAgencyId) {
        const targetMembership = memberships?.find(m => m.agency.id === targetAgencyId)
        if (targetMembership) {
          setCurrentAgency(targetMembership.agency)
          setMembership(targetMembership)
          
          // Set permissions based on role and custom permissions
          const defaultPerms = getDefaultPermissions(targetMembership.role)
          const customPerms = targetMembership.permissions || {}
          setPermissions({ ...defaultPerms, ...customPerms })

          // Update user's current agency in profile if different
          if (profile?.current_agency_id !== targetAgencyId) {
            await supabase
              .from('profiles')
              .update({ current_agency_id: targetAgencyId })
              .eq('id', user.id)
          }
        }
      }
    } catch (error) {
      console.error('Error loading agency data:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Switch to different agency
  const switchAgency = async (agencyId: string) => {
    if (!user) return

    setAgenciesLoading(true)
    try {
      // Find membership for target agency
      const targetMembership = availableAgencies.find(a => a.id === agencyId)
      if (!targetMembership) {
        throw new Error('Agency not found or no access')
      }

      // Get full membership data
      const { data: membershipData, error } = await supabase
        .from('agency_memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('agency_id', agencyId)
        .eq('status', 'active')
        .single()

      if (error) {
        throw new Error('Failed to load agency membership')
      }

      // Update current agency context
      setCurrentAgency(targetMembership)
      setMembership(membershipData)
      
      // Update permissions
      const defaultPerms = getDefaultPermissions(membershipData.role)
      const customPerms = membershipData.permissions || {}
      setPermissions({ ...defaultPerms, ...customPerms })

      // Update user profile
      await supabase
        .from('profiles')
        .update({ current_agency_id: agencyId })
        .eq('id', user.id)

    } catch (error) {
      console.error('Error switching agency:', error)
      throw error
    } finally {
      setAgenciesLoading(false)
    }
  }

  // Refresh agency data
  const refreshAgencyData = async () => {
    await loadAgencyData()
  }

  // Check if user has specific permission
  const hasPermission = (permission: keyof AgencyPermissions): boolean => {
    if (!permissions) return false
    return permissions[permission] === true
  }

  // Check if user has specific role(s)
  const hasRole = (role: AgencyRole | AgencyRole[]): boolean => {
    if (!membership) return false
    
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(membership.role)
  }

  // Check if user can access specific client
  const canAccessClient = async (clientId: string): Promise<boolean> => {
    if (!user || !currentAgency) return false

    try {
      // Check if client belongs to user's current agency
      const { data: client } = await supabase
        .from('clients')
        .select('agency_id')
        .eq('id', clientId)
        .single()

      if (client?.agency_id === currentAgency.id) {
        return true
      }

      // Check if user is specifically assigned to this client
      const { data: assignment } = await supabase
        .from('client_assignments')
        .select('id')
        .eq('client_id', clientId)
        .eq('user_id', user.id)
        .eq('agency_id', currentAgency.id)
        .single()

      return !!assignment
    } catch (error) {
      console.error('Error checking client access:', error)
      return false
    }
  }

  // Create new agency
  const createAgency = async (data: { name: string; contact_email?: string }): Promise<Agency> => {
    if (!user) throw new Error('Not authenticated')

    const { data: agency, error } = await supabase
      .from('agencies')
      .insert({
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, ''),
        owner_id: user.id,
        contact_email: data.contact_email
      })
      .select()
      .single()

    if (error) {
      throw new Error('Failed to create agency')
    }

    // Refresh agency data to include new agency
    await loadAgencyData()

    return agency
  }

  // Invite member to current agency
  const inviteMember = async (email: string, role: AgencyRole): Promise<void> => {
    if (!currentAgency || !hasPermission('can_invite_members')) {
      throw new Error('No permission to invite members')
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      // Add to agency membership
      const { error } = await supabase
        .from('agency_memberships')
        .insert({
          agency_id: currentAgency.id,
          user_id: existingUser.id,
          role,
          invited_by: user?.id,
          status: 'active',
          joined_at: new Date().toISOString()
        })

      if (error) {
        throw new Error('Failed to add member to agency')
      }
    } else {
      // Create invitation
      const invitationToken = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

      const { error } = await supabase
        .from('agency_memberships')
        .insert({
          agency_id: currentAgency.id,
          user_id: null, // Will be filled when user signs up
          role,
          invited_by: user?.id,
          status: 'invited',
          invitation_token: invitationToken,
          invitation_expires_at: expiresAt.toISOString()
        })

      if (error) {
        throw new Error('Failed to create invitation')
      }

      // Send invitation email
      try {
        const response = await fetch('/api/team/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            role,
            agencyName: currentAgency.name,
            inviterName: user?.user_metadata?.full_name || user?.email,
            invitationToken,
            message: '' // Could be extended to include custom message
          }),
        })

        if (!response.ok) {
          console.error('Failed to send invitation email')
        }
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError)
        // Don't fail the invitation creation if email fails
      }
    }
  }

  // Load agency data when user changes
  useEffect(() => {
    if (!authLoading) {
      loadAgencyData()
    }
  }, [user, authLoading, loadAgencyData])

  const value: AgencyContextType = {
    currentAgency,
    membership,
    permissions,
    availableAgencies,
    loading,
    agenciesLoading,
    switchAgency,
    refreshAgencyData,
    hasPermission,
    hasRole,
    canAccessClient,
    createAgency,
    inviteMember
  }

  return (
    <AgencyContext.Provider value={value}>
      {children}
    </AgencyContext.Provider>
  )
}

export function useAgency() {
  const context = useContext(AgencyContext)
  if (context === undefined) {
    throw new Error('useAgency must be used within an AgencyProvider')
  }
  return context
}

// Higher-order component to require agency context
export function withAgencyContext<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithAgencyContextComponent(props: P) {
    const agency = useAgency()
    
    if (agency.loading) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-white">Loading agency data...</div>
        </div>
      )
    }

    if (!agency.currentAgency) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-white text-center">
            <h2 className="text-xl mb-4">No Agency Access</h2>
            <p className="text-slate-400">You don&apos;t have access to any agency.</p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}