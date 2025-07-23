'use client'

import React, { useState, useEffect } from 'react'
import { useClient } from './ClientProvider'
import { supabase } from '@/lib/supabase'

interface ClientOverviewStatsProps {
  widget: any
  clientId?: string
  config: {
    show_reviews?: boolean
    show_social?: boolean
    show_analytics?: boolean
  }
}

interface Stats {
  totalPosts: number
  scheduledPosts: number
  publishedPosts: number
  totalReviews: number
  averageRating: number
  pendingResponses: number
  responseRate: number
  thisMonthPosts: number
}

export default function ClientOverviewStats({ widget, clientId, config }: ClientOverviewStatsProps) {
  const { currentClient, trackFeatureUsage } = useClient()
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
    totalReviews: 0,
    averageRating: 0,
    pendingResponses: 0,
    responseRate: 0,
    thisMonthPosts: 0
  })
  const [loading, setLoading] = useState(true)

  const targetClientId = clientId || currentClient?.id

  useEffect(() => {
    if (targetClientId) {
      loadStats()
      trackFeatureUsage('view_overview_stats')
    }
  }, [targetClientId])

  const loadStats = async () => {
    if (!targetClientId) return

    setLoading(true)
    try {
      // Load social media stats
      const { data: posts, error: postsError } = await supabase
        .from('social_media_posts')
        .select('status, scheduled_date, created_at')
        .eq('client_id', targetClientId)

      if (postsError) throw postsError

      // Load review stats
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating, response_status')
        .eq('client_id', targetClientId)

      if (reviewsError) throw reviewsError

      // Calculate stats
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      const totalPosts = posts?.length || 0
      const scheduledPosts = posts?.filter(p => p.status === 'scheduled').length || 0
      const publishedPosts = posts?.filter(p => p.status === 'published').length || 0
      const thisMonthPosts = posts?.filter(p => {
        const postDate = new Date(p.created_at)
        return postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear
      }).length || 0

      const totalReviews = reviews?.length || 0
      const averageRating = totalReviews > 0 
        ? Math.round((reviews?.reduce((sum, r) => sum + r.rating, 0) || 0) / totalReviews * 10) / 10
        : 0
      const pendingResponses = reviews?.filter(r => r.response_status === 'pending').length || 0
      const respondedReviews = reviews?.filter(r => r.response_status === 'responded').length || 0
      const responseRate = totalReviews > 0 ? Math.round((respondedReviews / totalReviews) * 100) : 0

      setStats({
        totalPosts,
        scheduledPosts,
        publishedPosts,
        totalReviews,
        averageRating,
        pendingResponses,
        responseRate,
        thisMonthPosts
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {widget.widget_title || 'Business Overview'}
        </h3>
        <div className="text-center text-slate-400 py-8">
          <div className="animate-spin w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full mx-auto mb-2"></div>
          Loading stats...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        {widget.widget_title || 'Business Overview'}
      </h3>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Social Media Stats */}
        {config.show_social !== false && (
          <>
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.totalPosts}</div>
              <div className="text-slate-400 text-sm">Total Posts</div>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.scheduledPosts}</div>
              <div className="text-slate-400 text-sm">Scheduled</div>
            </div>
          </>
        )}

        {/* Review Stats */}
        {config.show_reviews !== false && (
          <>
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.averageRating}</div>
              <div className="text-slate-400 text-sm">Avg Rating</div>
              <div className="text-xs text-slate-500">({stats.totalReviews} reviews)</div>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${
                stats.responseRate >= 80 ? 'text-green-400' : 
                stats.responseRate >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {stats.responseRate}%
              </div>
              <div className="text-slate-400 text-sm">Response Rate</div>
            </div>
          </>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-sm">This Month</div>
              <div className="text-xl font-bold text-white">{stats.thisMonthPosts}</div>
              <div className="text-slate-500 text-xs">posts created</div>
            </div>
            <div className="text-2xl">📅</div>
          </div>
        </div>

        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-sm">Pending</div>
              <div className="text-xl font-bold text-orange-400">{stats.pendingResponses}</div>
              <div className="text-slate-500 text-xs">review responses</div>
            </div>
            <div className="text-2xl">💬</div>
          </div>
        </div>

        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-sm">Published</div>
              <div className="text-xl font-bold text-green-400">{stats.publishedPosts}</div>
              <div className="text-slate-500 text-xs">posts live</div>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-slate-400 text-sm">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
        <button
          onClick={loadStats}
          className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  )
}