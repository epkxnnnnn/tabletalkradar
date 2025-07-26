'use client'

import * as React from 'react'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { AgencyProvider } from '@/components/providers/AgencyProvider'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AgencyProvider>
        {children}
      </AgencyProvider>
    </AuthProvider>
  )
}