'use client'

import React, { useState, useEffect } from 'react'
import { useAgency } from './AgencyProvider'
import { supabase } from '@/lib/supabase'

interface Review {
  id: string
  client_id: string
  client_name: string
  platform: 'google' | 'yelp'
  reviewer_name: string
  rating: number
  review_text: string
  review_date: string
  response_status: 'pending' | 'ai_generated' | 'responded' | 'ignored'
  ai_response?: string
  manual_response?: string
  responded_at?: string
  review_url?: string
  scraped_at: string
}

interface Client {
  id: string
  business_name: string
  website: string
  industry: string
  location: string
  google_place_id?: string
  yelp_business_id?: string
}

export default function ReviewResponder() {
  const { currentAgency } = useAgency()
  const [clients, setClients] = useState<Client[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('pending')
  const [isScrapingReviews, setIsScrapingReviews] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [aiResponseLoading, setAiResponseLoading] = useState(false)
  const [manualResponse, setManualResponse] = useState('')
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false)
  const [statistics, setStatistics] = useState({
    totalReviews: 0,
    respondedReviews: 0,
    responsePercentage: 0,
    pendingReviews: 0
  })

  useEffect(() => {
    if (currentAgency) {
      loadClients()
      loadReviews()
    }
  }, [currentAgency])

  useEffect(() => {
    loadReviews()
  }, [selectedClient, selectedPlatform, selectedStatus])

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, business_name, website, industry, location')
        .eq('agency_id', currentAgency?.id)
        .eq('status', 'active')
        .order('business_name')

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const loadReviews = async () => {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          clients(business_name)
        `)
        .eq('agency_id', currentAgency?.id)
        .order('review_date', { ascending: false })

      if (selectedClient !== 'all') {
        query = query.eq('client_id', selectedClient)
      }

      if (selectedPlatform !== 'all') {
        query = query.eq('platform', selectedPlatform)
      }

      if (selectedStatus !== 'all') {
        query = query.eq('response_status', selectedStatus)
      }

      const { data, error } = await query

      if (error) throw error
      
      const formattedReviews = (data || []).map(review => ({
        ...review,
        client_name: review.clients?.business_name || 'Unknown Client'
      }))
      
      setReviews(formattedReviews)
      
      // Calculate statistics for filtered reviews
      const totalReviews = formattedReviews.length
      const respondedReviews = formattedReviews.filter(r => r.response_status === 'responded').length
      const responsePercentage = totalReviews > 0 ? Math.round((respondedReviews / totalReviews) * 100) : 0
      const pendingReviews = formattedReviews.filter(r => r.response_status === 'pending').length
      
      setStatistics({
        totalReviews,
        respondedReviews,
        responsePercentage,
        pendingReviews
      })
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  const scrapeReviews = async () => {
    setIsScrapingReviews(true)
    try {
      const response = await fetch('/api/reviews/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_id: currentAgency?.id,
          client_id: selectedClient !== 'all' ? selectedClient : null
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Update statistics from scrape result
        if (result.statistics) {
          setStatistics(result.statistics)
        }
        
        alert(`🔍 Review scraping completed!\n\nFound ${result.newReviews} new reviews across ${result.clientsScraped} clients.\n\nResponse Rate: ${result.statistics?.responsePercentage || 0}% (${result.statistics?.respondedReviews || 0}/${result.statistics?.totalReviews || 0})`)
        loadReviews()
      } else {
        throw new Error(result.error || 'Scraping failed')
      }
    } catch (error) {
      console.error('Error scraping reviews:', error)
      alert('❌ Review scraping failed. Please try again.')
    } finally {
      setIsScrapingReviews(false)
    }
  }

  const generateAIResponse = async (review: Review) => {
    setAiResponseLoading(true)
    try {
      const client = clients.find(c => c.id === review.client_id)
      
      const response = await fetch('/api/reviews/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: review.id,
          business_name: client?.business_name,
          industry: client?.industry,
          rating: review.rating,
          review_text: review.review_text,
          reviewer_name: review.reviewer_name,
          platform: review.platform
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Update the review with AI response
        const { error } = await supabase
          .from('reviews')
          .update({ 
            ai_response: result.response,
            response_status: 'ai_generated'
          })
          .eq('id', review.id)

        if (!error) {
          setSelectedReview({
            ...review,
            ai_response: result.response,
            response_status: 'ai_generated'
          })
          loadReviews()
        }
      } else {
        throw new Error(result.error || 'AI response generation failed')
      }
    } catch (error) {
      console.error('Error generating AI response:', error)
      alert('❌ Failed to generate AI response. Please try again.')
    } finally {
      setAiResponseLoading(false)
    }
  }

  const submitManualResponse = async () => {
    if (!selectedReview || !manualResponse.trim()) return

    setIsSubmittingResponse(true)
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ 
          manual_response: manualResponse,
          response_status: 'responded',
          responded_at: new Date().toISOString()
        })
        .eq('id', selectedReview.id)

      if (error) throw error

      alert('✅ Response submitted successfully!')
      setManualResponse('')
      setSelectedReview(null)
      loadReviews()
    } catch (error) {
      console.error('Error submitting response:', error)
      alert('❌ Failed to submit response. Please try again.')
    } finally {
      setIsSubmittingResponse(false)
    }
  }

  const getStarRating = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-400'
    if (rating >= 3) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900/20 text-yellow-400'
      case 'ai_generated': return 'bg-blue-900/20 text-blue-400'
      case 'responded': return 'bg-green-900/20 text-green-400'
      case 'ignored': return 'bg-gray-900/20 text-gray-400'
      default: return 'bg-slate-900/20 text-slate-400'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Review Responder</h2>
            <p className="text-slate-400 text-sm mt-1">Get real Google & Yelp reviews using HasData API + AI responses</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-slate-500 text-sm">
              🔥 Powered by HasData API
            </div>
            <button
              onClick={scrapeReviews}
              disabled={isScrapingReviews}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isScrapingReviews
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isScrapingReviews ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Getting Real Reviews...</span>
                </div>
              ) : (
                '🔥 Get Real Reviews'
              )}
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{statistics.totalReviews}</div>
            <div className="text-slate-400 text-sm">Total Reviews</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{statistics.respondedReviews}</div>
            <div className="text-slate-400 text-sm">Responded</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{statistics.pendingReviews}</div>
            <div className="text-slate-400 text-sm">Pending</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${statistics.responsePercentage >= 80 ? 'text-green-400' : statistics.responsePercentage >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {statistics.responsePercentage}%
            </div>
            <div className="text-slate-400 text-sm">Response Rate</div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Client</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-red-500 focus:outline-none"
            >
              <option value="all">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.business_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Platform</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-red-500 focus:outline-none"
            >
              <option value="all">All Platforms</option>
              <option value="google">Google Reviews</option>
              <option value="yelp">Yelp Reviews</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-red-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Response</option>
              <option value="ai_generated">AI Response Ready</option>
              <option value="responded">Responded</option>
              <option value="ignored">Ignored</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadReviews}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded font-medium transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Reviews ({reviews.length})
          </h3>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {reviews.length > 0 ? reviews.map(review => (
              <div 
                key={review.id} 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedReview?.id === review.id 
                    ? 'border-red-500 bg-slate-700' 
                    : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                }`}
                onClick={() => setSelectedReview(review)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">{review.client_name}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400 text-sm capitalize">{review.platform}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.response_status)}`}>
                    {review.response_status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`text-lg ${getRatingColor(review.rating)}`}>
                    {getStarRating(review.rating)}
                  </span>
                  <span className="text-slate-400 text-sm">by {review.reviewer_name}</span>
                  <span className="text-slate-500 text-xs">• {formatDate(review.review_date)}</span>
                </div>
                
                <p className="text-slate-300 text-sm line-clamp-3">
                  {review.review_text}
                </p>
              </div>
            )) : (
              <div className="text-center text-slate-400 py-8">
                <div className="text-4xl mb-2">📝</div>
                <p>No reviews found</p>
                <p className="text-sm">Try scraping for new reviews or adjusting filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Review Detail & Response Panel */}
        <div className="bg-slate-800 rounded-lg p-6">
          {selectedReview ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Review Details</h3>
                
                <div className="bg-slate-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-medium">{selectedReview.client_name}</span>
                    <span className="text-slate-400 text-sm capitalize">{selectedReview.platform}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <span className={`text-xl ${getRatingColor(selectedReview.rating)}`}>
                      {getStarRating(selectedReview.rating)}
                    </span>
                    <span className="text-slate-300">by {selectedReview.reviewer_name}</span>
                  </div>
                  
                  <p className="text-slate-300 text-sm mb-3">{selectedReview.review_text}</p>
                  
                  <div className="text-slate-500 text-xs">
                    Posted: {formatDate(selectedReview.review_date)}
                  </div>
                </div>
              </div>

              {/* AI Response Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium">AI Generated Response</h4>
                  <button
                    onClick={() => generateAIResponse(selectedReview)}
                    disabled={aiResponseLoading}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      aiResponseLoading
                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {aiResponseLoading ? 'Generating...' : '⚡ Generate AI Response'}
                  </button>
                </div>
                
                {selectedReview.ai_response ? (
                  <div className="bg-slate-700 rounded-lg p-4 mb-4">
                    <p className="text-slate-300 text-sm">{selectedReview.ai_response}</p>
                  </div>
                ) : (
                  <div className="bg-slate-700 rounded-lg p-4 mb-4 text-center text-slate-400">
                    <p className="text-sm">No AI response generated yet</p>
                  </div>
                )}
              </div>

              {/* Manual Response Section */}
              <div>
                <h4 className="text-white font-medium mb-3">Your Response</h4>
                <textarea
                  value={manualResponse}
                  onChange={(e) => setManualResponse(e.target.value)}
                  placeholder="Write your response here... (or edit the AI response above)"
                  className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none resize-none"
                  rows={6}
                />
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setManualResponse(selectedReview.ai_response || '')}
                      disabled={!selectedReview.ai_response}
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded font-medium transition-colors disabled:opacity-50"
                    >
                      📋 Use AI Response
                    </button>
                    <button
                      onClick={() => setManualResponse('')}
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded font-medium transition-colors"
                    >
                      🗑️ Clear
                    </button>
                  </div>
                  
                  <button
                    onClick={submitManualResponse}
                    disabled={!manualResponse.trim() || isSubmittingResponse}
                    className={`px-4 py-2 rounded font-medium transition-colors ${
                      !manualResponse.trim() || isSubmittingResponse
                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {isSubmittingResponse ? 'Submitting...' : '📤 Submit Response'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-16">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-medium mb-2">Select a Review</h3>
              <p className="text-sm">Choose a review from the list to view details and respond</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}