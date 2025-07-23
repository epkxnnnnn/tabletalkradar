'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Location {
  id: string
  business_name: string
  location_name: string
  city: string
  state: string
  local_seo_score: number
  citation_score: number
  review_score: number
  visibility_score: number
  optimization_score: number
  google_rating: number
  google_review_count: number
  google_listing_completeness: number
  seo_data_last_updated?: string
  gbp_data_last_updated?: string
}

interface Keyword {
  id: string
  keyword: string
  current_rank?: number
  previous_rank?: number
}

export default function AdminLocationUpdater() {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Form states for updates
  const [seoScores, setSeoScores] = useState({
    citation_score: '',
    review_score: '',
    visibility_score: '',
    optimization_score: ''
  })

  const [gbpData, setGbpData] = useState({
    google_rating: '',
    google_review_count: '',
    google_photo_count: '',
    google_posts_count: '',
    google_questions_answered: '',
    google_listing_completeness: ''
  })

  const [keywordUpdates, setKeywordUpdates] = useState<{ [key: string]: string }>({})
  const [auditNotes, setAuditNotes] = useState({
    issues_found: '',
    recommendations: '',
    improvements_made: '',
    internal_notes: ''
  })

  useEffect(() => {
    loadLocations()
  }, [])

  useEffect(() => {
    if (selectedLocation) {
      // Load current values into forms
      setSeoScores({
        citation_score: selectedLocation.citation_score?.toString() || '',
        review_score: selectedLocation.review_score?.toString() || '',
        visibility_score: selectedLocation.visibility_score?.toString() || '',
        optimization_score: selectedLocation.optimization_score?.toString() || ''
      })

      setGbpData({
        google_rating: selectedLocation.google_rating?.toString() || '',
        google_review_count: selectedLocation.google_review_count?.toString() || '',
        google_photo_count: '',
        google_posts_count: '',
        google_questions_answered: '',
        google_listing_completeness: selectedLocation.google_listing_completeness?.toString() || ''
      })

      loadKeywords(selectedLocation.id)
    }
  }, [selectedLocation])

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('client_locations')
        .select(`
          *,
          clients(business_name)
        `)
        .eq('is_active', true)
        .order('business_name')

      if (error) throw error
      setLocations(data || [])
    } catch (error) {
      console.error('Error loading locations:', error)
    }
  }

  const loadKeywords = async (locationId: string) => {
    try {
      const { data, error } = await supabase
        .from('location_keywords')
        .select('*')
        .eq('location_id', locationId)
        .eq('is_tracking', true)
        .order('priority', { ascending: true })

      if (error) throw error
      setKeywords(data || [])
      
      // Initialize keyword updates object
      const updates: { [key: string]: string } = {}
      data?.forEach(keyword => {
        updates[keyword.id] = keyword.current_rank?.toString() || ''
      })
      setKeywordUpdates(updates)
    } catch (error) {
      console.error('Error loading keywords:', error)
    }
  }

  const updateSEOScores = async () => {
    if (!selectedLocation) return

    setLoading(true)
    setMessage('')

    try {
      const updates: any = {}
      
      // Only update fields that have values
      if (seoScores.citation_score) updates.citation_score = parseFloat(seoScores.citation_score)
      if (seoScores.review_score) updates.review_score = parseFloat(seoScores.review_score)
      if (seoScores.visibility_score) updates.visibility_score = parseFloat(seoScores.visibility_score)
      if (seoScores.optimization_score) updates.optimization_score = parseFloat(seoScores.optimization_score)

      // Calculate overall SEO score
      const scores = {
        citation_score: updates.citation_score || selectedLocation.citation_score,
        review_score: updates.review_score || selectedLocation.review_score,
        visibility_score: updates.visibility_score || selectedLocation.visibility_score,
        optimization_score: updates.optimization_score || selectedLocation.optimization_score
      }

      const weights = {
        citation_score: 0.25,
        review_score: 0.35,
        visibility_score: 0.25,
        optimization_score: 0.15
      }

      let totalScore = 0
      for (const [key, value] of Object.entries(scores)) {
        totalScore += value * weights[key as keyof typeof weights]
      }

      updates.local_seo_score = Math.round(totalScore * 100) / 100
      updates.seo_data_last_updated = new Date().toISOString()

      const { error } = await supabase
        .from('client_locations')
        .update(updates)
        .eq('id', selectedLocation.id)

      if (error) throw error

      setMessage('✅ SEO scores updated successfully!')
      loadLocations()
    } catch (error) {
      console.error('Error updating SEO scores:', error)
      setMessage('❌ Failed to update SEO scores')
    } finally {
      setLoading(false)
    }
  }

  const updateGoogleBusinessProfile = async () => {
    if (!selectedLocation) return

    setLoading(true)
    setMessage('')

    try {
      const updates: any = {}
      
      if (gbpData.google_rating) updates.google_rating = parseFloat(gbpData.google_rating)
      if (gbpData.google_review_count) updates.google_review_count = parseInt(gbpData.google_review_count)
      if (gbpData.google_photo_count) updates.google_photo_count = parseInt(gbpData.google_photo_count)
      if (gbpData.google_posts_count) updates.google_posts_count = parseInt(gbpData.google_posts_count)
      if (gbpData.google_questions_answered) updates.google_questions_answered = parseInt(gbpData.google_questions_answered)
      if (gbpData.google_listing_completeness) updates.google_listing_completeness = parseFloat(gbpData.google_listing_completeness)

      updates.gbp_data_last_updated = new Date().toISOString()

      const { error } = await supabase
        .from('client_locations')
        .update(updates)
        .eq('id', selectedLocation.id)

      if (error) throw error

      setMessage('✅ Google Business Profile data updated!')
      loadLocations()
    } catch (error) {
      console.error('Error updating GBP data:', error)
      setMessage('❌ Failed to update GBP data')
    } finally {
      setLoading(false)
    }
  }

  const updateKeywordRankings = async () => {
    if (!selectedLocation) return

    setLoading(true)
    setMessage('')

    try {
      let successCount = 0
      
      for (const keyword of keywords) {
        const newRank = keywordUpdates[keyword.id]
        if (newRank && newRank !== keyword.current_rank?.toString()) {
          const rankNum = parseInt(newRank)
          const rankChange = keyword.current_rank ? rankNum - keyword.current_rank : 0
          
          // Update rank history
          const rankHistory = keyword.rank_history || []
          rankHistory.push({
            date: new Date().toISOString(),
            rank: rankNum,
            change: rankChange
          })

          // Keep only last 12 weeks
          if (rankHistory.length > 12) {
            rankHistory.shift()
          }

          const { error } = await supabase
            .from('location_keywords')
            .update({
              previous_rank: keyword.current_rank,
              current_rank: rankNum,
              rank_change: rankChange,
              best_rank: Math.min(keyword.best_rank || 999, rankNum),
              worst_rank: Math.max(keyword.worst_rank || 0, rankNum),
              rank_history: rankHistory,
              last_checked_at: new Date().toISOString()
            })
            .eq('id', keyword.id)

          if (!error) successCount++
        }
      }

      setMessage(`✅ Updated ${successCount} keyword rankings!`)
      loadKeywords(selectedLocation.id)
    } catch (error) {
      console.error('Error updating keywords:', error)
      setMessage('❌ Failed to update keyword rankings')
    } finally {
      setLoading(false)
    }
  }

  const performWeeklyAudit = async () => {
    if (!selectedLocation) return

    setLoading(true)
    setMessage('')

    try {
      // First update all the data
      await updateSEOScores()
      await updateGoogleBusinessProfile()
      await updateKeywordRankings()

      // Calculate keyword statistics
      const keywordStats = keywords.filter(k => k.current_rank)
      const total_keywords_tracked = keywordStats.length
      const keywords_ranking_top_3 = keywordStats.filter(k => k.current_rank! <= 3).length
      const keywords_ranking_top_10 = keywordStats.filter(k => k.current_rank! <= 10).length
      const average_keyword_rank = keywordStats.length > 0
        ? keywordStats.reduce((sum, k) => sum + k.current_rank!, 0) / keywordStats.length
        : 0

      // Create audit record
      const { error } = await supabase
        .from('location_seo_audits')
        .insert({
          location_id: selectedLocation.id,
          client_id: selectedLocation.client_id,
          agency_id: selectedLocation.agency_id,
          audit_date: new Date().toISOString().split('T')[0],
          audit_type: 'weekly',
          local_seo_score: selectedLocation.local_seo_score,
          citation_score: selectedLocation.citation_score,
          review_score: selectedLocation.review_score,
          visibility_score: selectedLocation.visibility_score,
          optimization_score: selectedLocation.optimization_score,
          google_rating: selectedLocation.google_rating,
          google_review_count: selectedLocation.google_review_count,
          google_listing_completeness: selectedLocation.google_listing_completeness,
          total_keywords_tracked,
          keywords_ranking_top_3,
          keywords_ranking_top_10,
          average_keyword_rank: Math.round(average_keyword_rank * 10) / 10,
          issues_found: auditNotes.issues_found ? auditNotes.issues_found.split(',').map(s => s.trim()) : [],
          recommendations: auditNotes.recommendations ? auditNotes.recommendations.split(',').map(s => s.trim()) : [],
          improvements_made: auditNotes.improvements_made,
          internal_notes: auditNotes.internal_notes,
          data_sources: {
            manual_update: true,
            update_date: new Date().toISOString()
          }
        })

      if (error) throw error

      setMessage('✅ Weekly audit completed successfully!')
      
      // Clear audit notes
      setAuditNotes({
        issues_found: '',
        recommendations: '',
        improvements_made: '',
        internal_notes: ''
      })
    } catch (error) {
      console.error('Error performing audit:', error)
      setMessage('❌ Failed to complete weekly audit')
    } finally {
      setLoading(false)
    }
  }

  const getLastUpdateInfo = (location: Location) => {
    const seoUpdate = location.seo_data_last_updated 
      ? new Date(location.seo_data_last_updated).toLocaleDateString() 
      : 'Never'
    const gbpUpdate = location.gbp_data_last_updated 
      ? new Date(location.gbp_data_last_updated).toLocaleDateString() 
      : 'Never'
    
    return `SEO: ${seoUpdate} | GBP: ${gbpUpdate}`
  }

  return (
    <div className="space-y-6">
      {/* Location Selector */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Admin: Location Data Updater</h3>
        
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('✅') ? 'bg-green-900/20 border border-green-500 text-green-400' :
            'bg-red-900/20 border border-red-500 text-red-400'
          }`}>
            {message}
          </div>
        )}

        <div className="mb-4">
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
                {location.business_name} - {location.location_name} ({location.city}, {location.state})
              </option>
            ))}
          </select>
        </div>

        {selectedLocation && (
          <div className="text-slate-400 text-sm">
            <p>Current SEO Score: <span className="text-white font-bold">{selectedLocation.local_seo_score}%</span></p>
            <p>Last Updates: {getLastUpdateInfo(selectedLocation)}</p>
          </div>
        )}
      </div>

      {selectedLocation && (
        <>
          {/* SEO Scores Update */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4">SEO Scores (0-100)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Citation Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={seoScores.citation_score}
                  onChange={(e) => setSeoScores({...seoScores, citation_score: e.target.value})}
                  className="w-full bg-slate-700 text-white px-2 py-1 rounded text-sm"
                  placeholder={selectedLocation.citation_score?.toString()}
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Review Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={seoScores.review_score}
                  onChange={(e) => setSeoScores({...seoScores, review_score: e.target.value})}
                  className="w-full bg-slate-700 text-white px-2 py-1 rounded text-sm"
                  placeholder={selectedLocation.review_score?.toString()}
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Visibility Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={seoScores.visibility_score}
                  onChange={(e) => setSeoScores({...seoScores, visibility_score: e.target.value})}
                  className="w-full bg-slate-700 text-white px-2 py-1 rounded text-sm"
                  placeholder={selectedLocation.visibility_score?.toString()}
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Optimization Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={seoScores.optimization_score}
                  onChange={(e) => setSeoScores({...seoScores, optimization_score: e.target.value})}
                  className="w-full bg-slate-700 text-white px-2 py-1 rounded text-sm"
                  placeholder={selectedLocation.optimization_score?.toString()}
                />
              </div>
            </div>
            <button
              onClick={updateSEOScores}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Update SEO Scores
            </button>
          </div>

          {/* Google Business Profile Update */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4">Google Business Profile</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Rating (0-5)</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={gbpData.google_rating}
                  onChange={(e) => setGbpData({...gbpData, google_rating: e.target.value})}
                  className="w-full bg-slate-700 text-white px-2 py-1 rounded text-sm"
                  placeholder={selectedLocation.google_rating?.toString()}
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Review Count</label>
                <input
                  type="number"
                  min="0"
                  value={gbpData.google_review_count}
                  onChange={(e) => setGbpData({...gbpData, google_review_count: e.target.value})}
                  className="w-full bg-slate-700 text-white px-2 py-1 rounded text-sm"
                  placeholder={selectedLocation.google_review_count?.toString()}
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Listing Complete %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gbpData.google_listing_completeness}
                  onChange={(e) => setGbpData({...gbpData, google_listing_completeness: e.target.value})}
                  className="w-full bg-slate-700 text-white px-2 py-1 rounded text-sm"
                  placeholder={selectedLocation.google_listing_completeness?.toString()}
                />
              </div>
            </div>
            <button
              onClick={updateGoogleBusinessProfile}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Update GBP Data
            </button>
          </div>

          {/* Keyword Rankings Update */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4">Keyword Rankings</h4>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {keywords.map(keyword => (
                <div key={keyword.id} className="flex items-center space-x-2">
                  <span className="text-slate-300 text-sm flex-1">{keyword.keyword}</span>
                  <span className="text-slate-500 text-xs">Current: {keyword.current_rank || 'N/A'}</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={keywordUpdates[keyword.id] || ''}
                    onChange={(e) => setKeywordUpdates({...keywordUpdates, [keyword.id]: e.target.value})}
                    className="w-20 bg-slate-700 text-white px-2 py-1 rounded text-sm"
                    placeholder="New"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={updateKeywordRankings}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Update Keywords
            </button>
          </div>

          {/* Weekly Audit Notes */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4">Weekly Audit Notes</h4>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Issues Found (comma-separated)</label>
                <input
                  type="text"
                  value={auditNotes.issues_found}
                  onChange={(e) => setAuditNotes({...auditNotes, issues_found: e.target.value})}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded text-sm"
                  placeholder="Missing hours, Incomplete photos, Low review response rate"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Recommendations (comma-separated)</label>
                <input
                  type="text"
                  value={auditNotes.recommendations}
                  onChange={(e) => setAuditNotes({...auditNotes, recommendations: e.target.value})}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded text-sm"
                  placeholder="Add business hours, Upload more photos, Respond to reviews"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Improvements Made</label>
                <textarea
                  value={auditNotes.improvements_made}
                  onChange={(e) => setAuditNotes({...auditNotes, improvements_made: e.target.value})}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded text-sm"
                  rows={2}
                  placeholder="What improvements were made this week?"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Internal Notes (hidden from client)</label>
                <textarea
                  value={auditNotes.internal_notes}
                  onChange={(e) => setAuditNotes({...auditNotes, internal_notes: e.target.value})}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded text-sm"
                  rows={2}
                  placeholder="Private notes about this location..."
                />
              </div>
            </div>
            <button
              onClick={performWeeklyAudit}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white px-6 py-3 rounded font-medium transition-colors"
            >
              🚀 Perform Complete Weekly Audit
            </button>
          </div>
        </>
      )}
    </div>
  )
}