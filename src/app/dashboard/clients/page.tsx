'use client'

import { AuthProvider } from '@/components/providers/AuthProvider'
import { AgencyProvider } from '@/components/providers/AgencyProvider'
import { AgencyClientList } from '@/components/features/agency/AgencyClientList'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'

export default function AgencyClientsPage() {
  return (
    <AuthProvider>
      <AgencyProvider>
        <DashboardLayout userRole="superadmin">
          <AgencyClientList />
        </DashboardLayout>
      </AgencyProvider>
    </AuthProvider>
  )
}