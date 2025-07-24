'use client'

import React from 'react'
import { useClient } from './ClientProvider'

interface ClientQuickActionsProps {
  widget: any
  clientId?: string
  config: {
    actions?: string[]
    layout?: 'grid' | 'list'
  }
}

export default function ClientQuickActions({ widget, clientId, config }: ClientQuickActionsProps) {
  const { 
    currentClient, 
    canCreatePosts, 
    canRespondReviews, 
    canViewAnalytics,
    trackFeatureUsage 
  } = useClient()

  const defaultActions = [
    'create_post',
    'respond_review', 
    'view_analytics',
    'generate_content',
    'view_calendar'
  ]

  const actions = config.actions || defaultActions

  const getActionConfig = (actionId: string) => {
    const configs = {
      create_post: {
        title: 'Create Post',
        description: 'Schedule a new social media post',
        icon: '📝',
        color: 'bg-blue-600 hover:bg-blue-700',
        enabled: canCreatePosts,
        onClick: () => {
          trackFeatureUsage('quick_action_create_post')
          alert('Post creation interface will open here')
        }
      },
      respond_review: {
        title: 'Respond to Reviews',
        description: 'Reply to customer reviews',
        icon: '💬',
        color: 'bg-green-600 hover:bg-green-700',
        enabled: canRespondReviews,
        onClick: () => {
          trackFeatureUsage('quick_action_respond_review')
          alert('Review response interface will open here')
        }
      },
      view_analytics: {
        title: 'View Analytics',
        description: 'Check performance metrics',
        icon: '📊',
        color: 'bg-purple-600 hover:bg-purple-700',
        enabled: canViewAnalytics,
        onClick: () => {
          trackFeatureUsage('quick_action_view_analytics')
          alert('Analytics dashboard will open here')
        }
      },
      generate_content: {
        title: 'Generate Content',
        description: 'AI-powered caption generator',
        icon: '🤖',
        color: 'bg-orange-600 hover:bg-orange-700',
        enabled: canCreatePosts,
        onClick: () => {
          trackFeatureUsage('quick_action_generate_content')
          alert('AI content generator will open here')
        }
      },
      view_calendar: {
        title: 'Social Calendar',
        description: 'View scheduled posts',
        icon: '📅',
        color: 'bg-indigo-600 hover:bg-indigo-700',
        enabled: canCreatePosts,
        onClick: () => {
          trackFeatureUsage('quick_action_view_calendar')
          alert('Social media calendar will open here')
        }
      },
      manage_reviews: {
        title: 'Manage Reviews',
        description: 'View and respond to all reviews',
        icon: '⭐',
        color: 'bg-yellow-600 hover:bg-yellow-700',
        enabled: canRespondReviews,
        onClick: () => {
          trackFeatureUsage('quick_action_manage_reviews')
          alert('Review management will open here')
        }
      },
      export_data: {
        title: 'Export Data',
        description: 'Download reports and data',
        icon: '📥',
        color: 'bg-slate-600 hover:bg-slate-700',
        enabled: canViewAnalytics,
        onClick: () => {
          trackFeatureUsage('quick_action_export_data')
          alert('Data export options will open here')
        }
      },
      settings: {
        title: 'Business Settings',
        description: 'Update business information',
        icon: '⚙️',
        color: 'bg-gray-600 hover:bg-gray-700',
        enabled: true,
        onClick: () => {
          trackFeatureUsage('quick_action_settings')
          alert('Business settings will open here')
        }
      }
    }

    return configs[actionId as keyof typeof configs]
  }

  const enabledActions = actions
    .map(actionId => ({ id: actionId, ...getActionConfig(actionId) }))
    .filter(action => action && action.enabled)

  if (enabledActions.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {widget.widget_title || 'Quick Actions'}
        </h3>
        <div className="text-center text-slate-400 py-8">
          <div className="text-4xl mb-2">🔒</div>
          <p>No actions available</p>
          <p className="text-sm">Contact your administrator for access</p>
        </div>
      </div>
    )
  }

  const isGridLayout = config.layout !== 'list'

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        {widget.widget_title || 'Quick Actions'}
      </h3>

      <div className={`${
        isGridLayout 
          ? 'grid grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-3'
      }`}>
        {enabledActions.map(action => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`${action.color} text-white p-4 rounded-lg font-medium transition-colors text-left ${
              isGridLayout ? 'aspect-square flex flex-col items-center justify-center text-center' : 'flex items-center space-x-3'
            }`}
          >
            <div className={`text-2xl ${isGridLayout ? 'mb-2' : ''}`}>
              {action.icon}
            </div>
            <div className={isGridLayout ? 'text-center' : 'flex-1'}>
              <div className={`font-semibold ${isGridLayout ? 'text-sm' : 'text-base'}`}>
                {action.title}
              </div>
              {!isGridLayout && (
                <div className="text-sm opacity-80">
                  {action.description}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="text-slate-400 text-sm mb-2">Quick Stats</div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-white font-bold">0</div>
            <div className="text-slate-500 text-xs">Pending</div>
          </div>
          <div>
            <div className="text-green-400 font-bold">0</div>
            <div className="text-slate-500 text-xs">Published</div>
          </div>
          <div>
            <div className="text-blue-400 font-bold">0</div>
            <div className="text-slate-500 text-xs">Scheduled</div>
          </div>
        </div>
      </div>

      {/* Business Info */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="text-slate-400 text-sm mb-2">Business</div>
        <div className="text-white font-medium">{currentClient?.business_name}</div>
        <div className="text-slate-500 text-sm">{currentClient?.industry} • {currentClient?.location}</div>
      </div>
    </div>
  )
}