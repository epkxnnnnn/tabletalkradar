'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { useAgency } from './AgencyProvider'
import { supabase } from '@/lib/supabase'
import AgencyDashboard from './AgencyDashboard'
import AgencyCreation from './AgencyCreation'
import BusinessAuditAnalyzer from './BusinessAuditAnalyzer'
import ClientManager from './ClientManager'
import AuditHistory from './AuditHistory'
import ReportGenerator from './ReportGenerator'
import Settings from './Settings'
import Integrations from './Integrations'
import TeamManagement from './TeamManagement'
import { ToastContainer, useToast } from './Toast'
import Image from 'next/image'

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  company_name: string | null
  role: string | null
  industry: string | null
  business_type: string | null
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { currentAgency, membership, loading: agencyLoading, availableAgencies } = useAgency()
  const { toasts, removeToast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState('audit')
  const [loading, setLoading] = useState(true)
  const [showAgencyCreation, setShowAgencyCreation] = useState(false)

  useEffect(() => {
    if (user) {
      loadProfile()
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
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const isSuperAdmin = profile?.role === 'superadmin' || user?.email === 'kphstk@gmail.com'
  const isAgency = profile?.role === 'agency' || currentAgency
  const hasAgencyAccess = currentAgency && membership

  if (loading || agencyLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Please sign in to access the dashboard.</div>
      </div>
    )
  }

  // If user has agency access, show the new agency dashboard
  if (hasAgencyAccess) {
    return <AgencyDashboard />
  }

  // Show agency creation flow if user wants to create one
  if (showAgencyCreation) {
    return (
      <AgencyCreation
        onAgencyCreated={() => setShowAgencyCreation(false)}
        onCancel={() => setShowAgencyCreation(false)}
      />
    )
  }

  // Show agency creation option if user has no agencies but profile suggests they should
  if (availableAgencies.length === 0 && (profile?.role === 'agency' || isSuperAdmin)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Create Your Agency</h2>
            <p className="text-slate-400 mb-6">
              Get started by creating your agency to manage multiple clients with AI-powered insights.
            </p>
            <div className="space-y-4">
              <button 
                onClick={() => setShowAgencyCreation(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Create Agency
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium"
              >
                Continue as Individual User
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image src="/logo.png" alt="TableTalk Radar" width={150} height={40} className="h-10 w-auto" />
              {isSuperAdmin && (
                <span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                  SUPER ADMIN
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-slate-300">
                Welcome, {profile?.full_name || user.email}
                {isSuperAdmin && (
                  <span className="ml-2 text-red-400">(Super Admin)</span>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-300 hover:text-slate-200 hover:border-slate-300'
              }`}
            >
              Business Audit
            </button>
            {(isAgency || isSuperAdmin) && (
              <button
                onClick={() => setActiveTab('clients')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'clients'
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-slate-300 hover:text-slate-200 hover:border-slate-300'
                }`}
              >
                Client Management
              </button>
            )}
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'history'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-300 hover:text-slate-200 hover:border-slate-300'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-300 hover:text-slate-200 hover:border-slate-300'
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'integrations'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-300 hover:text-slate-200 hover:border-slate-300'
              }`}
            >
              Integrations
            </button>
            {(isAgency || isSuperAdmin) && (
              <button
                onClick={() => setActiveTab('team')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'team'
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-slate-300 hover:text-slate-200 hover:border-slate-300'
                }`}
              >
                Team Management
              </button>
            )}
            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'admin'
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-slate-300 hover:text-slate-200 hover:border-slate-300'
                }`}
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-300 hover:text-slate-200 hover:border-slate-300'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'audit' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Business Audit</h2>
              <p className="text-slate-400">Run comprehensive audits for your business or clients</p>
            </div>
            <BusinessAuditAnalyzer />
          </div>
        )}

        {activeTab === 'clients' && (isAgency || isSuperAdmin) && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Client Management</h2>
              <p className="text-slate-400">Manage your client portfolio and run audits for multiple businesses</p>
            </div>
            <ClientManager />
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Analytics & History</h2>
              <p className="text-slate-400">View past audit results and track performance over time</p>
            </div>
            <AuditHistory />
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Report Generation</h2>
              <p className="text-slate-400">Create professional PDF reports with custom branding</p>
            </div>
            <ReportGenerator />
          </div>
        )}

        {activeTab === 'integrations' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Integrations</h2>
              <p className="text-slate-400">Connect your business accounts to enhance audit capabilities</p>
            </div>
            <Integrations />
          </div>
        )}

        {activeTab === 'team' && (isAgency || isSuperAdmin) && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Team Management</h2>
              <p className="text-slate-400">Manage your team members, communications, and performance</p>
            </div>
            <TeamManagement />
          </div>
        )}

        {activeTab === 'admin' && isSuperAdmin && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
              <p className="text-slate-400">System administration and user management</p>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">System Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-400">0</div>
                      <div className="text-slate-300 text-sm">Total Users</div>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">0</div>
                      <div className="text-slate-300 text-sm">Total Audits</div>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">0</div>
                      <div className="text-slate-300 text-sm">Active Clients</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-left">
                      View All Users
                    </button>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-left">
                      System Settings
                    </button>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-left">
                      Database Backup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Settings & Configuration</h2>
              <p className="text-slate-400">Manage your account preferences and notification settings</p>
            </div>
            <Settings />
          </div>
        )}
      </main>
    </div>
  )
} 