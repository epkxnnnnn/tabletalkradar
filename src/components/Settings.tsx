'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  company_name: string | null
  role: string | null
  industry: string | null
  business_type: string | null
  avatar_url: string | null
}

interface NotificationSettings {
  email_audit_complete: boolean
  email_weekly_reports: boolean
  email_monthly_summary: boolean
  sms_critical_alerts: boolean
  push_notifications: boolean
}

interface ApiKey {
  id: string
  name: string
  key: string
  created_at: string
  last_used: string | null
  is_active: boolean
}

export default function Settings() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_audit_complete: true,
    email_weekly_reports: true,
    email_monthly_summary: false,
    sms_critical_alerts: false,
    push_notifications: true
  })
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [newApiKey, setNewApiKey] = useState({ name: '' })

  useEffect(() => {
    if (user) {
      loadProfile()
      loadNotificationSettings()
      loadApiKeys()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const loadNotificationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (!error && data) {
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
    }
  }

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApiKeys(data || [])
    } catch (error) {
      console.error('Error loading API keys:', error)
    }
  }

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          company_name: profile.company_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const updateNotificationSettings = async () => {
    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user?.id,
          ...notifications,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      alert('Notification settings updated!')
    } catch (error) {
      console.error('Error updating notification settings:', error)
    }
  }

  const createApiKey = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user?.id,
          name: newApiKey.name,
          key: `tt_${Math.random().toString(36).substr(2, 9)}`,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      setNewApiKey({ name: '' })
      setShowApiKeyModal(false)
      loadApiKeys()
      alert('API key created successfully!')
    } catch (error) {
      console.error('Error creating API key:', error)
    }
  }

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)

      if (error) throw error
      loadApiKeys()
    } catch (error) {
      console.error('Error deleting API key:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings & Configuration</h2>
        <p className="text-slate-400">Manage your account, preferences, and integrations</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg">
        {[
          { id: 'profile', label: 'Profile' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'api', label: 'API Keys' },
          { id: 'billing', label: 'Billing' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-red-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Settings */}
      {activeTab === 'profile' && profile && (
        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
          <form onSubmit={updateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email || ''}
                  disabled
                  className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
                <input
                  type="text"
                  value={profile.company_name || ''}
                  onChange={(e) => setProfile({...profile, company_name: e.target.value})}
                  className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                <input
                  type="text"
                  value={profile.role || ''}
                  disabled
                  className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-slate-400"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notifications.email_audit_complete}
                  onChange={(e) => setNotifications({...notifications, email_audit_complete: e.target.checked})}
                  className="mr-3"
                />
                <span className="text-slate-300">Email notifications for audit completion</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notifications.email_weekly_reports}
                  onChange={(e) => setNotifications({...notifications, email_weekly_reports: e.target.checked})}
                  className="mr-3"
                />
                <span className="text-slate-300">Weekly performance reports</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notifications.email_monthly_summary}
                  onChange={(e) => setNotifications({...notifications, email_monthly_summary: e.target.checked})}
                  className="mr-3"
                />
                <span className="text-slate-300">Monthly summary reports</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notifications.sms_critical_alerts}
                  onChange={(e) => setNotifications({...notifications, sms_critical_alerts: e.target.checked})}
                  className="mr-3"
                />
                <span className="text-slate-300">SMS alerts for critical issues</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notifications.push_notifications}
                  onChange={(e) => setNotifications({...notifications, push_notifications: e.target.checked})}
                  className="mr-3"
                />
                <span className="text-slate-300">Push notifications</span>
              </label>
            </div>
            <button
              onClick={updateNotificationSettings}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
            >
              Save Notification Settings
            </button>
          </div>
        </div>
      )}

      {/* API Key Management */}
      {activeTab === 'api' && (
        <div className="bg-slate-800 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">API Key Management</h3>
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Create New API Key
            </button>
          </div>
          
          <div className="space-y-3">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="border border-slate-600 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-medium">{apiKey.name}</h4>
                    <p className="text-slate-400 text-sm font-mono">{apiKey.key}</p>
                    <p className="text-slate-500 text-xs">
                      Created: {new Date(apiKey.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      apiKey.is_active ? 'bg-green-600 text-white' : 'bg-slate-600 text-white'
                    }`}>
                      {apiKey.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => deleteApiKey(apiKey.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {apiKeys.length === 0 && (
              <p className="text-slate-400 text-center py-8">No API keys created yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Billing & Subscription */}
      {activeTab === 'billing' && (
        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Billing & Subscription</h3>
          
          <div className="space-y-6">
            <div className="border border-slate-600 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Current Plan</h4>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xl font-bold text-red-400">Professional</div>
                  <div className="text-slate-400 text-sm">$99/month</div>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                  Manage Plan
                </button>
              </div>
            </div>

            <div className="border border-slate-600 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Usage This Month</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-white">12</div>
                  <div className="text-slate-400 text-sm">Audits Run</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">3</div>
                  <div className="text-slate-400 text-sm">Reports Generated</div>
                </div>
              </div>
            </div>

            <div className="border border-slate-600 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Payment Method</h4>
              <div className="flex justify-between items-center">
                <div className="text-slate-300">•••• •••• •••• 4242</div>
                <button className="text-blue-400 hover:text-blue-300">Update</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Create API Key</h3>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Key Name</label>
                <input
                  type="text"
                  value={newApiKey.name}
                  onChange={(e) => setNewApiKey({...newApiKey, name: e.target.value})}
                  className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                  placeholder="Enter API key name"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createApiKey}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                >
                  Create API Key
                </button>
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 