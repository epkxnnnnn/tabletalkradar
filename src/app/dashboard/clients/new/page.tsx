'use client'

import { AuthProvider } from '@/components/providers/AuthProvider'
import { AgencyProvider } from '@/components/providers/AgencyProvider'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import ClientOnboarding from '@/components/features/clients/ClientOnboarding'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewClientPage() {
  return (
    <AuthProvider>
      <AgencyProvider>
        <DashboardLayout userRole="superadmin">
          <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/clients">
                <Button variant="outline" size="sm" className="flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Clients
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">Add New Client</h1>
                <p className="text-gray-400 mt-1">
                  Onboard a new client to your agency platform
                </p>
              </div>
            </div>

            {/* Client Onboarding Form */}
            <div className="max-w-4xl">
              <ClientOnboarding />
            </div>
          </div>
        </DashboardLayout>
      </AgencyProvider>
    </AuthProvider>
  )
}