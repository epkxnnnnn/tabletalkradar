'use client'

import React from 'react'

interface LocationSelectorProps {
  onLocationChange?: (locationId: string) => void
  selectedLocationId?: string
  className?: string
  locations?: any[]
  selectedLocation?: any
  onLocationSelect?: (location: any) => void
  showStats?: boolean
}

export default function LocationSelector({ 
  onLocationChange, 
  selectedLocationId, 
  className = '', 
  locations = [], 
  selectedLocation, 
  onLocationSelect, 
  showStats = false 
}: LocationSelectorProps) {
  return (
    <div className={`bg-slate-800 rounded-lg p-4 ${className}`}>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Select Location
      </label>
      <select 
        value={selectedLocationId || ''}
        onChange={(e) => onLocationChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Choose a location...</option>
        <option value="1">Main Street Location</option>
        <option value="2">Downtown Branch</option>
        <option value="3">Shopping Mall Location</option>
      </select>
    </div>
  )
}