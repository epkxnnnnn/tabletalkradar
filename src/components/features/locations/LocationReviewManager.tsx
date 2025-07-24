'use client'

import React from 'react'

interface LocationReviewManagerProps {
  locationId: string
  className?: string
}

export default function LocationReviewManager({ locationId, className = '' }: LocationReviewManagerProps) {
  return (
    <div className={`bg-slate-800 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Review Manager</h3>
      <div className="space-y-4">
        <div className="border border-slate-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                JD
              </div>
              <span className="text-white font-medium">John Doe</span>
            </div>
            <div className="flex text-yellow-400">
              {'★'.repeat(5)}
            </div>
          </div>
          <p className="text-slate-300 text-sm mb-2">
            Amazing food and great service! Will definitely come back.
          </p>
          <button className="text-blue-400 hover:text-blue-300 text-sm">
            Reply to Review
          </button>
        </div>
        
        <div className="border border-slate-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                SM
              </div>
              <span className="text-white font-medium">Sarah Miller</span>
            </div>
            <div className="flex text-yellow-400">
              {'★'.repeat(4)}
            </div>
          </div>
          <p className="text-slate-300 text-sm mb-2">
            Good experience overall, but the wait time was a bit long.
          </p>
          <button className="text-blue-400 hover:text-blue-300 text-sm">
            Reply to Review
          </button>
        </div>
      </div>
    </div>
  )
}