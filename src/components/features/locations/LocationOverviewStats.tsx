'use client'

import React from 'react'

interface LocationOverviewStatsProps {
  locationId: string
  className?: string
}

export default function LocationOverviewStats({ locationId, className = '' }: LocationOverviewStatsProps) {
  return (
    <div className={`bg-slate-800 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Location Overview</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">0</div>
          <div className="text-sm text-slate-400">Reviews</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">0</div>
          <div className="text-sm text-slate-400">Posts</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">0</div>
          <div className="text-sm text-slate-400">Keywords</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">0%</div>
          <div className="text-sm text-slate-400">Completion</div>
        </div>
      </div>
    </div>
  )
}