'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import to avoid SSR issues
const BusinessAuditAnalyzer = dynamic(
  () => import('@/components/BusinessAuditAnalyzer'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading TableTalk Radar...</p>
        </div>
      </div>
    )
  }
)

export default function Home() {
  const [error, setError] = useState<string | null>(null)

  // Add error boundary
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-red-800 font-bold mb-2">Error Loading Application</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen">
      <BusinessAuditAnalyzer />
    </main>
  )
}