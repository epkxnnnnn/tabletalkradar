'use client'

import React, { useState, useEffect } from 'react'
import { useClient } from './ClientProvider'
import { supabase } from '@/lib/supabase'

interface SocialMediaPost {
  id: string
  content: string
  platforms: string[]
  scheduled_date: string
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled'
  post_type: string
  category?: string
  hashtags: string[]
  created_at: string
}

interface ClientSocialCalendarProps {
  widget: any
  clientId?: string
  config: {
    view?: 'month' | 'week'
    show_platforms?: string[]
    limit?: number
  }
}

export default function ClientSocialCalendar({ widget, clientId, config }: ClientSocialCalendarProps) {
  const { currentClient, trackFeatureUsage } = useClient()
  const [posts, setPosts] = useState<SocialMediaPost[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<'month' | 'week'>(config.view || 'month')
  const [loading, setLoading] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)

  const targetClientId = clientId || currentClient?.id

  useEffect(() => {
    if (targetClientId) {
      loadPosts()
    }
  }, [targetClientId, currentDate, calendarView])

  const loadPosts = async () => {
    if (!targetClientId) return

    setLoading(true)
    try {
      // Calculate date range based on view
      const startDate = new Date(currentDate)
      const endDate = new Date(currentDate)
      
      if (calendarView === 'month') {
        startDate.setDate(1)
        endDate.setMonth(endDate.getMonth() + 1)
        endDate.setDate(0)
      } else {
        const dayOfWeek = startDate.getDay()
        startDate.setDate(startDate.getDate() - dayOfWeek)
        endDate.setDate(endDate.getDate() + (6 - dayOfWeek))
      }

      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .eq('client_id', targetClientId)
        .gte('scheduled_date', startDate.toISOString())
        .lte('scheduled_date', endDate.toISOString())
        .order('scheduled_date', { ascending: true })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCalendarDays = () => {
    const days = []
    const startDate = new Date(currentDate)
    const endDate = new Date(currentDate)
    
    if (calendarView === 'month') {
      startDate.setDate(1)
      endDate.setMonth(endDate.getMonth() + 1)
      endDate.setDate(0)
      
      // Start from beginning of week
      const firstDayOfWeek = startDate.getDay()
      startDate.setDate(startDate.getDate() - firstDayOfWeek)
      
      // End at end of week
      const lastDayOfWeek = endDate.getDay()
      endDate.setDate(endDate.getDate() + (6 - lastDayOfWeek))
    } else {
      const dayOfWeek = startDate.getDay()
      startDate.setDate(startDate.getDate() - dayOfWeek)
      endDate.setDate(endDate.getDate() + (6 - dayOfWeek))
    }

    const current = new Date(startDate)
    while (current <= endDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  const getPostsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return posts.filter(post => 
      post.scheduled_date.split('T')[0] === dateStr
    )
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500'
      case 'scheduled': return 'bg-blue-500'
      case 'published': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'cancelled': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return '📘'
      case 'instagram': return '📸'
      case 'twitter': return '🐦'
      case 'linkedin': return '💼'
      case 'tiktok': return '🎵'
      default: return '📱'
    }
  }

  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    }
    setCurrentDate(newDate)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const handleCreatePost = () => {
    setShowCreatePost(true)
    trackFeatureUsage('create_social_post')
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {widget.widget_title || 'Social Media Calendar'}
        </h3>
        <button
          onClick={handleCreatePost}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          + New Post
        </button>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateCalendar('prev')}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            ←
          </button>
          <h4 className="text-white font-medium">
            {currentDate.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric',
              ...(calendarView === 'week' ? { day: 'numeric' } : {})
            })}
          </h4>
          <button
            onClick={() => navigateCalendar('next')}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            →
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCalendarView('month')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              calendarView === 'month' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setCalendarView('week')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              calendarView === 'week' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-8">
          <div className="animate-spin w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full mx-auto mb-2"></div>
          Loading posts...
        </div>
      ) : (
        <>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-slate-400 font-medium text-xs">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((date, index) => {
              const dayPosts = getPostsForDate(date)
              const isCurrentMonthDay = isCurrentMonth(date)
              const isTodayDate = isToday(date)

              return (
                <div
                  key={index}
                  className={`min-h-[80px] p-1 border border-slate-700 rounded text-xs ${
                    isCurrentMonthDay ? 'bg-slate-750' : 'bg-slate-800'
                  } ${isTodayDate ? 'ring-1 ring-blue-500' : ''}`}
                >
                  <div className={`font-medium mb-1 ${
                    isCurrentMonthDay ? 'text-white' : 'text-slate-500'
                  } ${isTodayDate ? 'text-blue-400' : ''}`}>
                    {date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {dayPosts.slice(0, 2).map(post => (
                      <div
                        key={post.id}
                        className={`p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(post.status)} text-white`}
                      >
                        <div className="flex items-center space-x-1 mb-1">
                          {post.platforms.slice(0, 2).map(platform => (
                            <span key={platform} className="text-xs">
                              {getPlatformIcon(platform)}
                            </span>
                          ))}
                        </div>
                        <div className="truncate">{post.content.substring(0, 20)}...</div>
                        <div className="text-xs opacity-80">{formatTime(post.scheduled_date)}</div>
                      </div>
                    ))}
                    {dayPosts.length > 2 && (
                      <div className="text-xs text-slate-400">
                        +{dayPosts.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Simple Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Create Post</h3>
              <button
                onClick={() => setShowCreatePost(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center text-slate-400 py-8">
              <div className="text-4xl mb-4">📝</div>
              <p className="mb-4">Post creation interface will be available here</p>
              <button
                onClick={() => setShowCreatePost(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}