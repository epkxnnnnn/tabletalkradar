'use client'

import { AuthProvider } from '@/components/providers/AuthProvider'
import { AgencyProvider } from '@/components/features/agency/AgencyProvider'
import { AgencyClientList } from '@/components/features/agency/AgencyClientList'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'

export default function AgencyClientsPage() {
  return (
    <AuthProvider>
      <AgencyProvider>
        <DashboardLayout>
          <AgencyClientList />
        </DashboardLayout>
      </AgencyProvider>
    </AuthProvider>
  )
}