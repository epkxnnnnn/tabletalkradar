'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Location {
  id: string
  business_name: string
  address: string
  city: string
  state: string
  google_place_id?: string
  google_account_id?: string
  clients?: {
    id: string
    business_name: string
    google_refresh_token?: string
    google_client_id?: string
    google_business_verified?: boolean
  }[]
}

interface Review {
  id: string
  reviewer_name: string
  rating: number
  review_text: string
  review_date: string
  response_status: string
  response_text?: string
  response_date?: string
  sentiment: string
}

interface Question {
  name: string
  text: string
  author: any
  totalAnswerCount: number
  answers: any[]
}

export default function GoogleBusinessManager() {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [activeTab, setActiveTab] = useState('posts')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Posts state
  const [postData, setPostData] = useState({
    type: 'CALL_TO_ACTION',
    summary: '',
    callToAction: {
      actionType: 'LEARN_MORE',
      url: ''
    },
    event: {
      title: '',
      schedule: {
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: ''
      }
    },
    offer: {
      title: '',
      couponCode: '',
      redeemOnlineUrl: '',
      termsConditions: ''
    }
  })

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([])
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState('')

  // Q&A state
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [answerText, setAnswerText] = useState('')

  const handleGoogleConnect = (clientId: string) => {
    // Redirect to Google OAuth with client ID
    window.location.href = `/api/google-business/auth?client_id=${clientId}`
  }

  const isGoogleConnected = (location: any) => {
    return location.clients?.[0]?.google_refresh_token && location.clients?.[0]?.google_business_verified
  }

  useEffect(() => {
    loadLocations()
  }, [])

  useEffect(() => {
    if (selectedLocation) {
      if (activeTab === 'reviews') {
        loadReviews()
      } else if (activeTab === 'qna') {
        loadQuestions()
      }
    }
  }, [selectedLocation, activeTab])

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
          google_place_id, 
          google_account_id,
          clients!inner(
            id,
            business_name,
            google_refresh_token,
            google_client_id,
            google_business_verified
          )
        `)
        .eq('is_active', true)
        .order('business_name')

      if (error) throw error
      setLocations(data || [])
    } catch (error) {
      console.error('Error loading locations:', error)
    }
  }

  const loadReviews = async () => {
    if (!selectedLocation) return

    try {
      const response = await fetch(`/api/google-business/review-replies?location_id=${selectedLocation.id}`)
      const data = await response.json()

      if (response.ok) {
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  const loadQuestions = async () => {
    if (!selectedLocation) return

    try {
      const response = await fetch(`/api/google-business/qna?location_id=${selectedLocation.id}`)
      const data = await response.json()

      if (response.ok) {
        setQuestions(data.questions || [])
      } else if (data.setup_required) {
        setMessage('⚠️ Google Business Profile API requires OAuth 2.0 setup')
      }
    } catch (error) {
      console.error('Error loading Q&A:', error)
    }
  }

  const createPost = async () => {
    if (!selectedLocation) return

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/google-business/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: selectedLocation.id,
          post_data: postData
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('✅ Post created successfully on Google My Business!')
        // Reset form
        setPostData({
          ...postData,
          summary: '',
          callToAction: { ...postData.callToAction, url: '' }
        })
      } else if (data.setup_required) {
        setMessage('⚠️ Google Business Profile API requires OAuth 2.0 setup. Check setup guide.')
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('❌ Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  const replyToReview = async () => {
    if (!selectedReview || !replyText.trim()) return

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/google-business/review-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: selectedReview.id,
          reply_text: replyText
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('✅ Reply posted successfully to Google!')
        setReplyText('')
        setSelectedReview(null)
        loadReviews() // Refresh reviews
      } else if (data.setup_required) {
        setMessage('⚠️ Google Business Profile API requires OAuth 2.0 setup. Check setup guide.')
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('❌ Failed to post reply')
    } finally {
      setLoading(false)
    }
  }

  const answerQuestion = async () => {
    if (!selectedQuestion || !answerText.trim()) return

    setLoading(true)
    setMessage('')

    try {
      const questionId = selectedQuestion.name.split('/').pop()
      const response = await fetch('/api/google-business/qna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: selectedLocation?.id,
          question_id: questionId,
          answer_text: answerText
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('✅ Answer posted successfully to Google!')
        setAnswerText('')
        setSelectedQuestion(null)
        loadQuestions() // Refresh Q&A
      } else if (data.setup_required) {
        setMessage('⚠️ Google Business Profile API requires OAuth 2.0 setup. Check setup guide.')
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('❌ Failed to post answer')
    } finally {
      setLoading(false)
    }
  }

  const renderOAuthSetupNotice = () => (
    <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg mb-4">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">⚠️</div>
        <div>
          <h4 className="text-yellow-400 font-semibold">OAuth 2.0 Setup Required</h4>
          <p className="text-slate-300 text-sm mt-1">
            Google My Business features require OAuth 2.0 authentication beyond API key access.
            Check the <code className="bg-slate-700 px-1 rounded">GOOGLE_OAUTH_SETUP.md</code> file for setup instructions.
          </p>
          <div className="mt-2 text-xs text-slate-400">
            <p>Required: Google Business Profile API access with proper OAuth scopes</p>
            <p>Current: Using API key only (limited to Places API)</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Google My Business Manager</h3>
        <p className="text-slate-400 text-sm mb-4">
          Create posts, reply to reviews, and manage Q&A for your Google Business profiles.
        </p>

        {renderOAuthSetupNotice()}

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('✅') ? 'bg-green-900/20 border border-green-500 text-green-400' :
            message.includes('⚠️') ? 'bg-yellow-900/20 border border-yellow-500 text-yellow-400' :
            'bg-red-900/20 border border-red-500 text-red-400'
          }`}>
            {message}
          </div>
        )}

        {/* Location Selector */}
        <div className="mb-6">
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
                {isGoogleConnected(location) ? ' 🟢 Connected' : ' 🔴 Not Connected'}
              </option>
            ))}
          </select>
          
          {selectedLocation && !isGoogleConnected(selectedLocation) && (
            <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm mb-2">
                Google My Business not connected for this location
              </p>
              <button
                onClick={() => handleGoogleConnect(selectedLocation.clients?.[0]?.id || '')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
              >
                Connect Google Account
              </button>
            </div>
          )}
          
          {selectedLocation && isGoogleConnected(selectedLocation) && (
            <div className="mt-2 flex items-center text-green-400 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              Google My Business Connected
            </div>
          )}
        </div>

        {selectedLocation && (
          <>
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6">
              {[
                { id: 'posts', label: 'Create Posts' },
                { id: 'reviews', label: 'Reply to Reviews' },
                { id: 'qna', label: 'Manage Q&A' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Posts Tab */}            {activeTab === 'posts' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Post Type</label>
                  <select
                    value={postData.type}
                    onChange={(e) => setPostData({...postData, type: e.target.value as any})}
                    className="w-full bg-slate-700 text-white px-3 py-2 rounded"
                  >
                    <option value="CALL_TO_ACTION">Call to Action</option>
                    <option value="EVENT">Event</option>
                    <option value="OFFER">Offer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Summary</label>
                  <textarea
                    value={postData.summary}
                    onChange={(e) => setPostData({...postData, summary: e.target.value})}
                    className="w-full bg-slate-700 text-white px-3 py-2 rounded"
                    rows={3}
                    placeholder="Write your post summary..."
                  />
                </div>

                {postData.type === 'CALL_TO_ACTION' && (
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Action URL</label>
                    <input
                      type="url"
                      value={postData.callToAction.url}
                      onChange={(e) => setPostData({
                        ...postData,
                        callToAction: {...postData.callToAction, url: e.target.value}
                      })}
                      className="w-full bg-slate-700 text-white px-3 py-2 rounded"
                      placeholder="https://example.com"
                    />
                  </div>
                )}

                <button
                  onClick={createPost}
                  disabled={loading || !postData.summary}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded font-medium"
                >
                  {loading ? 'Creating...' : 'Create Post'}
                </button>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {reviews.length === 0 ? (
                    <p className="text-slate-400">No reviews found. Run Google Review Scraper first.</p>
                  ) : (
                    reviews.map(review => (
                      <div key={review.id} className="bg-slate-700 p-4 rounded">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-white font-medium">{review.reviewer_name}</p>
                            <div className="flex items-center space-x-2">
                              <div className="flex text-yellow-400">
                                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                              </div>
                              <span className="text-slate-400 text-xs">
                                {new Date(review.review_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            review.response_status === 'responded' 
                              ? 'bg-green-900 text-green-300' 
                              : 'bg-yellow-900 text-yellow-300'
                          }`}>
                            {review.response_status === 'responded' ? 'Replied' : 'Pending'}
                          </span>
                        </div>
                        
                        <p className="text-slate-300 text-sm mb-3">{review.review_text}</p>
                        
                        {review.response_status === 'responded' ? (
                          <div className="bg-slate-600 p-3 rounded text-sm">
                            <p className="text-slate-300 mb-1"><strong>Your Reply:</strong></p>
                            <p className="text-slate-300">{review.response_text}</p>
                            <p className="text-slate-400 text-xs mt-1">
                              Replied on {new Date(review.response_date!).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedReview(review)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Reply to Review
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Modal */}
                {selectedReview && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4">
                      <h4 className="text-white font-medium mb-4">Reply to {selectedReview.reviewer_name}</h4>
                      <div className="mb-4 p-3 bg-slate-700 rounded text-sm">
                        <div className="flex text-yellow-400 mb-1">
                          {'★'.repeat(selectedReview.rating)}{'☆'.repeat(5 - selectedReview.rating)}
                        </div>
                        <p className="text-slate-300">{selectedReview.review_text}</p>
                      </div>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full bg-slate-700 text-white px-3 py-2 rounded mb-4"
                        rows={4}
                        placeholder="Write your reply..."
                      />
                      <div className="flex space-x-3">
                        <button
                          onClick={replyToReview}
                          disabled={loading || !replyText.trim()}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded"
                        >
                          {loading ? 'Posting...' : 'Post Reply'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReview(null)
                            setReplyText('')
                          }}
                          className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Q&A Tab */}
            {activeTab === 'qna' && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {questions.length === 0 ? (
                    <p className="text-slate-400">No questions found for this location.</p>
                  ) : (
                    questions.map((question, index) => (
                      <div key={index} className="bg-slate-700 p-4 rounded">
                        <div className="mb-3">
                          <p className="text-white font-medium mb-1">Q: {question.text}</p>
                          <p className="text-slate-400 text-xs">
                            Asked by {question.author?.displayName || 'Anonymous'} • 
                            {question.totalAnswerCount} answers
                          </p>
                        </div>
                        
                        {question.answers && question.answers.length > 0 ? (
                          <div className="space-y-2 mb-3">
                            {question.answers.map((answer, aIndex) => (
                              <div key={aIndex} className="bg-slate-600 p-3 rounded text-sm">
                                <p className="text-slate-300">{answer.text}</p>
                                <p className="text-slate-400 text-xs mt-1">
                                  By {answer.author?.displayName || 'Business Owner'}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedQuestion(question)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Answer Question
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Answer Modal */}
                {selectedQuestion && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4">
                      <h4 className="text-white font-medium mb-4">Answer Question</h4>
                      <div className="mb-4 p-3 bg-slate-700 rounded text-sm">
                        <p className="text-slate-300">Q: {selectedQuestion.text}</p>
                        <p className="text-slate-400 text-xs mt-1">
                          By {selectedQuestion.author?.displayName || 'Anonymous'}
                        </p>
                      </div>
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        className="w-full bg-slate-700 text-white px-3 py-2 rounded mb-4"
                        rows={4}
                        placeholder="Write your answer..."
                      />
                      <div className="flex space-x-3">
                        <button
                          onClick={answerQuestion}
                          disabled={loading || !answerText.trim()}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-4 py-2 rounded"
                        >
                          {loading ? 'Posting...' : 'Post Answer'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedQuestion(null)
                            setAnswerText('')
                          }}
                          className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}