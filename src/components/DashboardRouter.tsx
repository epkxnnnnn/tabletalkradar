'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import AgencyDashboard from './AgencyDashboard'
import ClientDashboard from './ClientDashboard'
import MultiLocationClientDashboard from './MultiLocationClientDashboard'

export default function DashboardRouter() {
  const { user } = useAuth()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      determineUserRole()
    }
  }, [user])

  const determineUserRole = async () => {
    try {
      // Check if user is agency member/owner
      const { data: agencyMembership, error: agencyError } = await supabase
        .from('agency_memberships')
        .select(`
          *,
          agency:agencies(*)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single()

      if (agencyMembership && !agencyError) {
        setUserRole('agency')
        setLoading(false)
        return
      }

      // Check if user has multi-location client access
      const { data: multiLocationAccess, error: multiError } = await supabase
        .from('client_user_assignments')
        .select(`
          *,
          client:clients(
            *,
            client_locations(*)
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')

      if (multiLocationAccess && multiLocationAccess.length > 0) {
        const hasMultiLocation = multiLocationAccess.some(assignment => 
          assignment.client?.client_locations?.length > 1
        )
        
        if (hasMultiLocation) {
          setUserRole('multi_location_client')
        } else {
          setUserRole('client')
        }
        setLoading(false)
        return
      }

      // Check if user has single client access
      const { data: clientAccess, error: clientError } = await supabase
        .from('client_assignments')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')

      if (clientAccess && clientAccess.length > 0) {
        setUserRole('client')
        setLoading(false)
        return
      }

      // Default to agency role for super admin or if no specific role found
      if (user?.email === 'kphstk@gmail.com') {
        setUserRole('agency')
      } else {
        setUserRole('agency') // Default to agency dashboard
      }

    } catch (error) {
      console.error('Error determining user role:', error)
      setUserRole('agency') // Default fallback
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading your dashboard...</div>
      </div>
    )
  }

  // Route to appropriate dashboard based on user role
  switch (userRole) {
    case 'agency':
      return <AgencyDashboard />
    case 'multi_location_client':
      return <MultiLocationClientDashboard />
    case 'client':
      return <ClientDashboard />
    default:
      return <AgencyDashboard />
  }
}