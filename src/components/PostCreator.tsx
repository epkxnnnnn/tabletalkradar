'use client'

import React, { useState, useEffect } from 'react'
import { useAgency } from './AgencyProvider'
import { supabase } from '@/lib/supabase'

interface PostCreatorProps {
  onClose: () => void
  onPostCreated: () => void
  editPost?: any // Post to edit, if any
}

interface Client {
  id: string
  business_name: string
  industry: string
  location: string
}

interface SocialMediaTemplate {
  id: string
  name: string
  description: string
  content_template: string
  default_hashtags: string[]
  default_platforms: string[]
  category: string
}

export default function PostCreator({ onClose, onPostCreated, editPost }: PostCreatorProps) {
  const { currentAgency } = useAgency()
  const [clients, setClients] = useState<Client[]>([])
  const [templates, setTemplates] = useState<SocialMediaTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('compose')

  // Form state
  const [selectedClient, setSelectedClient] = useState('')
  const [content, setContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'carousel' | 'story'>('text')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [hashtagInput, setHashtagInput] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [publishImmediately, setPublishImmediately] = useState(false)
  const [autoHashtags, setAutoHashtags] = useState(false)

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: '📘', color: 'bg-blue-600' },
    { id: 'instagram', name: 'Instagram', icon: '📸', color: 'bg-pink-600' },
    { id: 'twitter', name: 'Twitter', icon: '🐦', color: 'bg-sky-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-black' }
  ]

  const categories = [
    'promotional', 'educational', 'entertainment', 'behind_scenes', 
    'customer_spotlight', 'event', 'announcement', 'seasonal', 'trending'
  ]

  useEffect(() => {
    if (currentAgency) {
      loadClients()
      loadTemplates()
    }
  }, [currentAgency])

  useEffect(() => {
    if (editPost) {
      populateEditForm()
    } else {
      setDefaultDateTime()
    }
  }, [editPost])

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

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_templates')
        .select('*')
        .eq('agency_id', currentAgency?.id)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const setDefaultDateTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1) // Default to 1 hour from now
    
    const date = now.toISOString().split('T')[0]
    const time = now.toTimeString().slice(0, 5)
    
    setScheduledDate(date)
    setScheduledTime(time)
  }

  const populateEditForm = () => {
    if (!editPost) return

    setSelectedClient(editPost.client_id)
    setContent(editPost.content)
    setSelectedPlatforms(editPost.platforms || [])
    setPostType(editPost.post_type || 'text')
    setCategory(editPost.category || '')
    setPriority(editPost.priority || 'medium')
    setHashtags(editPost.hashtags || [])
    setImageUrl(editPost.image_url || '')
    setVideoUrl(editPost.video_url || '')
    setLinkUrl(editPost.link_url || '')
    setCampaignName(editPost.campaign_name || '')

    if (editPost.scheduled_date) {
      const date = new Date(editPost.scheduled_date)
      setScheduledDate(date.toISOString().split('T')[0])
      setScheduledTime(date.toTimeString().slice(0, 5))
    }
  }

  const applyTemplate = (template: SocialMediaTemplate) => {
    setContent(template.content_template)
    setHashtags(template.default_hashtags || [])
    setSelectedPlatforms(template.default_platforms || [])
    setCategory(template.category || '')
    setActiveTab('compose')
  }

  const addHashtag = () => {
    if (hashtagInput.trim() && !hashtags.includes(hashtagInput.trim())) {
      const newHashtag = hashtagInput.trim().startsWith('#') 
        ? hashtagInput.trim() 
        : `#${hashtagInput.trim()}`
      setHashtags([...hashtags, newHashtag])
      setHashtagInput('')
    }
  }

  const removeHashtag = (index: number) => {
    setHashtags(hashtags.filter((_, i) => i !== index))
  }

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    )
  }

  const generateAIContent = async () => {
    if (!selectedClient) {
      alert('Please select a client first')
      return
    }

    setLoading(true)
    try {
      const client = clients.find(c => c.id === selectedClient)
      
      const response = await fetch('/api/social/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient,
          business_name: client?.business_name,
          industry: client?.industry,
          platforms: selectedPlatforms,
          post_type: postType,
          category: category || 'promotional',
          tone: 'professional'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setContent(result.content)
        if (result.hashtags) {
          setHashtags(result.hashtags)
        }
      } else {
        throw new Error(result.error || 'Failed to generate content')
      }
    } catch (error) {
      console.error('Error generating AI content:', error)
      alert('Failed to generate AI content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (status: 'draft' | 'scheduled') => {
    if (!selectedClient || !content.trim()) {
      alert('Please fill in required fields (client and content)')
      return
    }

    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform')
      return
    }

    if (status === 'scheduled' && (!scheduledDate || !scheduledTime)) {
      alert('Please set a scheduled date and time')
      return
    }

    setLoading(true)
    try {
      const scheduledDateTime = status === 'scheduled' 
        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        : new Date().toISOString()

      const postData = {
        agency_id: currentAgency?.id,
        client_id: selectedClient,
        content: content.trim(),
        image_url: imageUrl || null,
        video_url: videoUrl || null,
        link_url: linkUrl || null,
        hashtags,
        platforms: selectedPlatforms,
        scheduled_date: scheduledDateTime,
        publish_immediately: publishImmediately,
        status,
        post_type: postType,
        campaign_name: campaignName || null,
        category: category || null,
        priority,
        ai_generated: false, // Track if content was AI generated
        auto_hashtags: autoHashtags
      }

      let result
      if (editPost) {
        const { error } = await supabase
          .from('social_media_posts')
          .update(postData)
          .eq('id', editPost.id)
        
        if (error) throw error
        result = { success: true }
      } else {
        const { error } = await supabase
          .from('social_media_posts')
          .insert(postData)
        
        if (error) throw error
        result = { success: true }
      }

      if (result.success) {
        alert(`Post ${editPost ? 'updated' : 'created'} successfully!`)
        onPostCreated()
        onClose()
      }
    } catch (error) {
      console.error('Error saving post:', error)
      alert('Failed to save post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getCharacterCount = () => {
    const maxLength = selectedPlatforms.includes('twitter') ? 280 : 2200
    return { current: content.length, max: maxLength }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              {editPost ? 'Edit Post' : 'Create New Post'}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mb-6 border-b border-slate-700">
            <button
              onClick={() => setActiveTab('compose')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'compose'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              📝 Compose
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'templates'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              📋 Templates
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'schedule'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              📅 Schedule
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'compose' && (
            <div className="space-y-6">
              {/* Client Selection */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Client <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.business_name} - {client.industry}
                    </option>
                  ))}
                </select>
              </div>

              {/* Platform Selection */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Platforms <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {platforms.map(platform => (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedPlatforms.includes(platform.id)
                          ? `${platform.color} border-white text-white`
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-xl mb-1">{platform.icon}</div>
                      <div className="text-xs font-medium">{platform.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-300 text-sm font-medium">
                    Content <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs ${
                      getCharacterCount().current > getCharacterCount().max 
                        ? 'text-red-400' 
                        : 'text-slate-400'
                    }`}>
                      {getCharacterCount().current}/{getCharacterCount().max}
                    </span>
                    <button
                      onClick={generateAIContent}
                      disabled={loading || !selectedClient}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                    >
                      {loading ? 'Generating...' : '🤖 AI Generate'}
                    </button>
                  </div>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post content here..."
                  className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none resize-none"
                  rows={6}
                  required
                />
              </div>

              {/* Media URLs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Image URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Video URL</label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://example.com/video.mp4"
                    className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Link URL</label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Hashtags</label>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                    placeholder="Add hashtag"
                    className="flex-1 bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={addHashtag}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((hashtag, index) => (
                    <span
                      key={index}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-sm flex items-center space-x-1"
                    >
                      <span>{hashtag}</span>
                      <button
                        onClick={() => removeHashtag(index)}
                        className="text-blue-200 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Post Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Post Type</label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value as any)}
                    className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="carousel">Carousel</option>
                    <option value="story">Story</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Campaign Name */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Campaign Name (Optional)</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g., Summer Menu Launch, Black Friday Sale"
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="text-slate-300 text-sm">
                Choose a template to get started quickly:
              </div>
              {templates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className="bg-slate-700 p-4 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors"
                      onClick={() => applyTemplate(template)}
                    >
                      <h4 className="text-white font-medium mb-2">{template.name}</h4>
                      <p className="text-slate-400 text-sm mb-3">{template.description}</p>
                      <div className="text-slate-300 text-sm mb-2">
                        &quot;{template.content_template.substring(0, 100)}...&quot;
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="bg-slate-600 text-slate-300 px-2 py-1 rounded text-xs">
                          {template.category}
                        </span>
                        <button className="text-blue-400 text-sm hover:text-blue-300">
                          Use Template
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-8">
                  <div className="text-4xl mb-2">📋</div>
                  <p>No templates available</p>
                  <p className="text-sm">Templates will appear here once created</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Scheduled Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Scheduled Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={publishImmediately}
                    onChange={(e) => setPublishImmediately(e.target.checked)}
                    className="rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-300 text-sm">Publish immediately when scheduled time arrives</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoHashtags}
                    onChange={(e) => setAutoHashtags(e.target.checked)}
                    className="rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-300 text-sm">Auto-generate trending hashtags at publish time</span>
                </label>
              </div>

              <div className="bg-slate-700 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">📊 Best Times to Post</h4>
                <div className="text-slate-300 text-sm space-y-1">
                  <div><strong>Facebook:</strong> Weekdays 9AM-3PM</div>
                  <div><strong>Instagram:</strong> Weekdays 11AM-1PM, Wed-Fri</div>
                  <div><strong>Twitter:</strong> Weekdays 8AM-9AM, 7PM-9PM</div>
                  <div><strong>LinkedIn:</strong> Tue-Thu 10AM-12PM</div>
                  <div><strong>TikTok:</strong> Tue-Thu 6AM-10AM, 7PM-9PM</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-700">
            <button
              onClick={onClose}
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded font-medium transition-colors"
            >
              Cancel
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-slate-600 text-white px-6 py-2 rounded font-medium transition-colors"
              >
                {loading ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={() => handleSubmit('scheduled')}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-6 py-2 rounded font-medium transition-colors"
              >
                {loading ? 'Scheduling...' : 'Schedule Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}