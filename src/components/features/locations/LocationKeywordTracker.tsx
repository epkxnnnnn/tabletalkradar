'use client'

import React from 'react'

interface LocationKeywordTrackerProps {
  locationId: string
  className?: string
}

export default function LocationKeywordTracker({ locationId, className = '' }: LocationKeywordTrackerProps) {
  return (
    <div className={`bg-slate-800 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Keyword Tracker</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-slate-700 rounded">
          <span className="text-white">restaurant near me</span>
          <span className="text-green-400 font-semibold">#2</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-700 rounded">
          <span className="text-white">best food delivery</span>
          <span className="text-blue-400 font-semibold">#5</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-700 rounded">
          <span className="text-white">local dining</span>
          <span className="text-yellow-400 font-semibold">#8</span>
        </div>
      </div>
    </div>
  )
}