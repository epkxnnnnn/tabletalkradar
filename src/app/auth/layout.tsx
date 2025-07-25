'use client'

import React, { useEffect } from 'react'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthWrapper>
        {children}
      </AuthWrapper>
    </AuthProvider>
  )
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return <>{children}</>
}

export default AuthLayout 