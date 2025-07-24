'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Location {
  id: string
  business_name: string
  address: string
  city: string
  state: string
  google_rating?: number
  google_review_count?: number
  google_place_id?: string
}

export default function GoogleReviewScraper() {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('client_locations')
        .select(`
          id,
          business_name,
          address,
          city,
          state,
          google_rating,
          google_review_count,
          google_place_id
        `)
        .eq('is_active', true)
        .order('business_name')

      if (error) throw error
      setLocations(data || [])
    } catch (error) {
      console.error('Error loading locations:', error)
    }
  }

  const scrapeGoogleReviews = async () => {
    if (!selectedLocation) return

    setLoading(true)
    setMessage('')
    setResults(null)

    try {
      const response = await fetch('/api/reviews/google-scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location_id: selectedLocation.id,
          business_name: selectedLocation.business_name,
          address: selectedLocation.address
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data.data)
        setMessage('✅ Google reviews scraped successfully!')
        loadLocations() // Refresh the locations to show updated data
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error scraping reviews:', error)
      setMessage('❌ Failed to scrape reviews')
    } finally {
      setLoading(false)
    }
  }

  const testAllLocations = async () => {
    setLoading(true)
    setMessage('')
    setResults(null)

    try {
      // Get agency ID from the first location
      const { data: locationData } = await supabase
        .from('client_locations')
        .select('agency_id')
        .eq('is_active', true)
        .limit(1)
        .single()

      if (!locationData) {
        setMessage('❌ No locations found')
        return
      }

      const response = await fetch('/api/reviews/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agency_id: locationData.agency_id
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data)
        setMessage(`✅ Scraped ${data.newReviews} new reviews from ${data.locationsScraped} locations!`)
        loadLocations() // Refresh the locations to show updated data
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error scraping all reviews:', error)
      setMessage('❌ Failed to scrape reviews')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Google Review Scraper</h3>
        <p className="text-slate-400 text-sm mb-4">
          Test the Google Places API integration to scrape real reviews from Google My Business.
        </p>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('✅') ? 'bg-green-900/20 border border-green-500 text-green-400' :
            'bg-red-900/20 border border-red-500 text-red-400'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Select Location</label>
            <select
              value={selectedLocation?.id || ''}
              onChange={(e) => {
                const location = locations.find(l => l.id === e.target.value)
                setSelectedLocation(location || null)
              }}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Choose a location...</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.business_name} - {location.city}, {location.state}
                  {location.google_place_id && ' ✓'}
                </option>
              ))}
            </select>
          </div>

          {selectedLocation && (
            <div className="bg-slate-700 p-3 rounded text-sm">
              <p className="text-white font-medium">{selectedLocation.business_name}</p>
              <p className="text-slate-300">{selectedLocation.address}</p>
              <p className="text-slate-300">{selectedLocation.city}, {selectedLocation.state}</p>
              {selectedLocation.google_rating && (
                <p className="text-slate-300">
                  Current Google Rating: {selectedLocation.google_rating} 
                  ({selectedLocation.google_review_count} reviews)
                </p>
              )}
              {selectedLocation.google_place_id && (
                <p className="text-green-400 text-xs">✓ Google Place ID: {selectedLocation.google_place_id}</p>
              )}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={scrapeGoogleReviews}
              disabled={loading || !selectedLocation}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              {loading ? 'Scraping...' : 'Scrape Selected Location'}
            </button>

            <button
              onClick={testAllLocations}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              {loading ? 'Scraping...' : 'Scrape All Locations'}
            </button>
          </div>
        </div>
      </div>

      {results && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Scraping Results</h4>
          <div className="space-y-3">
            {results.location_name && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-slate-700 p-3 rounded">
                    <div className="text-blue-400 font-bold">{results.total_reviews_found || 0}</div>
                    <div className="text-slate-300">Reviews Found</div>
                  </div>
                  <div className="bg-slate-700 p-3 rounded">
                    <div className="text-green-400 font-bold">{results.new_reviews_imported || 0}</div>
                    <div className="text-slate-300">New Reviews</div>
                  </div>
                  <div className="bg-slate-700 p-3 rounded">
                    <div className="text-purple-400 font-bold">{results.google_rating || 'N/A'}</div>
                    <div className="text-slate-300">Google Rating</div>
                  </div>
                  <div className="bg-slate-700 p-3 rounded">
                    <div className="text-orange-400 font-bold">{results.listing_completeness || 0}%</div>
                    <div className="text-slate-300">Listing Complete</div>
                  </div>
                </div>

                {results.business_profile && (
                  <div className="bg-slate-700 p-3 rounded">
                    <h5 className="text-white font-medium mb-2">Business Profile</h5>
                    <div className="text-sm space-y-1">
                      <p className="text-slate-300"><strong>Name:</strong> {results.business_profile.name}</p>
                      <p className="text-slate-300"><strong>Address:</strong> {results.business_profile.address}</p>
                      {results.business_profile.phone && (
                        <p className="text-slate-300"><strong>Phone:</strong> {results.business_profile.phone}</p>
                      )}
                      {results.business_profile.website && (
                        <p className="text-slate-300"><strong>Website:</strong> {results.business_profile.website}</p>
                      )}
                      <p className="text-slate-300">
                        <strong>Status:</strong> {results.business_profile.currently_open ? 'Open' : 'Closed/Unknown'}
                      </p>
                      <p className="text-slate-300">
                        <strong>Photos:</strong> {results.business_profile.has_photos ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {results.results && (
              <div className="bg-slate-700 p-3 rounded">
                <h5 className="text-white font-medium mb-2">Bulk Scraping Results</h5>
                <div className="text-sm space-y-1">
                  <p className="text-slate-300"><strong>New Reviews:</strong> {results.newReviews}</p>
                  <p className="text-slate-300"><strong>Locations Scraped:</strong> {results.locationsScraped}</p>
                  <p className="text-slate-300"><strong>Response Rate:</strong> {results.statistics.responsePercentage}%</p>
                </div>
                {results.results.length > 0 && (
                  <div className="mt-2">
                    <h6 className="text-white text-xs font-medium mb-1">Location Details:</h6>
                    {results.results.map((result: any, index: number) => (
                      <div key={index} className="text-xs text-slate-400">
                        {result.location_name}: {result.reviews_found} reviews found
                        {result.error && ` (Error: ${result.error})`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}