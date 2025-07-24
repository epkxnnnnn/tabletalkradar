'use client'

import React, { useState, useEffect } from 'react'
import { useAgency } from '../../providers/AgencyProvider'
import { useAuth } from '../../providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { AgencyMembership, AgencyRole, AgencyPermissions, InviteMemberInput } from '@/lib/types/agency'

interface TeamMember extends AgencyMembership {
  user?: {
    id: string
    full_name?: string
    email?: string
    avatar_url?: string
  }
  invited_by_name?: string
}

export default function TeamManagementAgency() {
  const { currentAgency, membership, permissions, hasPermission, inviteMember } = useAgency()
  const { user } = useAuth()
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteForm, setInviteForm] = useState<InviteMemberInput>({
    email: '',
    role: 'analyst',
    message: ''
  })

  const roleHierarchy: { [key: string]: number } = {
    'owner': 5,
    'admin': 4,
    'manager': 3,
    'client_manager': 2,
    'analyst': 1
  }

  const roleDescriptions: { [key in AgencyRole]: { name: string; description: string; capabilities: string[] } } = {
    owner: {
      name: 'Owner',
      description: 'Full control over agency settings, billing, and all team members',
      capabilities: ['All permissions', 'Manage billing', 'Delete agency', 'Manage owners/admins']
    },
    admin: {
      name: 'Administrator', 
      description: 'Manage team, clients, and agency operations',
      capabilities: ['Manage team members', 'Client management', 'View all data', 'Agency settings']
    },
    manager: {
      name: 'Manager',
      description: 'Oversee client portfolios and team performance',
      capabilities: ['Manage assigned clients', 'View team performance', 'Generate reports']
    },
    client_manager: {
      name: 'Client Manager',
      description: 'Direct client relationship management and account oversight',
      capabilities: ['Manage assigned clients', 'Client communication', 'Run audits']
    },
    analyst: {
      name: 'Analyst',
      description: 'Execute audits and generate reports for assigned clients',
      capabilities: ['Run audits', 'Generate reports', 'View assigned clients']
    }
  }

  useEffect(() => {
    loadTeamMembers()
  }, [currentAgency])

  const loadTeamMembers = async () => {
    if (!currentAgency) return

    setLoading(true)
    try {
      const { data: memberships, error } = await supabase
        .from('agency_memberships')
        .select(`
          *,
          user:profiles(id, full_name, email, avatar_url),
          invited_by_profile:profiles!agency_memberships_invited_by_fkey(full_name, email)
        `)
        .eq('agency_id', currentAgency.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading team members:', error)
        return
      }

      const formattedMembers = memberships?.map(member => ({
        ...member,
        invited_by_name: member.invited_by_profile?.full_name || member.invited_by_profile?.email
      })) || []

      setTeamMembers(formattedMembers)
    } catch (error) {
      console.error('Error loading team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async () => {
    if (!currentAgency || !inviteForm.email) return

    setInviteLoading(true)
    try {
      await inviteMember(inviteForm.email, inviteForm.role)
      
      // Refresh team list
      await loadTeamMembers()
      
      // Show success message
      alert(`Invitation sent successfully to ${inviteForm.email}! They will receive an email with instructions to join the team.`)
      
      // Reset form and close modal
      setInviteForm({ email: '', role: 'analyst', message: '' })
      setShowInviteModal(false)
      
    } catch (error) {
      console.error('Error inviting member:', error)
      alert('Failed to invite team member. Please try again.')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: AgencyRole) => {
    try {
      const { error } = await supabase
        .from('agency_memberships')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error

      await loadTeamMembers()
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Failed to update member role. Please try again.')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      const { error } = await supabase
        .from('agency_memberships')
        .update({ status: 'removed' })
        .eq('id', memberId)

      if (error) throw error

      await loadTeamMembers()
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Failed to remove team member. Please try again.')
    }
  }

  const canManageRole = (targetRole: AgencyRole): boolean => {
    if (!membership?.role) return false
    const userLevel = roleHierarchy[membership.role] || 0
    const targetLevel = roleHierarchy[targetRole] || 0
    return userLevel > targetLevel
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-900/20 text-green-400 rounded-full text-xs">Active</span>
      case 'invited':
        return <span className="px-2 py-1 bg-yellow-900/20 text-yellow-400 rounded-full text-xs">Pending</span>
      case 'suspended':
        return <span className="px-2 py-1 bg-red-900/20 text-red-400 rounded-full text-xs">Suspended</span>
      default:
        return <span className="px-2 py-1 bg-slate-700 text-slate-400 rounded-full text-xs">{status}</span>
    }
  }

  const getRoleBadge = (role: AgencyRole) => {
    const colors = {
      owner: 'bg-purple-900/20 text-purple-400',
      admin: 'bg-red-900/20 text-red-400', 
      manager: 'bg-blue-900/20 text-blue-400',
      client_manager: 'bg-green-900/20 text-green-400',
      analyst: 'bg-slate-700 text-slate-300'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[role]}`}>
        {roleDescriptions[role].name}
      </span>
    )
  }

  if (!hasPermission('can_manage_roles')) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <div className="text-slate-400 mb-4">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No Permission</h3>
        <p className="text-slate-400">You don&apos;t have permission to manage team members.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Management</h2>
          <p className="text-slate-400">Manage your agency team members and their permissions</p>
        </div>
        {hasPermission('can_invite_members') && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Invite Team Member
          </button>
        )}
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{teamMembers.filter(m => m.status === 'active').length}</div>
          <div className="text-sm text-slate-400">Active Members</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-400">{teamMembers.filter(m => m.status === 'invited').length}</div>
          <div className="text-sm text-slate-400">Pending Invites</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-400">{teamMembers.filter(m => m.role === 'admin').length}</div>
          <div className="text-sm text-slate-400">Administrators</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-400">{teamMembers.filter(m => ['manager', 'client_manager'].includes(m.role)).length}</div>
          <div className="text-sm text-slate-400">Client Managers</div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Team Members</h3>
        
        {loading ? (
          <div className="text-center text-slate-400 py-8">Loading team members...</div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-medium mb-2">No Team Members Yet</h3>
            <p>Invite team members to collaborate on client management.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teamMembers.map(member => (
              <div key={member.id} className="bg-slate-700 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
                    {member.user?.avatar_url ? (
                      <img src={member.user.avatar_url} alt="" className="w-12 h-12 rounded-full" />
                    ) : (
                      <span className="text-white font-medium">
                        {member.user?.full_name?.charAt(0) || member.user?.email?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-white">
                        {member.user?.full_name || member.user?.email || 'Pending User'}
                      </h4>
                      {getStatusBadge(member.status)}
                      {getRoleBadge(member.role)}
                    </div>
                    <p className="text-slate-400 text-sm">{member.user?.email}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500">
                      <span>Joined {new Date(member.joined_at || member.created_at).toLocaleDateString()}</span>
                      {member.invited_by_name && (
                        <span>Invited by {member.invited_by_name}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Role Selector */}
                  {canManageRole(member.role) && member.user_id !== user?.id && (
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value as AgencyRole)}
                      className="bg-slate-600 text-white px-3 py-1 rounded text-sm border border-slate-500"
                    >
                      {Object.entries(roleDescriptions)
                        .filter(([role]) => canManageRole(role as AgencyRole))
                        .map(([role, desc]) => (
                          <option key={role} value={role}>{desc.name}</option>
                        ))}
                    </select>
                  )}

                  {/* Remove Button */}
                  {hasPermission('can_remove_members') && member.user_id !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-400 hover:text-red-300 p-2"
                      title="Remove member"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Descriptions */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(roleDescriptions).map(([role, desc]) => (
            <div key={role} className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                {getRoleBadge(role as AgencyRole)}
              </div>
              <p className="text-slate-300 text-sm mb-3">{desc.description}</p>
              <ul className="text-xs text-slate-400 space-y-1">
                {desc.capabilities.map((capability, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    {capability}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Invite Team Member</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="colleague@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Role *
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as AgencyRole }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {Object.entries(roleDescriptions)
                    .filter(([role]) => canManageRole(role as AgencyRole))
                    .map(([role, desc]) => (
                      <option key={role} value={role}>{desc.name}</option>
                    ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  {roleDescriptions[inviteForm.role].description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 h-20"
                  placeholder="Welcome to our team! Looking forward to working with you."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteMember}
                disabled={inviteLoading || !inviteForm.email}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {inviteLoading ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}