'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../providers/AuthProvider'
import { useAutoSave } from '@/hooks/useAutoSave'
import { GoogleBusinessProfile, GoogleReview } from '@/lib/google-business'

interface Business {
  id: string
  name: string
  address: string
  phone: string
  website: string
  rating: number
  review_count: number
  status: 'active' | 'inactive'
  created_at: string
  google_place_id?: string
  google_business_account?: string
  google_location_name?: string
  google_reviews?: GoogleReview[]
  google_profile?: GoogleBusinessProfile
  last_sync?: string
}

export default function BusinessManager() {
  const { user } = useAuth()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [showGoogleIntegration, setShowGoogleIntegration] = useState(false)
  const [syncingBusiness, setSyncingBusiness] = useState<string | null>(null)
  const [newBusiness, setNewBusiness] = useState({
    name: '',
    address: '',
    phone: '',
    website: '',
    google_place_id: ''
  })

  // Auto-save for business updates
  const { isSaving, lastSaved, error: autoSaveError } = useAutoSave({
    table: 'businesses',
    id: selectedBusiness?.id,
    data: selectedBusiness ? {
      name: selectedBusiness.name,
      address: selectedBusiness.address,
      phone: selectedBusiness.phone,
      website: selectedBusiness.website,
      status: selectedBusiness.status,
      google_place_id: selectedBusiness.google_place_id,
      google_business_account: selectedBusiness.google_business_account,
      google_location_name: selectedBusiness.google_location_name,
      updated_at: new Date().toISOString()
    } : {},
    onSave: (savedData) => {
      // Update the business in the local state
      setBusinesses(prev => prev.map(b => 
        b.id === savedData.id ? { ...b, ...savedData } : b
      ))
    },
    onError: (error) => {
      console.error('Failed to auto-save business:', error)
    }
  })

  useEffect(() => {
    loadBusinesses()
  }, [])

  const loadBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBusinesses(data || [])
    } catch (error) {
      console.error('Error loading businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert([{
          ...newBusiness,
          user_id: user?.id,
          status: 'active',
          created_at: new Date().toISOString()
        }])
        .select()

      if (error) throw error
      
      setBusinesses([...businesses, ...(data || [])])
      setNewBusiness({ name: '', address: '', phone: '', website: '', google_place_id: '' })
      setShowAddForm(false)

      // If Google Place ID was provided, sync data immediately
      if (newBusiness.google_place_id && data?.[0]) {
        await syncWithGoogle(data[0].id, newBusiness.google_place_id)
      }
    } catch (error) {
      console.error('Error adding business:', error)
    }
  }

  const syncWithGoogle = async (businessId: string, placeId?: string) => {
    setSyncingBusiness(businessId)
    try {
      const business = businesses.find(b => b.id === businessId)
      if (!business) return

      // Mock Google data sync - in production, you'd call the actual Google APIs
      const mockGoogleData = {
        google_profile: {
          name: business.name,
          title: business.name,
          phoneNumbers: { primaryPhone: business.phone },
          storefrontAddress: {
            addressLines: [business.address],
            locality: 'City',
            administrativeArea: 'State',
            postalCode: '12345',
            regionCode: 'US'
          },
          websiteUri: business.website,
          categories: {
            primaryCategory: { displayName: 'Business' },
            additionalCategories: []
          },
          regularHours: {
            periods: [
              {
                openDay: 'MONDAY',
                openTime: '09:00',
                closeDay: 'MONDAY', 
                closeTime: '17:00'
              }
            ]
          },
          labels: [] as string[],
          localPostAttributes: [] as Array<{
            attributeId: string
            values: string[]
          }>,
          moreHours: [] as Array<{
            hoursTypeId: string
            periods: Array<{
              openDay: string
              openTime: string
              closeDay: string
              closeTime: string
            }>
          }>,
          latlng: { latitude: 40.7128, longitude: -74.0060 }
        } as GoogleBusinessProfile,
        google_reviews: [
          {
            name: 'locations/123/reviews/mock_review_1',
            reviewId: 'mock_review_1',
            reviewer: {
              displayName: 'John Doe',
              profilePhotoUrl: '',
              isAnonymous: false
            },
            starRating: 5,
            comment: 'Great service! Highly recommended.',
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString()
          },
          {
            name: 'locations/123/reviews/mock_review_2',
            reviewId: 'mock_review_2',
            reviewer: {
              displayName: 'Jane Smith',
              profilePhotoUrl: '',
              isAnonymous: false
            },
            starRating: 4,
            comment: 'Good experience overall.',
            createTime: new Date(Date.now() - 86400000).toISOString(),
            updateTime: new Date(Date.now() - 86400000).toISOString()
          }
        ] as GoogleReview[],
        rating: 4.5,
        review_count: 2,
        last_sync: new Date().toISOString()
      }

      // Update business with Google data
      const { data, error } = await supabase
        .from('businesses')
        .update(mockGoogleData)
        .eq('id', businessId)
        .select()

      if (error) throw error

      // Update local state
      setBusinesses(prev => prev.map(b => 
        b.id === businessId ? { ...b, ...mockGoogleData } as Business : b
      ))

    } catch (error) {
      console.error('Error syncing with Google:', error)
    } finally {
      setSyncingBusiness(null)
    }
  }

  const handleBusinessUpdate = (field: keyof Business, value: string | number | 'active' | 'inactive') => {
    if (selectedBusiness) {
      setSelectedBusiness(prev => prev ? { ...prev, [field]: value } : null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading businesses...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Businesses</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Add Business
        </button>
      </div>

      {showAddForm && (
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Add New Business</h2>
          <form onSubmit={handleAddBusiness} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={newBusiness.name}
                onChange={(e) => setNewBusiness({...newBusiness, name: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Address
              </label>
              <input
                type="text"
                value={newBusiness.address}
                onChange={(e) => setNewBusiness({...newBusiness, address: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="text"
                value={newBusiness.phone}
                onChange={(e) => setNewBusiness({...newBusiness, phone: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                value={newBusiness.website}
                onChange={(e) => setNewBusiness({...newBusiness, website: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Google Place ID (Optional)
              </label>
              <input
                type="text"
                value={newBusiness.google_place_id}
                onChange={(e) => setNewBusiness({...newBusiness, google_place_id: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                placeholder="Enter Google Place ID for automatic sync"
              />
              <p className="text-gray-400 text-xs mt-1">
                Find your Google Place ID at developers.google.com/maps/documentation/places
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add Business
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businesses.map((business) => (
          <div key={business.id} className="bg-slate-800 p-6 rounded-lg hover:bg-slate-750 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-white">{business.name}</h3>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  business.status === 'active' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {business.status}
                </span>
                {business.google_place_id && (
                  <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                    Google
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-2 text-gray-300 mb-4">
              <p className="text-sm">{business.address}</p>
              {business.phone && <p className="text-sm">📞 {business.phone}</p>}
              {business.website && (
                <a 
                  href={business.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-300 text-sm block"
                >
                  🌐 {business.website}
                </a>
              )}
              
              {/* Google Reviews Section */}
              {business.google_reviews && business.google_reviews.length > 0 && (
                <div className="mt-3 p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Google Reviews</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400">⭐</span>
                      <span className="text-sm">{business.rating}</span>
                      <span className="text-sm text-gray-400">({business.review_count})</span>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {business.google_reviews.slice(0, 2).map((review, index) => (
                      <div key={review.reviewId || index} className="text-xs">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-300">{review.reviewer.displayName}</span>
                          <div className="flex">
                            {Array.from({ length: review.starRating }, (_, i) => (
                              <span key={i} className="text-yellow-400">⭐</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-400 line-clamp-2">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {business.last_sync && (
                <p className="text-xs text-gray-500">
                  Last synced: {new Date(business.last_sync).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => setSelectedBusiness(business)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => syncWithGoogle(business.id)}
                disabled={syncingBusiness === business.id}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {syncingBusiness === business.id ? '🔄' : '🔄 Sync'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {businesses.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-xl font-medium text-white mb-2">No businesses yet</h3>
          <p className="text-gray-400 mb-4">Add your first business to get started</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Add Your First Business
          </button>
        </div>
      )}

      {/* Business Edit Modal */}
      {selectedBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Edit Business</h2>
              <div className="flex items-center space-x-2">
                {isSaving && (
                  <div className="flex items-center space-x-2 text-yellow-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent"></div>
                    <span className="text-sm">Saving...</span>
                  </div>
                )}
                {lastSaved && !isSaving && (
                  <span className="text-green-400 text-sm">
                    Saved {formatTimeAgo(lastSaved)}
                  </span>
                )}
                {autoSaveError && (
                  <span className="text-red-400 text-sm">Save failed</span>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={selectedBusiness.name}
                    onChange={(e) => handleBusinessUpdate('name', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={selectedBusiness.status}
                    onChange={(e) => handleBusinessUpdate('status', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={selectedBusiness.address}
                  onChange={(e) => handleBusinessUpdate('address', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={selectedBusiness.phone}
                    onChange={(e) => handleBusinessUpdate('phone', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={selectedBusiness.website}
                    onChange={(e) => handleBusinessUpdate('website', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Google Reviews Display */}
              {selectedBusiness.google_reviews && selectedBusiness.google_reviews.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Google Reviews ({selectedBusiness.google_reviews.length})
                  </label>
                  <div className="bg-slate-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {selectedBusiness.google_reviews.map((review, index) => (
                      <div key={review.reviewId || index} className="mb-4 pb-4 border-b border-slate-600 last:border-b-0 last:mb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-white">{review.reviewer.displayName}</span>
                            <div className="flex">
                              {Array.from({ length: review.starRating }, (_, i) => (
                                <span key={i} className="text-yellow-400">⭐</span>
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(review.createTime).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{review.comment}</p>
                        {review.reviewReply && (
                          <div className="bg-slate-600 p-2 rounded text-sm">
                            <p className="text-blue-300 font-medium mb-1">Business Reply:</p>
                            <p className="text-gray-300">{review.reviewReply.comment}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => syncWithGoogle(selectedBusiness.id)}
                  disabled={syncingBusiness === selectedBusiness.id}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {syncingBusiness === selectedBusiness.id ? 'Syncing...' : 'Sync with Google'}
                </button>
                <button
                  onClick={() => setSelectedBusiness(null)}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  
  if (diffSeconds < 60) {
    return 'just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  } else {
    const diffHours = Math.floor(diffMinutes / 60)
    return `${diffHours}h ago`
  }
}