'use client'

import React, { useState, useEffect } from 'react'
import { useAgency } from './AgencyProvider'
import { supabase } from '@/lib/supabase'

interface Client {
  id: string
  business_name: string
  industry: string
  location: string
}

export default function ManualPostHelper() {
  const { currentAgency } = useAgency()
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [category, setCategory] = useState('promotional')
  const [tone, setTone] = useState('professional')
  const [customPrompt, setCustomPrompt] = useState('')
  const [generatedCaption, setGeneratedCaption] = useState('')
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [copySuccess, setCopySuccess] = useState('')

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: '📘', color: 'bg-blue-600' },
    { id: 'instagram', name: 'Instagram', icon: '📸', color: 'bg-pink-600' },
    { id: 'twitter', name: 'Twitter', icon: '🐦', color: 'bg-sky-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-black' }
  ]

  const categories = [
    { id: 'promotional', name: 'Promotional', desc: 'Sales, offers, special deals' },
    { id: 'educational', name: 'Educational', desc: 'Tips, insights, how-tos' },
    { id: 'entertainment', name: 'Entertainment', desc: 'Fun, engaging content' },
    { id: 'behind_scenes', name: 'Behind the Scenes', desc: 'Process, team, culture' },
    { id: 'customer_spotlight', name: 'Customer Spotlight', desc: 'Reviews, testimonials' },
    { id: 'announcement', name: 'Announcement', desc: 'News, updates, events' }
  ]

  const tones = [
    { id: 'professional', name: 'Professional', desc: 'Formal, business-focused' },
    { id: 'friendly', name: 'Friendly', desc: 'Warm, approachable' },
    { id: 'casual', name: 'Casual', desc: 'Relaxed, conversational' },
    { id: 'enthusiastic', name: 'Enthusiastic', desc: 'Energetic, exciting' },
    { id: 'educational', name: 'Educational', desc: 'Informative, helpful' }
  ]

  useEffect(() => {
    if (currentAgency) {
      loadClients()
    }
  }, [currentAgency])

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

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    )
  }

  const generateContent = async () => {
    if (!selectedClient) {
      alert('Please select a client first')
      return
    }

    const client = clients.find(c => c.id === selectedClient)
    if (!client) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/social/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient,
          business_name: client.business_name,
          industry: client.industry,
          platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['facebook', 'instagram'],
          post_type: 'text',
          category,
          tone,
          custom_prompt: customPrompt || undefined,
          content_length: 'medium'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setGeneratedCaption(result.content)
        setGeneratedHashtags(result.hashtags || [])
      } else {
        throw new Error(result.error || 'Failed to generate content')
      }
    } catch (error) {
      console.error('Error generating content:', error)
      alert('Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(`${type} copied!`)
      setTimeout(() => setCopySuccess(''), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const copyFullPost = async () => {
    const fullPost = `${generatedCaption}\n\n${generatedHashtags.join(' ')}`
    await copyToClipboard(fullPost, 'Full post')
  }

  const regenerateContent = () => {
    if (generatedCaption || generatedHashtags.length > 0) {
      if (confirm('This will replace your current generated content. Continue?')) {
        generateContent()
      }
    } else {
      generateContent()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">AI Caption & Hashtag Generator</h2>
            <p className="text-slate-400 text-sm mt-1">Generate captions and hashtags for manual posting</p>
          </div>
          <div className="text-slate-500 text-sm">
            🤖 Powered by OpenAI GPT-4
          </div>
        </div>

        {/* Success Message */}
        {copySuccess && (
          <div className="mb-4 p-3 bg-green-900/20 border border-green-500 rounded-lg text-green-400 text-sm">
            ✅ {copySuccess}
          </div>
        )}

        {/* Client Selection */}
        <div className="mb-6">
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Select Client <span className="text-red-400">*</span>
          </label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Choose a client...</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.business_name} - {client.industry}
              </option>
            ))}
          </select>
        </div>

        {/* Platform Selection */}
        <div className="mb-6">
          <label className="block text-slate-300 text-sm font-medium mb-3">
            Target Platforms (Optional - helps optimize content)
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
                <div className="text-lg mb-1">{platform.icon}</div>
                <div className="text-xs font-medium">{platform.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Content Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Post Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} - {cat.desc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              {tones.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} - {t.desc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Prompt */}
        <div className="mb-6">
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Custom Instructions (Optional)
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g., 'Focus on our new summer menu', 'Mention our grand opening', 'Include a call-to-action to book now'"
            className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none resize-none"
            rows={3}
          />
        </div>

        {/* Generate Button */}
        <div className="text-center">
          <button
            onClick={regenerateContent}
            disabled={isGenerating || !selectedClient}
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              isGenerating || !selectedClient
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isGenerating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Generating...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>🤖</span>
                <span>{generatedCaption ? 'Regenerate' : 'Generate'} Caption & Hashtags</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Generated Content */}
      {(generatedCaption || generatedHashtags.length > 0) && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Generated Content</h3>
          
          {/* Caption */}
          {generatedCaption && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-slate-300 font-medium">Caption</h4>
                <button
                  onClick={() => copyToClipboard(generatedCaption, 'Caption')}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  📋 Copy Caption
                </button>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-white whitespace-pre-wrap">{generatedCaption}</p>
                <div className="text-slate-400 text-xs mt-2">
                  {generatedCaption.length} characters
                </div>
              </div>
            </div>
          )}

          {/* Hashtags */}
          {generatedHashtags.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-slate-300 font-medium">Hashtags ({generatedHashtags.length})</h4>
                <button
                  onClick={() => copyToClipboard(generatedHashtags.join(' '), 'Hashtags')}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  📋 Copy Hashtags
                </button>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {generatedHashtags.map((hashtag, index) => (
                    <span
                      key={index}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-sm cursor-pointer hover:bg-blue-700 transition-colors"
                      onClick={() => copyToClipboard(hashtag, 'Hashtag')}
                      title="Click to copy individual hashtag"
                    >
                      {hashtag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Copy Full Post */}
          <div className="text-center">
            <button
              onClick={copyFullPost}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              📄 Copy Full Post (Caption + Hashtags)
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How to Use</h3>
        <div className="space-y-3 text-slate-300 text-sm">
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">1.</span>
            <span>Select the client you&apos;re creating content for</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">2.</span>
            <span>Choose target platforms to optimize content (optional)</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">3.</span>
            <span>Select post category and tone that fits your content</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">4.</span>
            <span>Add custom instructions if you want specific content (optional)</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">5.</span>
            <span>Click generate and copy the content to paste manually in your social media platforms</span>
          </div>
        </div>
      </div>
    </div>
  )
}