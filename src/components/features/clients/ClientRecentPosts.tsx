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

interface ClientRecentPostsProps {
  widget: any
  clientId?: string
  config: {
    limit?: number
    show_status?: boolean
    show_platforms?: boolean
    show_actions?: boolean
  }
}

export default function ClientRecentPosts({ widget, clientId, config }: ClientRecentPostsProps) {
  const { currentClient, canCreatePosts, trackFeatureUsage } = useClient()
  const [posts, setPosts] = useState<SocialMediaPost[]>([])
  const [loading, setLoading] = useState(true)

  const targetClientId = clientId || currentClient?.id
  const limit = config.limit || 3

  useEffect(() => {
    if (targetClientId) {
      loadPosts()
      trackFeatureUsage('view_recent_posts')
    }
  }, [targetClientId])

  const loadPosts = async () => {
    if (!targetClientId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .eq('client_id', targetClientId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const handleCreatePost = () => {
    trackFeatureUsage('create_post_from_widget')
    // This would open a post creation modal or navigate to the social tab
    alert('Post creation interface will be available here')
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {widget.widget_title || 'Recent Posts'}
        </h3>
        {canCreatePosts && (
          <button
            onClick={handleCreatePost}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            + New
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-8">
          <div className="animate-spin w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full mx-auto mb-2"></div>
          Loading posts...
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  {config.show_platforms !== false && (
                    <div className="flex items-center space-x-1 mb-2">
                      {post.platforms.slice(0, 4).map(platform => (
                        <span key={platform} className="text-sm">
                          {getPlatformIcon(platform)}
                        </span>
                      ))}
                      {post.platforms.length > 4 && (
                        <span className="text-slate-400 text-xs">+{post.platforms.length - 4}</span>
                      )}
                    </div>
                  )}
                  
                  <p className="text-white text-sm line-clamp-2 mb-2">
                    {post.content}
                  </p>
                  
                  <div className="text-slate-400 text-xs">
                    {post.status === 'scheduled' ? 'Scheduled for' : 'Created'}: {formatDate(post.status === 'scheduled' ? post.scheduled_date : post.created_at)}
                  </div>
                </div>

                {config.show_status !== false && (
                  <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(post.status)}`}>
                    {post.status}
                  </span>
                )}
              </div>

              {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {post.hashtags.slice(0, 3).map((hashtag, index) => (
                    <span key={index} className="bg-blue-600 text-white px-1 py-0.5 rounded text-xs">
                      {hashtag}
                    </span>
                  ))}
                  {post.hashtags.length > 3 && (
                    <span className="text-slate-400 text-xs">+{post.hashtags.length - 3}</span>
                  )}
                </div>
              )}

              {config.show_actions !== false && canCreatePosts && (
                <div className="mt-3 flex space-x-2">
                  <button className="bg-slate-600 hover:bg-slate-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors">
                    Edit
                  </button>
                  {post.status === 'draft' && (
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors">
                      Schedule
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-400 py-8">
          <div className="text-4xl mb-2">📱</div>
          <p>No posts yet</p>
          <p className="text-sm">Create your first social media post to get started</p>
          {canCreatePosts && (
            <button
              onClick={handleCreatePost}
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              Create First Post
            </button>
          )}
        </div>
      )}

      {posts.length >= limit && (
        <div className="mt-4 text-center">
          <button
            onClick={() => trackFeatureUsage('view_all_posts')}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            View All Posts →
          </button>
        </div>
      )}
    </div>
  )
}