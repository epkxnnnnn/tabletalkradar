'use client'

import React from 'react'

interface LocationSEODashboardProps {
  locationId: string
  className?: string
}

export default function LocationSEODashboard({ locationId, className = '' }: LocationSEODashboardProps) {
  return (
    <div className={`bg-slate-800 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">SEO Dashboard</h3>
      <div className="space-y-4">
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Google Business Profile</h4>
          <div className="text-xl font-bold text-green-400">Active</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Local Search Ranking</h4>
          <div className="text-xl font-bold text-blue-400">#1-3</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Review Score</h4>
          <div className="text-xl font-bold text-yellow-400">4.8/5</div>
        </div>
      </div>
    </div>
  )
}