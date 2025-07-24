'use client'

import React, { useState, useEffect } from 'react'
import { useAgency } from '../../providers/AgencyProvider'
import { supabase } from '@/lib/supabase'
import PostCreator from './PostCreator'

interface SocialMediaPost {
  id: string
  client_id: string
  client_name: string
  content: string
  image_url?: string
  video_url?: string
  link_url?: string
  hashtags: string[]
  platforms: string[]
  scheduled_date: string
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled'
  post_type: 'text' | 'image' | 'video' | 'carousel' | 'story'
  campaign_name?: string
  category?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  ai_generated: boolean
  published_at?: string
  created_at: string
}

interface Client {
  id: string
  business_name: string
  industry: string
  location: string
}

export default function SocialMediaCalendar() {
  const { currentAgency } = useAgency()
  const [posts, setPosts] = useState<SocialMediaPost[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showPostCreator, setShowPostCreator] = useState(false)
  const [selectedPost, setSelectedPost] = useState<SocialMediaPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentAgency) {
      loadClients()
      loadPosts()
    }
  }, [currentAgency])

  useEffect(() => {
    loadPosts()
  }, [selectedClient, selectedPlatform, selectedStatus, currentDate])

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, business_name, industry, location')
        .eq('agency_id', currentAgency?.id)
        .eq('status', 'active')
        .order('business_name')

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const loadPosts = async () => {
    setLoading(true)
    try {
      // Calculate date range based on calendar view
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

      let query = supabase
        .from('social_media_posts')
        .select(`
          *,
          clients(business_name)
        `)
        .eq('agency_id', currentAgency?.id)
        .gte('scheduled_date', startDate.toISOString())
        .lte('scheduled_date', endDate.toISOString())
        .order('scheduled_date', { ascending: true })

      if (selectedClient !== 'all') {
        query = query.eq('client_id', selectedClient)
      }

      if (selectedPlatform !== 'all') {
        query = query.contains('platforms', [selectedPlatform])
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      const { data, error } = await query

      if (error) throw error
      
      const formattedPosts = (data || []).map(post => ({
        ...post,
        client_name: post.clients?.business_name || 'Unknown Client'
      }))
      
      setPosts(formattedPosts)
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
      
      // Start from the beginning of the week
      const firstDayOfWeek = startDate.getDay()
      startDate.setDate(startDate.getDate() - firstDayOfWeek)
      
      // End at the end of the week
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
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

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Social Media Calendar</h2>
            <p className="text-slate-400 text-sm mt-1">Schedule and manage social media posts for your clients</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPostCreator(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              📝 Create Post
            </button>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateCalendar('prev')}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              ← Prev
            </button>
            <h3 className="text-lg font-semibold text-white">
              {currentDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric',
                ...(calendarView === 'week' ? { day: 'numeric' } : {})
              })}
            </h3>
            <button
              onClick={() => navigateCalendar('next')}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              Next →
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCalendarView('month')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                calendarView === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setCalendarView('week')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                calendarView === 'week' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Week
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Client</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
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
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Platforms</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded font-medium transition-colors"
            >
              📅 Today
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-800 rounded-lg p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-slate-400 font-medium text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {generateCalendarDays().map((date, index) => {
            const dayPosts = getPostsForDate(date)
            const isCurrentMonthDay = isCurrentMonth(date)
            const isTodayDate = isToday(date)

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border border-slate-700 rounded ${
                  isCurrentMonthDay ? 'bg-slate-750' : 'bg-slate-800'
                } ${isTodayDate ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isCurrentMonthDay ? 'text-white' : 'text-slate-500'
                } ${isTodayDate ? 'text-blue-400' : ''}`}>
                  {date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map(post => (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className={`p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(post.status)} text-white`}
                    >
                      <div className="flex items-center space-x-1 mb-1">
                        {post.platforms.slice(0, 3).map(platform => (
                          <span key={platform} className="text-xs">
                            {getPlatformIcon(platform)}
                          </span>
                        ))}
                      </div>
                      <div className="truncate font-medium">{post.client_name}</div>
                      <div className="truncate">{post.content.substring(0, 30)}...</div>
                      {post.scheduled_date && (
                        <div className="text-xs opacity-80">{formatTime(post.scheduled_date)}</div>
                      )}
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <div className="text-xs text-slate-400 pl-1">
                      +{dayPosts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Post Details</h3>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-medium mb-2">{selectedPost.client_name}</h4>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(selectedPost.status)}`}>
                      {selectedPost.status}
                    </span>
                    <span className="text-slate-400 text-sm">
                      {formatDate(new Date(selectedPost.scheduled_date))} at {formatTime(selectedPost.scheduled_date)}
                    </span>
                  </div>
                </div>

                <div>
                  <h5 className="text-slate-300 font-medium mb-2">Platforms</h5>
                  <div className="flex space-x-2">
                    {selectedPost.platforms.map(platform => (
                      <span key={platform} className="flex items-center space-x-1 bg-slate-700 px-2 py-1 rounded text-sm text-white">
                        <span>{getPlatformIcon(platform)}</span>
                        <span className="capitalize">{platform}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-slate-300 font-medium mb-2">Content</h5>
                  <div className="bg-slate-700 p-3 rounded">
                    <p className="text-white text-sm">{selectedPost.content}</p>
                  </div>
                </div>

                {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                  <div>
                    <h5 className="text-slate-300 font-medium mb-2">Hashtags</h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedPost.hashtags.map((hashtag, index) => (
                        <span key={index} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                          {hashtag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={() => {
                      // Edit functionality
                      setSelectedPost(null)
                      setShowPostCreator(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
                  >
                    Edit Post
                  </button>
                  <button
                    onClick={() => {
                      // Delete functionality
                      if (confirm('Are you sure you want to delete this post?')) {
                        // Handle delete
                        setSelectedPost(null)
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Creator Modal */}
      {showPostCreator && (
        <PostCreator
          onClose={() => setShowPostCreator(false)}
          onPostCreated={() => {
            setShowPostCreator(false)
            loadPosts()
          }}
          editPost={selectedPost}
        />
      )}
    </div>
  )
}