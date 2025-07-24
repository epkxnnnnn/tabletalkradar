'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { supabase } from '@/lib/supabase'

interface AdminAction {
  id: string
  action_type: string
  admin_user: { email: string }
  target_user?: { email: string }
  target_client?: { business_name: string }
  action_details: any
  created_at: string
}

interface ActiveSession {
  id: string
  admin_user: { email: string }
  target_user: { email: string }
  reason: string
  expires_at: string
  created_at: string
}

interface PermissionOverride {
  id: string
  admin_user: { email: string }
  target_user: { email: string }
  override_permissions: any
  reason: string
  expires_at: string
  created_at: string
}

export default function SuperAdminControlPanel() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState('actions')
  const [auditLog, setAuditLog] = useState<AdminAction[]>([])
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [permissionOverrides, setPermissionOverrides] = useState<PermissionOverride[]>([])
  const [loading, setLoading] = useState(true)
  
  // Override form state
  const [showOverrideForm, setShowOverrideForm] = useState(false)
  const [overrideAction, setOverrideAction] = useState('')
  const [targetUserId, setTargetUserId] = useState('')
  const [targetClientId, setTargetClientId] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideData, setOverrideData] = useState('{}')
  const [isEmergency, setIsEmergency] = useState(false)
  
  // Available users and clients for targeting
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [availableClients, setAvailableClients] = useState<any[]>([])

  const isSuperAdmin = profile?.role === 'superadmin' || user?.email === 'kphstk@gmail.com'

  useEffect(() => {
    if (user && isSuperAdmin) {
      loadAdminData()
      loadAvailableTargets()
    }
  }, [user, isSuperAdmin])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      // Load audit log
      const auditResponse = await fetch('/api/v1/admin/override?action=audit_log&limit=100')
      if (auditResponse.ok) {
        const auditData = await auditResponse.json()
        setAuditLog(auditData.data.audit_log || [])
      }

      // Load active sessions
      const sessionsResponse = await fetch('/api/v1/admin/override?action=active_sessions')
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        setActiveSessions(sessionsData.data.active_sessions || [])
      }

      // Load permission overrides
      const overridesResponse = await fetch('/api/v1/admin/override')
      if (overridesResponse.ok) {
        const overridesData = await overridesResponse.json()
        setPermissionOverrides(overridesData.data.permission_overrides || [])
      }
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableTargets = async () => {
    try {
      // Load users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .order('email')

      if (!usersError) {
        setAvailableUsers(users || [])
      }

      // Load clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, business_name, user_id, status')
        .order('business_name')

      if (!clientsError) {
        setAvailableClients(clients || [])
      }
    } catch (error) {
      console.error('Error loading targets:', error)
    }
  }

  const executeOverride = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      let parsedOverrideData = {}
      if (overrideData.trim()) {
        parsedOverrideData = JSON.parse(overrideData)
      }

      const response = await fetch('/api/v1/admin/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: overrideAction,
          target_user_id: targetUserId || undefined,
          target_client_id: targetClientId || undefined,
          override_data: parsedOverrideData,
          reason: overrideReason,
          emergency: isEmergency
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        alert(`Override executed successfully: ${JSON.stringify(result.data.result, null, 2)}`)
        setShowOverrideForm(false)
        resetOverrideForm()
        loadAdminData()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      alert(`Error executing override: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const revokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this impersonation session?')) return

    try {
      const response = await fetch(`/api/v1/admin/override?session_id=${sessionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Session revoked successfully')
        loadAdminData()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert(`Error revoking session: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const revokeOverride = async (overrideId: string) => {
    if (!confirm('Are you sure you want to revoke this permission override?')) return

    try {
      const response = await fetch(`/api/v1/admin/override?override_id=${overrideId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Override revoked successfully')
        loadAdminData()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert(`Error revoking override: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const resetOverrideForm = () => {
    setOverrideAction('')
    setTargetUserId('')
    setTargetClientId('')
    setOverrideReason('')
    setOverrideData('{}')
    setIsEmergency(false)
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold mb-2">Super Admin Access Required</h2>
          <p className="text-slate-400">This control panel is only accessible to super administrators.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Super Admin Control Panel</h1>
              <p className="text-slate-400 mt-2">
                Advanced administrative controls and system overrides • Logged as: {user?.email}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full font-medium">
                SUPER ADMIN
              </span>
              <button
                onClick={() => setShowOverrideForm(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Execute Override
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="border-b border-slate-700 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'actions', name: 'Admin Actions', icon: '⚡' },
              { id: 'sessions', name: 'Active Sessions', icon: '👤' },
              { id: 'overrides', name: 'Permission Overrides', icon: '🔓' },
              { id: 'system', name: 'System Controls', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center">
            <div className="text-slate-400">Loading admin data...</div>
          </div>
        ) : (
          <>
            {activeTab === 'actions' && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Recent Admin Actions</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left text-slate-300 pb-2">Timestamp</th>
                          <th className="text-left text-slate-300 pb-2">Admin</th>
                          <th className="text-left text-slate-300 pb-2">Action</th>
                          <th className="text-left text-slate-300 pb-2">Target</th>
                          <th className="text-left text-slate-300 pb-2">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLog.map(action => (
                          <tr key={action.id} className="border-b border-slate-800">
                            <td className="py-3 text-slate-400">
                              {new Date(action.created_at).toLocaleString()}
                            </td>
                            <td className="py-3 text-white">{action.admin_user.email}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded text-xs ${
                                action.action_type.includes('FAILED') ? 'bg-red-900/20 text-red-400' :
                                action.action_type.includes('emergency') ? 'bg-orange-900/20 text-orange-400' :
                                'bg-blue-900/20 text-blue-400'
                              }`}>
                                {action.action_type}
                              </span>
                            </td>
                            <td className="py-3 text-slate-300">
                              {action.target_user?.email || action.target_client?.business_name || 'System'}
                            </td>
                            <td className="py-3 text-slate-400 max-w-xs truncate">
                              {action.action_details.reason || JSON.stringify(action.action_details).substring(0, 100) + '...'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Active Impersonation Sessions</h2>
                  {activeSessions.length > 0 ? (
                    <div className="space-y-4">
                      {activeSessions.map(session => (
                        <div key={session.id} className="bg-slate-700 rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <div className="text-white font-medium">
                              {session.admin_user.email} → {session.target_user.email}
                            </div>
                            <div className="text-slate-400 text-sm mt-1">
                              Reason: {session.reason}
                            </div>
                            <div className="text-slate-400 text-sm">
                              Expires: {new Date(session.expires_at).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => revokeSession(session.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 py-8">
                      No active impersonation sessions
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'overrides' && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Active Permission Overrides</h2>
                  {permissionOverrides.length > 0 ? (
                    <div className="space-y-4">
                      {permissionOverrides.map(override => (
                        <div key={override.id} className="bg-slate-700 rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <div className="text-white font-medium">
                              {override.admin_user.email} → {override.target_user.email}
                            </div>
                            <div className="text-slate-400 text-sm mt-1">
                              Reason: {override.reason}
                            </div>
                            <div className="text-slate-400 text-sm">
                              Permissions: {JSON.stringify(override.override_permissions)}
                            </div>
                            <div className="text-slate-400 text-sm">
                              Expires: {new Date(override.expires_at).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => revokeOverride(override.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 py-8">
                      No active permission overrides
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">System Controls</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-left">
                      <div className="font-medium">System Health Check</div>
                      <div className="text-sm text-blue-200">Check all system components</div>
                    </button>
                    <button 
                      onClick={loadAdminData}
                      className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-left"
                    >
                      <div className="font-medium">Refresh Data</div>
                      <div className="text-sm text-green-200">Reload all admin data</div>
                    </button>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg text-left">
                      <div className="font-medium">Export Audit Log</div>
                      <div className="text-sm text-purple-200">Download audit trail</div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Override Form Modal */}
        {showOverrideForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4">Execute Admin Override</h3>
              <form onSubmit={executeOverride} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Override Action</label>
                  <select
                    value={overrideAction}
                    onChange={(e) => setOverrideAction(e.target.value)}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                    required
                  >
                    <option value="">Select Action</option>
                    <option value="impersonate_user">Impersonate User</option>
                    <option value="override_permissions">Override Permissions</option>
                    <option value="force_action">Force Action</option>
                    <option value="emergency_access">Emergency Access</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Target User (optional)</label>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                  >
                    <option value="">Select User</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>{user.email} ({user.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Target Client (optional)</label>
                  <select
                    value={targetClientId}
                    onChange={(e) => setTargetClientId(e.target.value)}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                  >
                    <option value="">Select Client</option>
                    {availableClients.map(client => (
                      <option key={client.id} value={client.id}>{client.business_name} ({client.status})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Override Data (JSON)</label>
                  <textarea
                    value={overrideData}
                    onChange={(e) => setOverrideData(e.target.value)}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white h-32"
                    placeholder='{"example": "data"}'
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Reason (required)</label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                    placeholder="Explain why this override is necessary..."
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emergency"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="emergency" className="text-sm text-slate-300">
                    This is an emergency override
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium"
                  >
                    Execute Override
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowOverrideForm(false); resetOverrideForm() }}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}