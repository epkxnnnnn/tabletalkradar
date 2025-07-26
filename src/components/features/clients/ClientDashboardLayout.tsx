'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ClientProvider } from './ClientProvider'
import ClientDashboard from './ClientDashboard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface ClientDashboardLayoutProps {
  clientSlug: string
}

export default function ClientDashboardLayout({ clientSlug }: ClientDashboardLayoutProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientData, setClientData] = useState<any>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function checkAccessAndLoadClient() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          router.push('/auth/login')
          return
        }

        // Check if user is agency superadmin
        const { data: agencyMembership, error: agencyError } = await supabase
          .from('agency_memberships')
          .select('role, agency_id')
          .eq('user_id', user.id)
          .in('role', ['owner', 'admin'])
          .single()

        const isSuperAdmin = !agencyError && agencyMembership

        // Get client by slug
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select(`
            *,
            client_users(
              user_id,
              role,
              is_active
            )
          `)
          .eq('slug', clientSlug)
          .single()

        if (clientError || !client) {
          setError('Client not found')
          setLoading(false)
          return
        }

        // Check authorization: either superadmin or client user
        const isClientUser = client.client_users && client.client_users.length > 0 && 
          client.client_users.some((cu: any) => 
            cu.user_id === user.id && cu.is_active
          )

        // For superadmin, verify they manage this client's agency
        if (isSuperAdmin && client.agency_id !== agencyMembership.agency_id) {
          setError('You do not have permission to access this client')
          setLoading(false)
          return
        }

        if (!isSuperAdmin && !isClientUser) {
          setError('You do not have permission to access this client dashboard')
          setLoading(false)
          return
        }

        setClientData(client)
        setIsAuthorized(true)
        setLoading(false)
      } catch (err) {
        console.error('Error checking access:', err)
        setError('An error occurred while loading the client dashboard')
        setLoading(false)
      }
    }

    checkAccessAndLoadClient()
  }, [clientSlug, router, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!isAuthorized || !clientData) {
    return null
  }

  return (
    <AuthProvider>
      <ClientProvider initialClient={clientData}>
        <ClientDashboard />
      </ClientProvider>
    </AuthProvider>
  )
}