'use client'

import React from 'react'

interface LocationSocialCalendarProps {
  locationId: string
  className?: string
}

export default function LocationSocialCalendar({ locationId, className = '' }: LocationSocialCalendarProps) {
  return (
    <div className={`bg-slate-800 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Social Calendar</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-slate-700 rounded">
          <div>
            <div className="text-white font-medium">Holiday Special Post</div>
            <div className="text-slate-400 text-sm">Facebook, Instagram</div>
          </div>
          <div className="text-green-400 text-sm">Today 2:00 PM</div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-slate-700 rounded">
          <div>
            <div className="text-white font-medium">New Menu Launch</div>
            <div className="text-slate-400 text-sm">All platforms</div>
          </div>
          <div className="text-blue-400 text-sm">Tomorrow 10:00 AM</div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-slate-700 rounded">
          <div>
            <div className="text-white font-medium">Customer Spotlight</div>
            <div className="text-slate-400 text-sm">Instagram Stories</div>
          </div>
          <div className="text-yellow-400 text-sm">Friday 6:00 PM</div>
        </div>
      </div>
    </div>
  )
}