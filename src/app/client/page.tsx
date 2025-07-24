'use client'

import { ClientProvider } from '@/components/features/clients/ClientProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import ClientDashboard from '@/components/features/clients/ClientDashboard'

export default function ClientDashboardPage() {
  return (
    <AuthProvider>
      <ClientProvider>
        <ClientDashboard />
      </ClientProvider>
    </AuthProvider>
  )
}