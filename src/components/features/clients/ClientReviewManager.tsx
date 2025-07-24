'use client'

import React, { useState, useEffect } from 'react'
import { useClient } from './ClientProvider'
import { supabase } from '@/lib/supabase'

interface Review {
  id: string
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
}

interface ClientReviewManagerProps {
  widget: any
  clientId?: string
  config: {
    limit?: number
    show_rating?: boolean
    show_platform?: boolean
    show_actions?: boolean
  }
}

export default function ClientReviewManager({ widget, clientId, config }: ClientReviewManagerProps) {
  const { currentClient, canRespondReviews, trackFeatureUsage } = useClient()
  const [reviews, setReviews] = useState<Review[]>([])
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [aiResponseLoading, setAiResponseLoading] = useState(false)
  const [manualResponse, setManualResponse] = useState('')
  const [loading, setLoading] = useState(true)

  const targetClientId = clientId || currentClient?.id
  const limit = config.limit || 5

  useEffect(() => {
    if (targetClientId) {
      loadReviews()
      trackFeatureUsage('view_reviews')
    }
  }, [targetClientId])

  const loadReviews = async () => {
    if (!targetClientId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('client_id', targetClientId)
        .order('review_date', { ascending: false })
        .limit(limit)

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAIResponse = async (review: Review) => {
    setAiResponseLoading(true)
    try {
      const response = await fetch('/api/reviews/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: review.id,
          business_name: currentClient?.business_name,
          industry: currentClient?.industry,
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
          trackFeatureUsage('generate_ai_review_response')
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
      trackFeatureUsage('submit_review_response')
    } catch (error) {
      console.error('Error submitting response:', error)
      alert('❌ Failed to submit response. Please try again.')
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getPlatformIcon = (platform: string) => {
    return platform === 'google' ? '🔍' : '🏪'
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {widget.widget_title || 'Recent Reviews'}
        </h3>
        <button
          onClick={loadReviews}
          className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-8">
          <div className="animate-spin w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full mx-auto mb-2"></div>
          Loading reviews...
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map(review => (
            <div 
              key={review.id} 
              className="bg-slate-700 rounded-lg p-4 cursor-pointer hover:bg-slate-600 transition-colors"
              onClick={() => setSelectedReview(review)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {config.show_platform !== false && (
                    <span className="text-lg">{getPlatformIcon(review.platform)}</span>
                  )}
                  <span className="text-white font-medium">{review.reviewer_name}</span>
                  <span className="text-slate-400 text-sm">• {formatDate(review.review_date)}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.response_status)}`}>
                  {review.response_status.replace('_', ' ')}
                </span>
              </div>
              
              {config.show_rating !== false && (
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`text-lg ${getRatingColor(review.rating)}`}>
                    {getStarRating(review.rating)}
                  </span>
                  <span className="text-slate-400 text-sm">({review.rating}/5)</span>
                </div>
              )}
              
              <p className="text-slate-300 text-sm line-clamp-2">
                {review.review_text}
              </p>

              {config.show_actions !== false && canRespondReviews && review.response_status === 'pending' && (
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      generateAIResponse(review)
                    }}
                    disabled={aiResponseLoading}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                  >
                    {aiResponseLoading ? 'Generating...' : '🤖 AI Response'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-400 py-8">
          <div className="text-4xl mb-2">💬</div>
          <p>No reviews yet</p>
          <p className="text-sm">Reviews will appear here when customers leave feedback</p>
        </div>
      )}

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Review Details</h3>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Review Info */}
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{selectedReview.reviewer_name}</span>
                    <span className="text-slate-400 text-sm capitalize">{selectedReview.platform}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <span className={`text-xl ${getRatingColor(selectedReview.rating)}`}>
                      {getStarRating(selectedReview.rating)}
                    </span>
                    <span className="text-slate-300">({selectedReview.rating}/5)</span>
                  </div>
                  
                  <p className="text-slate-300 text-sm mb-3">{selectedReview.review_text}</p>
                  
                  <div className="text-slate-500 text-xs">
                    Posted: {formatDate(selectedReview.review_date)}
                  </div>
                </div>

                {canRespondReviews && (
                  <>
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
                        className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none resize-none"
                        rows={4}
                      />
                      
                      <div className="flex items-center justify-between mt-4">
                        <button
                          onClick={() => setManualResponse(selectedReview.ai_response || '')}
                          disabled={!selectedReview.ai_response}
                          className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded font-medium transition-colors disabled:opacity-50"
                        >
                          📋 Use AI Response
                        </button>
                        
                        <button
                          onClick={submitManualResponse}
                          disabled={!manualResponse.trim()}
                          className={`px-4 py-2 rounded font-medium transition-colors ${
                            !manualResponse.trim()
                              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          📤 Submit Response
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}