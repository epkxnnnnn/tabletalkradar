'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useToast } from '../../ui/Toast'
import LoadingSpinner from '../../ui/LoadingSpinner'
import Tooltip from '../../ui/Tooltip'

interface TeamMember {
  id: string
  user_id: string
  agency_id: string
  full_name: string
  email: string
  role: 'admin' | 'manager' | 'analyst' | 'viewer'
  permissions: string[]
  is_active: boolean
  joined_at: string
  last_active: string | null
}

interface Communication {
  id: string
  team_member_id: string
  client_id: string
  type: 'email' | 'call' | 'meeting' | 'note'
  subject: string
  content: string
  created_at: string
  status: 'sent' | 'scheduled' | 'draft'
}

interface PerformanceMetric {
  id: string
  team_member_id: string
  metric_type: 'audits_completed' | 'clients_managed' | 'reports_generated' | 'response_time'
  value: number
  target: number
  period: 'daily' | 'weekly' | 'monthly'
  created_at: string
}

export default function TeamManagement() {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [communications, setCommunications] = useState<Communication[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('members')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteData, setInviteData] = useState({
    email: '',
    full_name: '',
    role: 'analyst' as TeamMember['role']
  })

  useEffect(() => {
    if (user) {
      loadTeamData()
    }
  }, [user])

  const loadTeamData = async () => {
    try {
      // Load team members
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('agency_id', user?.id)
        .order('created_at', { ascending: false })

      if (membersError) throw membersError

      // Load communications
      const { data: comms, error: commsError } = await supabase
        .from('communications')
        .select('*')
        .eq('agency_id', user?.id)
        .order('created_at', { ascending: false })

      if (commsError) throw commsError

      // Load performance metrics
      const { data: metrics, error: metricsError } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('agency_id', user?.id)
        .order('created_at', { ascending: false })

      if (metricsError) throw metricsError

      setTeamMembers(members || [])
      setCommunications(comms || [])
      setPerformanceMetrics(metrics || [])
    } catch (error) {
      console.error('Error loading team data:', error)
      showError('Failed to load team data')
    } finally {
      setLoading(false)
    }
  }

  const inviteTeamMember = async () => {
    if (!inviteData.email || !inviteData.full_name) {
      showError('Please fill in all required fields')
      return
    }

    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          agency_id: user?.id,
          email: inviteData.email,
          full_name: inviteData.full_name,
          role: inviteData.role,
          permissions: getPermissionsForRole(inviteData.role),
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      setTeamMembers(prev => [...prev, data])
      setInviteData({ email: '', full_name: '', role: 'analyst' })
      setShowInviteModal(false)
      showSuccess('Team member invited successfully!')
    } catch (error) {
      console.error('Error inviting team member:', error)
      showError('Failed to invite team member')
    }
  }

  const updateTeamMemberRole = async (memberId: string, newRole: TeamMember['role']) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          role: newRole,
          permissions: getPermissionsForRole(newRole)
        })
        .eq('id', memberId)

      if (error) throw error

      setTeamMembers(prev => prev.map(member =>
        member.id === memberId
          ? { ...member, role: newRole, permissions: getPermissionsForRole(newRole) }
          : member
      ))
      showSuccess('Team member role updated!')
    } catch (error) {
      console.error('Error updating team member role:', error)
      showError('Failed to update team member role')
    }
  }

  const deactivateTeamMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: false })
        .eq('id', memberId)

      if (error) throw error

      setTeamMembers(prev => prev.map(member =>
        member.id === memberId
          ? { ...member, is_active: false }
          : member
      ))
      showSuccess('Team member deactivated!')
    } catch (error) {
      console.error('Error deactivating team member:', error)
      showError('Failed to deactivate team member')
    }
  }

  const getPermissionsForRole = (role: TeamMember['role']): string[] => {
    switch (role) {
      case 'admin':
        return ['read', 'write', 'delete', 'invite', 'manage_team']
      case 'manager':
        return ['read', 'write', 'invite']
      case 'analyst':
        return ['read', 'write']
      case 'viewer':
        return ['read']
      default:
        return ['read']
    }
  }

  const getRoleColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'admin': return 'bg-red-600'
      case 'manager': return 'bg-blue-600'
      case 'analyst': return 'bg-green-600'
      case 'viewer': return 'bg-slate-600'
      default: return 'bg-slate-600'
    }
  }

  const getCommunicationIcon = (type: Communication['type']) => {
    switch (type) {
      case 'email': return '📧'
      case 'call': return '📞'
      case 'meeting': return '🤝'
      case 'note': return '📝'
      default: return '📄'
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading team data..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Management</h2>
          <p className="text-slate-400">Manage your team members, communications, and performance</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          Invite Team Member
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg">
        {[
          { id: 'members', label: 'Team Members' },
          { id: 'communications', label: 'Communications' },
          { id: 'performance', label: 'Performance' }
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

      {/* Team Members */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-white font-medium">{member.full_name}</h3>
                    <p className="text-slate-400 text-sm">{member.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full text-white ${getRoleColor(member.role)}`}>
                    {member.role}
                  </span>
                </div>
                
                <div className="space-y-2 mb-3">
                  <p className="text-slate-400 text-xs">
                    Joined: {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                  <p className="text-slate-400 text-xs">
                    Last active: {member.last_active ? new Date(member.last_active).toLocaleDateString() : 'Never'}
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Tooltip content="Change team member role">
                    <select
                      value={member.role}
                      onChange={(e) => updateTeamMemberRole(member.id, e.target.value as TeamMember['role'])}
                      className="bg-slate-700 text-white px-2 py-1 rounded text-xs"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="analyst">Analyst</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </Tooltip>
                  {member.is_active && (
                    <Tooltip content="Deactivate team member">
                      <button
                        onClick={() => deactivateTeamMember(member.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Deactivate
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Communications */}
      {activeTab === 'communications' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {communications.map((comm) => (
              <div key={comm.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{getCommunicationIcon(comm.type)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-white font-medium">{comm.subject}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        comm.status === 'sent' ? 'bg-green-600 text-white' :
                        comm.status === 'scheduled' ? 'bg-yellow-600 text-white' :
                        'bg-slate-600 text-white'
                      }`}>
                        {comm.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">{comm.content}</p>
                    <p className="text-slate-500 text-xs mt-2">
                      {new Date(comm.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {communications.length === 0 && (
              <p className="text-slate-400 text-center py-8">No communications yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Performance */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {performanceMetrics.filter(m => m.metric_type === 'audits_completed').reduce((sum, m) => sum + m.value, 0)}
              </div>
              <div className="text-slate-400 text-sm">Total Audits</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {performanceMetrics.filter(m => m.metric_type === 'clients_managed').reduce((sum, m) => sum + m.value, 0)}
              </div>
              <div className="text-slate-400 text-sm">Clients Managed</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {performanceMetrics.filter(m => m.metric_type === 'reports_generated').reduce((sum, m) => sum + m.value, 0)}
              </div>
              <div className="text-slate-400 text-sm">Reports Generated</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {Math.round(performanceMetrics.filter(m => m.metric_type === 'response_time').reduce((sum, m) => sum + m.value, 0) / 
                  Math.max(performanceMetrics.filter(m => m.metric_type === 'response_time').length, 1))}h
              </div>
              <div className="text-slate-400 text-sm">Avg Response Time</div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Performance by Team Member</h3>
            <div className="space-y-4">
              {teamMembers.map((member) => {
                const memberMetrics = performanceMetrics.filter(m => m.team_member_id === member.id)
                const totalAudits = memberMetrics.filter(m => m.metric_type === 'audits_completed').reduce((sum, m) => sum + m.value, 0)
                const totalClients = memberMetrics.filter(m => m.metric_type === 'clients_managed').reduce((sum, m) => sum + m.value, 0)
                
                return (
                  <div key={member.id} className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium">{member.full_name}</h4>
                      <p className="text-slate-400 text-sm">{member.role}</p>
                    </div>
                    <div className="flex space-x-4 text-sm">
                      <div>
                        <span className="text-slate-400">Audits:</span>
                        <span className="text-white ml-1">{totalAudits}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Clients:</span>
                        <span className="text-white ml-1">{totalClients}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Invite Team Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={inviteData.full_name}
                  onChange={(e) => setInviteData({...inviteData, full_name: e.target.value})}
                  className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                  className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({...inviteData, role: e.target.value as TeamMember['role']})}
                  className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                >
                  <option value="analyst">Analyst</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={inviteTeamMember}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                >
                  Send Invite
                </button>
                <button
                  onClick={() => setShowInviteModal(false)}
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