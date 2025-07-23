'use client'

import { ClientProvider } from '@/components/ClientProvider'
import { AuthProvider } from '@/components/AuthProvider'
import ClientDashboard from '@/components/ClientDashboard'

export default function ClientDashboardPage() {
  return (
    <AuthProvider>
      <ClientProvider>
        <ClientDashboard />
      </ClientProvider>
    </AuthProvider>
  )
}