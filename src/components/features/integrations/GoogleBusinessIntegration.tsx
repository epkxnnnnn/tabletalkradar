'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { supabase } from '@/lib/supabase'

interface GoogleIntegration {
  id: string
  provider_account_name: string
  status: string
  created_at: string
  scopes: string[]
}

interface GoogleLocation {
  name: string
  title: string
  websiteUri?: string
  phoneNumbers?: { number: string }[]
  categories?: { displayName: string }[]
}

interface GoogleReview {
  name: string
  reviewId: string
  reviewer: { displayName: string; profilePhotoUrl?: string }
  starRating: string
  comment: string
  createTime: string
  reviewReply?: { comment: string; updateTime: string }
}

interface GoogleBusinessIntegrationProps {
  clientId: string
  clientName: string
}

export default function GoogleBusinessIntegration({ clientId, clientName }: GoogleBusinessIntegrationProps) {
  const { user } = useAuth()
  const [integration, setIntegration] = useState<GoogleIntegration | null>(null)
  const [locations, setLocations] = useState<GoogleLocation[]>([])
  const [selectedLocation, setSelectedLocation] = useState<GoogleLocation | null>(null)
  const [reviews, setReviews] = useState<GoogleReview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [replyText, setReplyText] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  // Check for existing integration
  useEffect(() => {
    if (user && clientId) {
      loadIntegration()
    }
  }, [user, clientId])

  // Load locations when integration is found
  useEffect(() => {
    if (integration) {
      loadLocations()
    }
  }, [integration])

  // Load reviews when location is selected
  useEffect(() => {
    if (selectedLocation) {
      loadReviews()
    }
  }, [selectedLocation])

  const loadIntegration = async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user?.id)
        .eq('client_id', clientId)
        .eq('provider', 'google_business')
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setIntegration(data)
    } catch (error) {
      console.error('Error loading integration:', error)
    }
  }

  const connectGoogleBusiness = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/v1/google-business/auth?client_id=${clientId}`)
      const data = await response.json()

      if (response.ok) {
        // Redirect to Google OAuth
        window.location.href = data.data.auth_url
      } else {
        throw new Error(data.error || 'Failed to initialize Google OAuth')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  const loadLocations = async () => {
    if (!integration) return

    setLoading(true)
    try {
      const response = await fetch(`/api/v1/google-business/locations?client_id=${clientId}`)
      const data = await response.json()

      if (response.ok) {
        setLocations(data.data.locations || [])
        if (data.data.locations?.length > 0) {
          setSelectedLocation(data.data.locations[0])
        }
      } else {
        throw new Error(data.error || 'Failed to load locations')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load locations')
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    if (!selectedLocation) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/v1/google-business/reviews?client_id=${clientId}&location_name=${encodeURIComponent(selectedLocation.name)}`
      )
      const data = await response.json()

      if (response.ok) {
        setReviews(data.data.reviews || [])
      } else {
        throw new Error(data.error || 'Failed to load reviews')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const replyToReview = async (reviewName: string) => {
    if (!replyText.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/v1/google-business/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          review_name: reviewName,
          reply_text: replyText.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        setReplyText('')
        setReplyingTo(null)
        loadReviews() // Refresh reviews to show the new reply
      } else {
        throw new Error(data.error || 'Failed to post reply')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to post reply')
    } finally {
      setLoading(false)
    }
  }

  const disconnectIntegration = async () => {
    if (!integration || !confirm('Are you sure you want to disconnect Google Business Profile?')) return

    try {
      const { error } = await supabase
        .from('integrations')
        .update({ status: 'inactive' })
        .eq('id', integration.id)

      if (error) throw error

      setIntegration(null)
      setLocations([])
      setSelectedLocation(null)
      setReviews([])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to disconnect')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderStars = (rating: string) => {
    const stars = parseInt(rating) || 0
    return '★'.repeat(stars) + '☆'.repeat(5 - stars)
  }

  if (!integration) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">G</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Google Business Profile</h3>
              <p className="text-slate-400 text-sm">Manage your Google Business listings and reviews</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm">
            Not Connected
          </span>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="text-slate-300">
            <h4 className="font-medium mb-2">Features:</h4>
            <ul className="text-sm space-y-1 text-slate-400">
              <li>• View and manage business locations</li>
              <li>• Monitor and respond to customer reviews</li>
              <li>• Create and manage Google posts</li>
              <li>• Track business insights and analytics</li>
            </ul>
          </div>

          <button
            onClick={connectGoogleBusiness}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Connecting...' : 'Connect Google Business Profile'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">G</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Google Business Profile</h3>
            <p className="text-slate-400 text-sm">
              Connected as {integration.provider_account_name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-green-900/20 text-green-400 rounded-full text-sm">
            Connected
          </span>
          <button
            onClick={disconnectIntegration}
            className="text-slate-400 hover:text-red-400 text-sm"
          >
            Disconnect
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Location Selector */}
      {locations.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Select Location
          </label>
          <select
            value={selectedLocation?.name || ''}
            onChange={(e) => {
              const location = locations.find(l => l.name === e.target.value)
              setSelectedLocation(location || null)
            }}
            className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
          >
            {locations.map((location) => (
              <option key={location.name} value={location.name}>
                {location.title || location.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Reviews Section */}
      {selectedLocation && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Recent Reviews</h4>
            <button
              onClick={loadReviews}
              disabled={loading}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No reviews found for this location.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.name} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {review.reviewer.profilePhotoUrl && (
                        <img
                          src={review.reviewer.profilePhotoUrl}
                          alt={review.reviewer.displayName}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium text-white">
                          {review.reviewer.displayName}
                        </p>
                        <div className="text-yellow-400">
                          {renderStars(review.starRating)}
                        </div>
                      </div>
                    </div>
                    <span className="text-slate-400 text-sm">
                      {formatDate(review.createTime)}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="text-slate-300 mb-3">{review.comment}</p>
                  )}

                  {review.reviewReply ? (
                    <div className="bg-slate-600 rounded-lg p-3 mt-3">
                      <p className="text-sm font-medium text-slate-300 mb-1">
                        Business Response:
                      </p>
                      <p className="text-slate-300 text-sm">{review.reviewReply.comment}</p>
                      <p className="text-slate-400 text-xs mt-1">
                        {formatDate(review.reviewReply.updateTime)}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3">
                      {replyingTo === review.name ? (
                        <div className="space-y-2">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your reply..."
                            className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none resize-none"
                            rows={3}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => replyToReview(review.name)}
                              disabled={loading || !replyText.trim()}
                              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
                            >
                              {loading ? 'Posting...' : 'Post Reply'}
                            </button>
                            <button
                              onClick={() => {
                                setReplyingTo(null)
                                setReplyText('')
                              }}
                              className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingTo(review.name)}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Reply to Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}