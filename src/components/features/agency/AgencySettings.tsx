'use client'

import React, { useState, useEffect } from 'react'
import { useAgency } from '../../providers/AgencyProvider'
import { useAuth } from '../../providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Agency, AgencySettings as Settings, AgencyBranding, SubscriptionPlan } from '@/lib/types/agency'

interface SettingsForm {
  // Basic Info
  name: string
  contact_email: string
  contact_phone: string
  website: string
  
  // Subscription
  subscription_plan: SubscriptionPlan
  
  // Settings
  settings: Settings
  
  // Branding
  branding: AgencyBranding
  
  // Address
  address: {
    street: string
    city: string
    state: string
    country: string
    postal_code: string
    timezone: string
  }
}

export default function AgencySettings() {
  const { currentAgency, permissions, refreshAgencyData } = useAgency()
  const { user } = useAuth()
  
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<SettingsForm>({
    name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    subscription_plan: 'starter',
    settings: {
      auto_assign_clients: true,
      default_audit_frequency: 'monthly',
      enable_ai_insights: true,
      enable_predictive_analytics: false,
      notification_channels: ['email'],
      alert_thresholds: {
        performance_change: 20,
        risk_score: 70,
        opportunity_score: 60
      },
      report_formats: ['pdf'],
      report_frequency: 'weekly',
      include_competitive_analysis: true,
      enable_client_portal: false,
      allow_client_data_export: false,
      webhook_urls: [],
      api_rate_limits: {
        requests_per_minute: 100,
        requests_per_hour: 1000
      }
    },
    branding: {
      primary_color: '#dc2626',
      secondary_color: '#b91c1c',
      font_family: 'Inter',
      client_portal_theme: 'light',
      custom_css: '',
      email_footer_text: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      country: 'United States',
      postal_code: '',
      timezone: 'America/New_York'
    }
  })

  const subscriptionPlans: { value: SubscriptionPlan; name: string; price: string; limits: { clients: number; team: number; audits: number } }[] = [
    {
      value: 'starter',
      name: 'Starter Plan',
      price: '$97/month',
      limits: { clients: 5, team: 2, audits: 50 }
    },
    {
      value: 'professional',
      name: 'Professional Plan', 
      price: '$297/month',
      limits: { clients: 20, team: 5, audits: 200 }
    },
    {
      value: 'enterprise',
      name: 'Enterprise Plan',
      price: '$597/month',
      limits: { clients: -1, team: 15, audits: 1000 }
    },
    {
      value: 'custom',
      name: 'Custom Plan',
      price: 'Contact us',
      limits: { clients: -1, team: -1, audits: -1 }
    }
  ]

  const timezones = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome',
    'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai', 'Australia/Sydney'
  ]

  const settingsTabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'subscription', name: 'Subscription', icon: '💳' },
    { id: 'automation', name: 'Automation', icon: '🤖' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'branding', name: 'Branding', icon: '🎨' },
    { id: 'integrations', name: 'Integrations', icon: '🔗' },
    { id: 'security', name: 'Security', icon: '🔐' }
  ]

  useEffect(() => {
    if (currentAgency) {
      loadAgencySettings()
    }
  }, [currentAgency])

  const loadAgencySettings = () => {
    if (!currentAgency) return
    
    setFormData({
      name: currentAgency.name,
      contact_email: currentAgency.contact_email || '',
      contact_phone: currentAgency.contact_phone || '',
      website: currentAgency.website || '',
      subscription_plan: currentAgency.subscription_plan,
      settings: {
        auto_assign_clients: currentAgency.settings?.auto_assign_clients ?? true,
        default_audit_frequency: currentAgency.settings?.default_audit_frequency || 'monthly',
        enable_ai_insights: currentAgency.settings?.enable_ai_insights ?? true,
        enable_predictive_analytics: currentAgency.settings?.enable_predictive_analytics ?? false,
        notification_channels: currentAgency.settings?.notification_channels || ['email'],
        alert_thresholds: currentAgency.settings?.alert_thresholds || {
          performance_change: 20,
          risk_score: 70,
          opportunity_score: 60
        },
        report_formats: currentAgency.settings?.report_formats || ['pdf'],
        report_frequency: currentAgency.settings?.report_frequency || 'weekly',
        include_competitive_analysis: currentAgency.settings?.include_competitive_analysis ?? true,
        enable_client_portal: currentAgency.settings?.enable_client_portal ?? false,
        allow_client_data_export: currentAgency.settings?.allow_client_data_export ?? false,
        webhook_urls: currentAgency.settings?.webhook_urls || [],
        api_rate_limits: currentAgency.settings?.api_rate_limits || {
          requests_per_minute: 100,
          requests_per_hour: 1000
        }
      },
      branding: {
        primary_color: currentAgency.branding?.primary_color || '#dc2626',
        secondary_color: currentAgency.branding?.secondary_color || '#b91c1c',
        font_family: currentAgency.branding?.font_family || 'Inter',
        client_portal_theme: currentAgency.branding?.client_portal_theme || 'light',
        custom_css: currentAgency.branding?.custom_css || '',
        company_name: currentAgency.branding?.company_name || currentAgency.name,
        website_url: currentAgency.branding?.website_url || currentAgency.website,
        support_email: currentAgency.branding?.support_email || currentAgency.contact_email,
        email_footer_text: currentAgency.branding?.email_footer_text || ''
      },
      address: {
        street: currentAgency.address?.street || '',
        city: currentAgency.address?.city || '',
        state: currentAgency.address?.state || '',
        country: currentAgency.address?.country || 'United States',
        postal_code: currentAgency.address?.postal_code || '',
        timezone: currentAgency.address?.timezone || 'America/New_York'
      }
    })
  }

  const handleSave = async () => {
    if (!currentAgency) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('agencies')
        .update({
          name: formData.name,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          website: formData.website,
          subscription_plan: formData.subscription_plan,
          settings: formData.settings,
          branding: formData.branding,
          address: formData.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentAgency.id)

      if (error) throw error

      await refreshAgencyData()
      alert('Settings saved successfully!')

    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (section: keyof SettingsForm, field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => {
      if (field && typeof prev[section] === 'object' && prev[section] !== null) {
        return {
          ...prev,
          [section]: {
            ...(prev[section] as Record<string, unknown>),
            [field]: value
          }
        }
      } else {
        return {
          ...prev,
          [section]: value
        }
      }
    })
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Agency Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Street Address
            </label>
            <input
              type="text"
              value={formData.address.street}
              onChange={(e) => handleInputChange('address', 'street', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              City
            </label>
            <input
              type="text"
              value={formData.address.city}
              onChange={(e) => handleInputChange('address', 'city', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              State/Province
            </label>
            <input
              type="text"
              value={formData.address.state}
              onChange={(e) => handleInputChange('address', 'state', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Country
            </label>
            <select
              value={formData.address.country}
              onChange={(e) => handleInputChange('address', 'country', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Australia">Australia</option>
              <option value="Germany">Germany</option>
              <option value="France">France</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Postal Code
            </label>
            <input
              type="text"
              value={formData.address.postal_code}
              onChange={(e) => handleInputChange('address', 'postal_code', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Timezone
            </label>
            <select
              value={formData.address.timezone}
              onChange={(e) => handleInputChange('address', 'timezone', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSubscriptionSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Current Subscription</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {subscriptionPlans.map(plan => (
            <div
              key={plan.value}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.subscription_plan === plan.value
                  ? 'border-red-500 bg-red-900/20'
                  : 'border-slate-600 bg-slate-800 hover:border-slate-500'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, subscription_plan: plan.value }))}
            >
              <h4 className="font-semibold text-white mb-2">{plan.name}</h4>
              <div className="text-2xl font-bold text-red-400 mb-3">{plan.price}</div>
              <div className="space-y-1 text-sm text-slate-300">
                <div>Clients: {plan.limits.clients === -1 ? 'Unlimited' : plan.limits.clients}</div>
                <div>Team: {plan.limits.team === -1 ? 'Unlimited' : plan.limits.team}</div>
                <div>Audits: {plan.limits.audits === -1 ? 'Unlimited' : `${plan.limits.audits}/mo`}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Usage Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-2xl font-bold text-blue-400">0</div>
            <div className="text-sm text-slate-400">Clients Used</div>
            <div className="text-xs text-slate-500">
              of {currentAgency?.max_clients === 1000 ? 'unlimited' : currentAgency?.max_clients}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">1</div>
            <div className="text-sm text-slate-400">Team Members</div>
            <div className="text-xs text-slate-500">
              of {currentAgency?.max_team_members === 15 ? 'unlimited' : currentAgency?.max_team_members}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">0</div>
            <div className="text-sm text-slate-400">Audits This Month</div>
            <div className="text-xs text-slate-500">
              of {currentAgency?.max_monthly_audits === 1000 ? 'unlimited' : currentAgency?.max_monthly_audits}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAutomationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Automation Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Auto-assign New Clients</h4>
              <p className="text-slate-400 text-sm">Automatically assign new clients to available team members</p>
            </div>
            <input
              type="checkbox"
              checked={formData.settings.auto_assign_clients}
              onChange={(e) => handleInputChange('settings', 'auto_assign_clients', e.target.checked)}
              className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Enable AI Insights</h4>
              <p className="text-slate-400 text-sm">Use AI to generate intelligent insights and recommendations</p>
            </div>
            <input
              type="checkbox"
              checked={formData.settings.enable_ai_insights}
              onChange={(e) => handleInputChange('settings', 'enable_ai_insights', e.target.checked)}
              className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Predictive Analytics</h4>
              <p className="text-slate-400 text-sm">Enable advanced predictive analytics and forecasting</p>
            </div>
            <input
              type="checkbox"
              checked={formData.settings.enable_predictive_analytics}
              onChange={(e) => handleInputChange('settings', 'enable_predictive_analytics', e.target.checked)}
              className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
              disabled={formData.subscription_plan === 'starter'}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Default Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Default Audit Frequency
            </label>
            <select
              value={formData.settings.default_audit_frequency}
              onChange={(e) => handleInputChange('settings', 'default_audit_frequency', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Report Frequency
            </label>
            <select
              value={formData.settings.report_frequency}
              onChange={(e) => handleInputChange('settings', 'report_frequency', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderBrandingSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Brand Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Primary Color
            </label>
            <div className="flex space-x-3">
              <input
                type="color"
                value={formData.branding.primary_color}
                onChange={(e) => handleInputChange('branding', 'primary_color', e.target.value)}
                className="w-12 h-10 rounded border border-slate-600"
              />
              <input
                type="text"
                value={formData.branding.primary_color}
                onChange={(e) => handleInputChange('branding', 'primary_color', e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Secondary Color
            </label>
            <div className="flex space-x-3">
              <input
                type="color"
                value={formData.branding.secondary_color}
                onChange={(e) => handleInputChange('branding', 'secondary_color', e.target.value)}
                className="w-12 h-10 rounded border border-slate-600"
              />
              <input
                type="text"
                value={formData.branding.secondary_color}
                onChange={(e) => handleInputChange('branding', 'secondary_color', e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">White-label Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={formData.branding.company_name || ''}
              onChange={(e) => handleInputChange('branding', 'company_name', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Support Email
            </label>
            <input
              type="email"
              value={formData.branding.support_email || ''}
              onChange={(e) => handleInputChange('branding', 'support_email', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Email Footer Text
        </label>
        <textarea
          value={formData.branding.email_footer_text}
          onChange={(e) => handleInputChange('branding', 'email_footer_text', e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 h-20"
          placeholder="Custom footer text for all emails sent from your agency"
        />
      </div>
    </div>
  )

  if (!permissions?.can_edit_agency_settings) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <div className="text-slate-400 mb-4">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No Permission</h3>
        <p className="text-slate-400">You don&apos;t have permission to access agency settings.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Agency Settings</h2>
          <p className="text-slate-400">Manage your agency configuration and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-700">
        <nav className="flex space-x-8 overflow-x-auto">
          {settingsTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="bg-slate-800 rounded-lg p-6 min-h-[500px]">
        {activeTab === 'general' && renderGeneralSettings()}
        {activeTab === 'subscription' && renderSubscriptionSettings()}
        {activeTab === 'automation' && renderAutomationSettings()}
        {activeTab === 'branding' && renderBrandingSettings()}
        
        {['notifications', 'integrations', 'security'].includes(activeTab) && (
          <div className="text-center text-slate-400 py-12">
            <div className="text-4xl mb-4">
              {settingsTabs.find(t => t.id === activeTab)?.icon}
            </div>
            <h3 className="text-lg font-medium mb-2">
              {settingsTabs.find(t => t.id === activeTab)?.name} Settings
            </h3>
            <p>Advanced {activeTab} configuration coming soon.</p>
          </div>
        )}
      </div>
    </div>
  )
}