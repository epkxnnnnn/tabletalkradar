'use client'

import React, { useState, useEffect } from 'react'
import { useAgency } from './AgencyProvider'
import { supabase } from '@/lib/supabase'

interface Client {
  id: string
  business_name: string
  industry: string
  location: string
  website: string
}

interface ClientUser {
  id: string
  user_id: string
  client_id: string
  role: string
  is_active: boolean
  last_login?: string
  created_at: string
  user_email?: string
  client_name?: string
}

export default function ClientUserInvite() {
  const { currentAgency } = useAgency()
  const [clients, setClients] = useState<Client[]>([])
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'owner' | 'manager' | 'editor' | 'viewer'>('owner')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (currentAgency) {
      loadClients()
      loadClientUsers()
    }
  }, [currentAgency])

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('agency_id', currentAgency?.id)
        .eq('status', 'active')
        .order('business_name')

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error instanceof Error ? error.message : error)
    }
  }

  const loadClientUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('client_users')
        .select(`
          *,
          clients(business_name)
        `)
        .eq('agency_id', currentAgency?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Get user emails (this requires additional query since RLS might restrict access)
      const clientUsersWithEmails = await Promise.all(
        (data || []).map(async (cu) => {
          const { data: userData } = await supabase
            .from('auth.users')
            .select('email')
            .eq('id', cu.user_id)
            .single()
          
          return {
            ...cu,
            user_email: userData?.email || 'Unknown',
            client_name: cu.clients?.business_name || 'Unknown Client'
          }
        })
      )

      setClientUsers(clientUsersWithEmails)
    } catch (error) {
      console.error('Error loading client users:', error instanceof Error ? error.message : error)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedClient || !inviteEmail.trim()) {
      setMessage('Please select a client and enter an email address')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/client/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient,
          email: inviteEmail.trim(),
          role: inviteRole
        })
      })

      const result = await response.json()

      if (result.success) {
        if (result.signup_required) {
          setMessage(`📧 Invitation instructions:\n${result.instructions}`)
        } else {
          setMessage('✅ User access granted successfully!')
          setInviteEmail('')
          setSelectedClient('')
          loadClientUsers()
        }
      } else {
        throw new Error(result.error || 'Invitation failed')
      }
    } catch (error) {
      console.error('Error inviting user:', error instanceof Error ? error.message : error)
      setMessage(`❌ ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserAccess = async (clientUserId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('client_users')
        .update({ is_active: !isActive })
        .eq('id', clientUserId)

      if (error) throw error

      setMessage(`✅ User access ${!isActive ? 'enabled' : 'disabled'} successfully`)
      loadClientUsers()
    } catch (error) {
      console.error('Error updating user access:', error instanceof Error ? error.message : error)
      setMessage('❌ Failed to update user access')
    }
  }

  const generateDashboardLink = (clientId: string) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/client?client_id=${clientId}`
  }

  return (
    <div className="space-y-6">
      {/* Invite New User */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Invite Client User</h3>
        
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('✅') ? 'bg-green-900/20 border border-green-500 text-green-400' :
            message.includes('📧') ? 'bg-blue-900/20 border border-blue-500 text-blue-400' :
            'bg-red-900/20 border border-red-500 text-red-400'
          }`}>
            <pre className="whitespace-pre-wrap">{message}</pre>
          </div>
        )}

        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Select Client <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">Choose a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.business_name} - {client.industry}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="owner">Owner (Full Access)</option>
                <option value="manager">Manager (Create & Respond)</option>
                <option value="editor">Editor (Create Only)</option>
                <option value="viewer">Viewer (Read Only)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="client@example.com"
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded font-medium transition-colors ${
                loading
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Inviting...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Client Users */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Client Dashboard Access</h3>
        
        {clientUsers.length > 0 ? (
          <div className="space-y-4">
            {clientUsers.map(clientUser => (
              <div key={clientUser.id} className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="text-white font-medium">{clientUser.user_email}</div>
                        <div className="text-slate-400 text-sm">{clientUser.client_name}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        clientUser.role === 'owner' ? 'bg-red-900/20 text-red-400' :
                        clientUser.role === 'manager' ? 'bg-blue-900/20 text-blue-400' :
                        clientUser.role === 'editor' ? 'bg-green-900/20 text-green-400' :
                        'bg-gray-900/20 text-gray-400'
                      }`}>
                        {clientUser.role}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        clientUser.is_active 
                          ? 'bg-green-900/20 text-green-400' 
                          : 'bg-red-900/20 text-red-400'
                      }`}>
                        {clientUser.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div className="text-slate-500 text-xs mt-1">
                      Last login: {clientUser.last_login ? new Date(clientUser.last_login).toLocaleDateString() : 'Never'}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const link = generateDashboardLink(clientUser.client_id)
                        navigator.clipboard.writeText(link)
                        setMessage('📋 Dashboard link copied to clipboard!')
                        setTimeout(() => setMessage(''), 3000)
                      }}
                      className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      📋 Copy Link
                    </button>
                    <button
                      onClick={() => toggleUserAccess(clientUser.id, clientUser.is_active)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        clientUser.is_active
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {clientUser.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-400 py-8">
            <div className="text-4xl mb-2">👥</div>
            <p>No client users yet</p>
            <p className="text-sm">Invite clients to access their own dashboards</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How Client Access Works</h3>
        <div className="space-y-3 text-slate-300 text-sm">
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">1.</span>
            <span>Invite a client by entering their email and selecting their business</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">2.</span>
            <span>If they have an account, they get immediate access. If not, they need to sign up first</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">3.</span>
            <span>Copy the dashboard link and send it to your client</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">4.</span>
            <span>Clients can only see their own business data and nothing else</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">5.</span>
            <span>You maintain full control and can disable access at any time</span>
          </div>
        </div>
      </div>
    </div>
  )
}