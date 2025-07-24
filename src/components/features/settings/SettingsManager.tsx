'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../providers/AuthProvider'

interface UserProfile {
  id: string
  email: string
  full_name: string
  company_name?: string
  phone?: string
  timezone: string
  created_at: string
}

interface NotificationSettings {
  email_reviews: boolean
  email_questions: boolean
  email_mentions: boolean
  push_reviews: boolean
  push_questions: boolean
  push_mentions: boolean
}

export default function SettingsManager() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    full_name: '',
    company_name: '',
    phone: '',
    timezone: 'America/New_York',
    created_at: ''
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_reviews: true,
    email_questions: true,
    email_mentions: false,
    push_reviews: true,
    push_questions: true,
    push_mentions: false
  })

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      if (profileData) {
        setProfile(profileData)
      } else {
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: user?.id,
            email: user?.email,
            full_name: user?.user_metadata?.full_name || '',
            timezone: 'America/New_York'
          }])
          .select()
          .single()

        if (createError) throw createError
        if (newProfile) setProfile(newProfile)
      }

      // Load notification settings
      const { data: notificationData, error: notificationError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (notificationError && notificationError.code !== 'PGRST116') {
        console.log('Notification settings not found, using defaults')
      } else if (notificationData) {
        setNotifications(notificationData)
      }

    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          email: profile.email,
          full_name: profile.full_name,
          company_name: profile.company_name,
          phone: profile.phone,
          timezone: profile.timezone
        })

      if (error) throw error
      
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile')
    } finally {
      setSaving(false)
    }
  }

  const saveNotifications = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user?.id,
          ...notifications
        })

      if (error) throw error
      
      alert('Notification settings updated successfully!')
    } catch (error) {
      console.error('Error saving notifications:', error)
      alert('Error saving notification settings')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      alert('New passwords do not match')
      return
    }

    if (passwordData.new.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      })

      if (error) throw error
      
      setPasswordData({ current: '', new: '', confirm: '' })
      alert('Password updated successfully!')
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Error changing password')
    } finally {
      setSaving(false)
    }
  }

  const deleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // Delete user data
        await supabase.from('profiles').delete().eq('id', user?.id)
        await supabase.from('businesses').delete().eq('user_id', user?.id)
        
        // Sign out
        await signOut()
      } catch (error) {
        console.error('Error deleting account:', error)
        alert('Error deleting account')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Settings</h1>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg">
        {[
          { id: 'profile', name: 'Profile', icon: '👤' },
          { id: 'notifications', name: 'Notifications', icon: '🔔' },
          { id: 'security', name: 'Security', icon: '🔒' },
          { id: 'account', name: 'Account', icon: '⚙️' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-red-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-slate-800 p-6 rounded-lg space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={profile.company_name || ''}
                onChange={(e) => setProfile({...profile, company_name: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timezone
              </label>
              <select
                value={profile.timezone}
                onChange={(e) => setProfile({...profile, timezone: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={saveProfile}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-slate-800 p-6 rounded-lg space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Notification Settings</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Email Notifications</h3>
              <div className="space-y-3">
                {[
                  { key: 'email_reviews', label: 'New reviews' },
                  { key: 'email_questions', label: 'New questions' },
                  { key: 'email_mentions', label: 'Social media mentions' }
                ].map((item) => (
                  <label key={item.key} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={notifications[item.key as keyof NotificationSettings]}
                      onChange={(e) => setNotifications({
                        ...notifications,
                        [item.key]: e.target.checked
                      })}
                      className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
                    />
                    <span className="text-gray-300">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Push Notifications</h3>
              <div className="space-y-3">
                {[
                  { key: 'push_reviews', label: 'New reviews' },
                  { key: 'push_questions', label: 'New questions' },
                  { key: 'push_mentions', label: 'Social media mentions' }
                ].map((item) => (
                  <label key={item.key} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={notifications[item.key as keyof NotificationSettings]}
                      onChange={(e) => setNotifications({
                        ...notifications,
                        [item.key]: e.target.checked
                      })}
                      className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
                    />
                    <span className="text-gray-300">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <button
            onClick={saveNotifications}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Notifications'}
          </button>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-slate-800 p-6 rounded-lg space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Change Password</h2>
          
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.current}
                onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.new}
                onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
              />
            </div>
            
            <button
              onClick={changePassword}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {saving ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="bg-slate-800 p-6 rounded-lg space-y-6">
          <h2 className="text-xl font-semibold text-white mb-4">Account Management</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-700 rounded-lg">
              <h3 className="font-medium text-white mb-2">Account Information</h3>
              <p className="text-gray-300 text-sm">
                Account created: {new Date(profile.created_at).toLocaleDateString()}
              </p>
              <p className="text-gray-300 text-sm">
                Email: {profile.email}
              </p>
            </div>
            
            <div className="p-4 border border-red-600 rounded-lg">
              <h3 className="font-medium text-red-400 mb-2">Danger Zone</h3>
              <p className="text-gray-300 text-sm mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={deleteAccount}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}