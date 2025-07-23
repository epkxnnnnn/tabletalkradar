'use client'

import React, { useState, useEffect } from 'react'
import { useMultiLocationClient } from './MultiLocationClientProvider'
import { useAuth } from './AuthProvider'
import Image from 'next/image'

// Multi-location widget components
import LocationOverviewStats from './LocationOverviewStats'
import LocationSEODashboard from './LocationSEODashboard'
import LocationKeywordTracker from './LocationKeywordTracker'
import LocationSelector from './LocationSelector'
import LocationReviewManager from './LocationReviewManager'
import LocationSocialCalendar from './LocationSocialCalendar'

export default function MultiLocationClientDashboard() {
  const { 
    currentClient, 
    currentClientUser, 
    availableClients, 
    clientLocations,
    selectedLocation,
    primaryLocation,
    switchClient,
    switchLocation,
    clientsLoading,
    canCreatePosts,
    canRespondReviews,
    canViewAnalytics,
    canManageSettings,
    canViewSEOData,
    trackFeatureUsage,
    getLocationStats
  } = useMultiLocationClient()
  const { user, signOut } = useAuth()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientsLoading) {
      setLoading(false)
    }
  }, [clientsLoading])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    trackFeatureUsage(`tab_${tab}`)
  }

  const handleLocationChange = (locationId: string) => {
    switchLocation(locationId)
    trackFeatureUsage('location_switch')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading your dashboard...</div>
      </div>
    )
  }

  if (availableClients.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🏢</div>
          <h2 className="text-xl font-semibold mb-2">No Dashboard Access</h2>
          <p className="text-slate-400 mb-4">You don&apos;t have access to any client dashboards yet.</p>
          <p className="text-slate-400 text-sm">Contact your agency administrator to get access.</p>
        </div>
      </div>
    )
  }

  if (!currentClient) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading client data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Image src="/logo.png" alt="TableTalk Radar" width={150} height={40} className="h-10 w-auto" />
              
              {/* Client Selector */}
              <div className="flex items-center space-x-2">
                <select
                  value={currentClient?.id || ''}
                  onChange={(e) => switchClient(e.target.value)}
                  className="bg-slate-700 text-white px-3 py-1 rounded-md text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableClients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.business_name} ({client.total_locations} locations)
                    </option>
                  ))}
                </select>
                
                {currentClientUser && (
                  <span className="px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded-full capitalize">
                    {currentClientUser.role}
                  </span>
                )}
              </div>

              {/* Location Selector */}
              {clientLocations.length > 1 && (
                <div className="flex items-center space-x-2 border-l border-slate-600 pl-4">
                  <span className="text-slate-400 text-sm">Location:</span>
                  <select
                    value={selectedLocation?.id || ''}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="bg-slate-700 text-white px-2 py-1 rounded text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {clientLocations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.location_name}
                        {location.is_primary_location && ' (Main)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-slate-300 text-sm">
                <div>{currentClient?.business_name}</div>
                <div className="text-xs text-slate-500">
                  {selectedLocation?.city}, {selectedLocation?.state}
                </div>
              </div>
              <div className="text-slate-300 text-sm">
                Welcome, {user?.email}
              </div>
              <button
                onClick={signOut}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', name: 'Overview', icon: '📊', show: true },
              { id: 'locations', name: 'All Locations', icon: '📍', show: clientLocations.length > 1 },
              { id: 'seo', name: 'SEO Performance', icon: '🔍', show: canViewSEOData },
              { id: 'keywords', name: 'Keywords', icon: '🏷️', show: canViewSEOData },
              { id: 'social', name: 'Social Media', icon: '📱', show: canCreatePosts },
              { id: 'reviews', name: 'Reviews', icon: '💬', show: canRespondReviews },
              { id: 'analytics', name: 'Analytics', icon: '📈', show: canViewAnalytics },
              { id: 'settings', name: 'Settings', icon: '⚙️', show: canManageSettings }
            ].filter(tab => tab.show).map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Business Header */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-semibold text-white">{currentClient?.business_name}</h1>
                    {clientLocations.length > 1 && (
                      <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                        {clientLocations.length} Locations
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 mb-4">
                    {currentClient?.industry} • Managed by {currentClient?.agency_name}
                  </p>
                  
                  {selectedLocation && (
                    <div className="bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-medium">
                          📍 {selectedLocation.location_name}
                          {selectedLocation.is_primary_location && (
                            <span className="ml-2 bg-green-600 text-white px-2 py-0.5 rounded text-xs">
                              Main Location
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm">
                          {selectedLocation.google_rating && (
                            <div className="text-yellow-400">
                              ⭐ {selectedLocation.google_rating} ({selectedLocation.google_review_count} reviews)
                            </div>
                          )}
                          {selectedLocation.local_seo_score && (
                            <div className={`font-medium ${
                              selectedLocation.local_seo_score >= 80 ? 'text-green-400' :
                              selectedLocation.local_seo_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              SEO: {selectedLocation.local_seo_score.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm">{selectedLocation.address}</p>
                      {selectedLocation.phone && (
                        <p className="text-slate-400 text-sm">📞 {selectedLocation.phone}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Overview Stats */}
            {selectedLocation && (
              <LocationOverviewStats 
                locationId={selectedLocation.id}
                className=""
              />
            )}

            {/* Quick Access Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {canViewSEOData && selectedLocation && (
                <LocationSEODashboard 
                  locationId={selectedLocation.id}
                  className=""
                />
              )}
              
              {canRespondReviews && selectedLocation && (
                <LocationReviewManager 
                  locationId={selectedLocation.id}
                  className=""
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'locations' && clientLocations.length > 1 && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">All Locations</h2>
              <LocationSelector 
                locations={clientLocations}
                selectedLocation={selectedLocation}
                onLocationSelect={handleLocationChange}
                showStats={true}
              />
            </div>
          </div>
        )}

        {activeTab === 'seo' && canViewSEOData && selectedLocation && (
          <LocationSEODashboard 
            locationId={selectedLocation.id}
            className=""
          />
        )}

        {activeTab === 'keywords' && canViewSEOData && selectedLocation && (
          <LocationKeywordTracker 
            locationId={selectedLocation.id}
            className=""
          />
        )}

        {activeTab === 'social' && canCreatePosts && selectedLocation && (
          <LocationSocialCalendar 
            locationId={selectedLocation.id}
            className=""
          />
        )}

        {activeTab === 'reviews' && canRespondReviews && selectedLocation && (
          <LocationReviewManager 
            locationId={selectedLocation.id}
            className=""
          />
        )}

        {activeTab === 'analytics' && canViewAnalytics && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Analytics & Insights</h2>
              <div className="text-center text-slate-400 py-12">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-lg font-medium mb-2">Advanced Analytics</h3>
                <p>Detailed analytics across all locations will be available here</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && canManageSettings && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Business Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Business Name</label>
                  <input
                    type="text"
                    value={currentClient?.business_name || ''}
                    readOnly
                    className="w-full bg-slate-700 text-slate-400 px-3 py-2 rounded border border-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Industry</label>
                  <input
                    type="text"
                    value={currentClient?.industry || ''}
                    readOnly
                    className="w-full bg-slate-700 text-slate-400 px-3 py-2 rounded border border-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Total Locations</label>
                  <input
                    type="text"
                    value={clientLocations.length}
                    readOnly
                    className="w-full bg-slate-700 text-slate-400 px-3 py-2 rounded border border-slate-600"
                  />
                </div>
                <div className="text-slate-400 text-sm mt-4">
                  Contact your agency administrator to update business information or add new locations.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}