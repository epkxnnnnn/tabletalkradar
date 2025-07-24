'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../providers/AuthProvider'

interface Review {
  id: string
  business_name: string
  customer_name: string
  rating: number
  review_text: string
  platform: string
  status: 'pending' | 'responded' | 'ignored'
  created_at: string
  response_text?: string
}

export default function ReviewsManager() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'responded'>('all')
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [responseText, setResponseText] = useState('')

  useEffect(() => {
    loadReviews()
  }, [filter])

  const loadReviews = async () => {
    try {
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query
      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          status: 'responded',
          response_text: responseText
        })
        .eq('id', reviewId)

      if (error) throw error
      
      await loadReviews()
      setSelectedReview(null)
      setResponseText('')
    } catch (error) {
      console.error('Error responding to review:', error)
    }
  }

  const getRatingStars = (rating: number) => {
    return '⭐'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating))
  }

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'google': return 'bg-blue-600'
      case 'yelp': return 'bg-red-600'
      case 'facebook': return 'bg-blue-700'
      default: return 'bg-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading reviews...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Reviews</h1>
        <div className="flex space-x-2">
          {['all', 'pending', 'responded'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                filter === status
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reviews.map((review) => (
          <div key={review.id} className="bg-slate-800 p-6 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{review.business_name}</h3>
                <p className="text-gray-300">{review.customer_name}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(review.platform)} text-white`}>
                  {review.platform}
                </span>
                <span className="text-yellow-400">{getRatingStars(review.rating)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  review.status === 'pending' ? 'bg-yellow-600' :
                  review.status === 'responded' ? 'bg-green-600' : 'bg-gray-600'
                } text-white`}>
                  {review.status}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-300 text-sm leading-relaxed">{review.review_text}</p>
            </div>

            {review.response_text && (
              <div className="bg-slate-700 p-4 rounded-lg mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Your Response:</h4>
                <p className="text-gray-300 text-sm">{review.response_text}</p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
              {review.status === 'pending' && (
                <button
                  onClick={() => setSelectedReview(review)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Respond
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {reviews.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="text-xl font-medium text-white mb-2">No reviews yet</h3>
          <p className="text-gray-400">Reviews will appear here as they come in</p>
        </div>
      )}

      {/* Response Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-2xl w-full mx-4">
            <h2 className="text-xl font-semibold text-white mb-4">Respond to Review</h2>
            
            <div className="mb-4 p-4 bg-slate-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white">{selectedReview.customer_name}</span>
                <span className="text-yellow-400">{getRatingStars(selectedReview.rating)}</span>
              </div>
              <p className="text-gray-300 text-sm">{selectedReview.review_text}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Response
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none h-32 resize-none"
                placeholder="Write a professional response..."
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleRespond(selectedReview.id)}
                disabled={!responseText.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Send Response
              </button>
              <button
                onClick={() => {
                  setSelectedReview(null)
                  setResponseText('')
                }}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}