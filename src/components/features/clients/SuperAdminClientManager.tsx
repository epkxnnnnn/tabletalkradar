'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { useSimpleAgency as useAgency } from '../../providers/SimpleAgencyProvider'
import { supabase } from '@/lib/supabase'
import { businessCategories } from '@/lib/business-types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ClientDashboard from './ClientDashboard'

interface Client {
  id: string
  business_name: string
  website: string | null
  contact_email: string | null
  contact_phone: string | null
  category: string
  industry: string
  business_type: string | null
  target_market: string | null
  business_size: string
  location_type: string
  notes: string | null
  created_at: string
  updated_at: string
  user_id: string
  agency_id: string | null
  status: string
  // Agency info
  agency_name?: string
  owner_email?: string
}

interface AgencyUser {
  id: string
  email: string
  role: string
  created_at: string
}

export default function SuperAdminClientManager() {
  const { user, profile } = useAuth()
  const { currentAgency, membership } = useAgency()
  const [clients, setClients] = useState<Client[]>([])
  const [agencyUsers, setAgencyUsers] = useState<AgencyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [activeClientTab, setActiveClientTab] = useState<string>('')
  const [viewMode, setViewMode] = useState<'tabs' | 'grid'>('tabs')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAgency, setFilterAgency] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [formData, setFormData] = useState({
    business_name: '',
    website: '',
    address: '',
    phone: '',
    category: '',
    industry: 'other',
    business_type: '',
    target_market: 'local',
    business_size: 'small',
    location_type: 'local',
    owner_email: '',
    status: 'active'
  })

  const isSuperAdmin = profile?.role === 'superadmin' || user?.email === 'kphstk@gmail.com'
  const isAgencyOwner = membership?.role === 'owner'
  const hasFullAccess = isSuperAdmin || isAgencyOwner

  useEffect(() => {
    if (user && hasFullAccess) {
      loadAllClientsAndUsers()
    }
  }, [user, hasFullAccess, currentAgency])

  useEffect(() => {
    if (clients.length > 0 && !activeClientTab) {
      setActiveClientTab(clients[0].id)
    }
  }, [clients, activeClientTab])

  const loadAllClientsAndUsers = async () => {
    setLoading(true)
    try {
      // Load ALL clients for super admin, or agency clients for agency owner
      let clientQuery = supabase
        .from('clients')
        .select(`
          *,
          agencies(name),
          profiles!clients_user_id_fkey(email)
        `)
        .order('created_at', { ascending: false })

      // If agency owner (not super admin), filter by agency
      if (isAgencyOwner && !isSuperAdmin && currentAgency) {
        clientQuery = clientQuery.eq('agency_id', currentAgency.id)
      }

      const { data: clientData, error: clientError } = await clientQuery

      if (clientError) throw clientError

      // Transform the data to include agency and owner info
      const transformedClients = (clientData || []).map(client => ({
        ...client,
        agency_name: client.agencies?.name || 'No Agency',
        owner_email: client.profiles?.email || 'Unknown'
      }))

      setClients(transformedClients)

      // Load agency users for assignment
      if (currentAgency) {
        const { data: userData, error: userError } = await supabase
          .from('agency_memberships')
          .select(`
            user_id,
            role,
            profiles(id, email, created_at)
          `)
          .eq('agency_id', currentAgency.id)
          .eq('status', 'active')

        if (!userError && userData) {
          const users = userData.map(membership => ({
            id: membership.profiles.id,
            email: membership.profiles.email,
            role: membership.role,
            created_at: membership.profiles.created_at
          }))
          setAgencyUsers(users)
        }
      }

    } catch (error) {
      console.error('Error loading clients and users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      // Find the user to assign as owner
      let assignedUserId = user.id
      if (formData.owner_email) {
        const targetUser = agencyUsers.find(u => u.email === formData.owner_email)
        if (targetUser) {
          assignedUserId = targetUser.id
        }
      }

      const { data, error } = await supabase
        .from('clients')
        .insert({
          business_name: formData.business_name,
          website: formData.website || null,
          contact_email: formData.owner_email || null,
          contact_phone: formData.phone || null,
          category: formData.category,
          industry: formData.industry,
          business_type: formData.business_type || null,
          target_market: formData.target_market || 'local',
          business_size: formData.business_size || 'small',
          location_type: formData.location_type || 'local',
          user_id: assignedUserId,
          agency_id: currentAgency?.id || null,
          status: formData.status,
          notes: `Created by ${isSuperAdmin ? 'Super Admin' : 'Agency Owner'}: ${user.email}`
        })
        .select()
        .single()

      if (error) throw error

      resetForm()
      setShowAddForm(false)
      loadAllClientsAndUsers()
      
      if (data) {
        setActiveClientTab(data.id)
      }
    } catch (error) {
      console.error('Error adding client:', error)
    }
  }

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient) return

    try {
      // Find the user to assign as owner
      let assignedUserId = selectedClient.user_id
      if (formData.owner_email) {
        const targetUser = agencyUsers.find(u => u.email === formData.owner_email)
        if (targetUser) {
          assignedUserId = targetUser.id
        }
      }

      const { error } = await supabase
        .from('clients')
        .update({
          business_name: formData.business_name,
          website: formData.website || null,
          contact_email: formData.owner_email || null,
          contact_phone: formData.phone || null,
          category: formData.category,
          industry: formData.industry,
          business_type: formData.business_type || null,
          target_market: formData.target_market || 'local',
          business_size: formData.business_size || 'small',
          location_type: formData.location_type || 'local',
          user_id: assignedUserId,
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedClient.id)

      if (error) throw error

      setSelectedClient(null)
      resetForm()
      loadAllClientsAndUsers()
    } catch (error) {
      console.error('Error updating client:', error)
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) throw error
      
      if (clientId === activeClientTab) {
        const remainingClients = clients.filter(c => c.id !== clientId)
        if (remainingClients.length > 0) {
          setActiveClientTab(remainingClients[0].id)
        } else {
          setActiveClientTab('')
        }
      }
      
      loadAllClientsAndUsers()
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const handleReassignClient = async (clientId: string, newOwnerEmail: string) => {
    const targetUser = agencyUsers.find(u => u.email === newOwnerEmail)
    if (!targetUser) return

    try {
      const { error } = await supabase
        .from('clients')
        .update({ 
          user_id: targetUser.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)

      if (error) throw error
      loadAllClientsAndUsers()
    } catch (error) {
      console.error('Error reassigning client:', error)
    }
  }

  const editClient = (client: Client) => {
    setSelectedClient(client)
    setFormData({
      business_name: client.business_name,
      website: client.website || '',
      address: '',
      phone: client.contact_phone || '',
      category: client.category,
      industry: client.industry || 'other',
      business_type: client.business_type || '',
      target_market: client.target_market || 'local',
      business_size: client.business_size || 'small',
      location_type: client.location_type || 'local',
      owner_email: client.owner_email || '',
      status: client.status || 'active'
    })
  }

  const resetForm = () => {
    setFormData({
      business_name: '',
      website: '',
      address: '',
      phone: '',
      category: '',
      industry: 'other',
      business_type: '',
      target_market: 'local',
      business_size: 'small',
      location_type: 'local',
      owner_email: '',
      status: 'active'
    })
  }

  // Filter clients based on search and filters
  const filteredClients = clients.filter(client => {
    const matchesSearch = searchTerm === '' || 
      client.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.owner_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.industry.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesAgency = filterAgency === '' || client.agency_name === filterAgency
    const matchesStatus = filterStatus === '' || client.status === filterStatus
    
    return matchesSearch && matchesAgency && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading all clients...</div>
      </div>
    )
  }

  if (!hasFullAccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-slate-400">You need super admin or agency owner privileges to access this section.</p>
        </div>
      </div>
    )
  }

  if (filteredClients.length === 0 && !showAddForm) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {isSuperAdmin ? 'Super Admin' : 'Agency Owner'} - Client Management
              </h1>
              <p className="text-slate-400">
                {isSuperAdmin ? 'Manage all clients across all agencies' : 'Manage all clients in your agency'}
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
              Add New Client
            </button>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-12 text-center">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="text-lg font-medium text-white mb-2">No Clients Found</h3>
            <p className="text-slate-400 mb-4">
              {searchTerm || filterAgency || filterStatus 
                ? 'No clients match your current filters.' 
                : 'Get started by adding your first client.'
              }
            </p>
            {(!searchTerm && !filterAgency && !filterStatus) && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md"
              >
                Add First Client
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isSuperAdmin ? 'Super Admin' : 'Agency Owner'} - Client Management
            </h1>
            <p className="text-slate-400">
              Full access to {isSuperAdmin ? 'all clients across all agencies' : 'all clients in your agency'} • {filteredClients.length} clients
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('tabs')}
                className={`px-3 py-1 text-sm rounded ${viewMode === 'tabs' ? 'bg-red-600 text-white' : 'text-slate-300'}`}
              >
                Tabs
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-sm rounded ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-slate-300'}`}
              >
                Grid
              </button>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
              Add New Client
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search clients, owners, industries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
          />
          <select
            value={filterAgency}
            onChange={(e) => setFilterAgency(e.target.value)}
            className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
          >
            <option value="">All Agencies</option>
            {Array.from(new Set(clients.map(c => c.agency_name))).map(agency => (
              <option key={agency} value={agency}>{agency}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="prospect">Prospect</option>
            <option value="suspended">Suspended</option>
          </select>
          <button
            onClick={loadAllClientsAndUsers}
            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'tabs' ? (
        <div className="bg-slate-800 border-b border-slate-700">
          <div className="px-6">
            <Tabs value={activeClientTab} onValueChange={setActiveClientTab} className="w-full">
              <TabsList className="h-auto bg-transparent border-none p-0 space-x-0 justify-start overflow-x-auto">
                {filteredClients.map((client) => (
                  <TabsTrigger 
                    key={client.id} 
                    value={client.id}
                    className="
                      relative px-6 py-4 text-sm font-medium border-b-2 bg-transparent min-w-0 flex-shrink-0
                      data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-red-600
                      data-[state=inactive]:text-slate-400 data-[state=inactive]:border-transparent
                      hover:text-slate-300 hover:border-slate-600 transition-colors
                      shadow-none
                    "
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        client.status === 'active' ? 'bg-green-500' :
                        client.status === 'inactive' ? 'bg-yellow-500' :
                        client.status === 'suspended' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}></span>
                      <div className="text-left min-w-0">
                        <div className="font-medium truncate">{client.business_name}</div>
                        <div className="text-xs text-slate-500 truncate">{client.category} • {client.agency_name}</div>
                        <div className="text-xs text-slate-500 truncate">{client.owner_email}</div>
                      </div>
                      <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
                        <select
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleReassignClient(client.id, e.target.value)}
                          value=""
                          className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded border-none"
                          title="Reassign client"
                        >
                          <option value="">Reassign</option>
                          {agencyUsers.map(user => (
                            <option key={user.id} value={user.email}>{user.email}</option>
                          ))}
                        </select>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            editClient(client)
                          }}
                          className="text-slate-500 hover:text-blue-400 p-1 text-xs"
                          title="Edit client"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClient(client.id)
                          }}
                          className="text-slate-500 hover:text-red-400 p-1 text-xs"
                          title="Delete client"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {/* Client Tab Content */}
              {filteredClients.map((client) => (
                <TabsContent key={client.id} value={client.id} className="mt-0">
                  <div className="p-6">
                    <div className="bg-slate-800 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-xl font-semibold text-white">{client.business_name}</h2>
                          <p className="text-slate-400">
                            Owner: {client.owner_email} • Agency: {client.agency_name} • Status: {client.status}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            client.status === 'active' ? 'bg-green-900/20 text-green-400' :
                            client.status === 'inactive' ? 'bg-yellow-900/20 text-yellow-400' :
                            client.status === 'suspended' ? 'bg-red-900/20 text-red-400' :
                            'bg-gray-900/20 text-gray-400'
                          }`}>
                            {client.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ClientDashboard />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      ) : (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <div key={client.id} className="bg-slate-800 rounded-lg p-6 hover:bg-slate-750 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{client.business_name}</h3>
                    <p className="text-slate-400 text-sm">{client.category}</p>
                    <p className="text-slate-500 text-xs">Owner: {client.owner_email}</p>
                    <p className="text-slate-500 text-xs">Agency: {client.agency_name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    client.status === 'active' ? 'bg-green-900/20 text-green-400' :
                    client.status === 'inactive' ? 'bg-yellow-900/20 text-yellow-400' :
                    client.status === 'suspended' ? 'bg-red-900/20 text-red-400' :
                    'bg-gray-900/20 text-gray-400'
                  }`}>
                    {client.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editClient(client)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Client Modals */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Add New Client</h3>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Owner Email</label>
                  <select
                    value={formData.owner_email}
                    onChange={(e) => setFormData({...formData, owner_email: e.target.value})}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                    required
                  >
                    <option value="">Select Owner</option>
                    {agencyUsers.map(user => (
                      <option key={user.id} value={user.email}>{user.email} ({user.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Industry</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => {
                      const industry = e.target.value
                      setFormData({
                        ...formData, 
                        industry,
                        category: ''
                      })
                    }}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                    required
                  >
                    {Object.entries(businessCategories).map(([key, config]) => (
                      <option key={key} value={key}>{config.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Business Type</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                    required
                  >
                    <option value="">Select Business Type</option>
                    {businessCategories[formData.industry as keyof typeof businessCategories]?.categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="prospect">Prospect</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Target Market</label>
                  <select
                    value={formData.target_market}
                    onChange={(e) => setFormData({...formData, target_market: e.target.value})}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                  >
                    <option value="local">Local Market</option>
                    <option value="regional">Regional Market</option>
                    <option value="national">National Market</option>
                    <option value="international">International Market</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
                >
                  Add Client
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); resetForm() }}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Client: {selectedClient.business_name}</h3>
            <form onSubmit={handleUpdateClient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Owner Email</label>
                  <select
                    value={formData.owner_email}
                    onChange={(e) => setFormData({...formData, owner_email: e.target.value})}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                    required
                  >
                    <option value="">Select Owner</option>
                    {agencyUsers.map(user => (
                      <option key={user.id} value={user.email}>{user.email} ({user.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Industry</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => {
                      const industry = e.target.value
                      setFormData({
                        ...formData, 
                        industry,
                        category: ''
                      })
                    }}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                    required
                  >
                    {Object.entries(businessCategories).map(([key, config]) => (
                      <option key={key} value={key}>{config.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Business Type</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                    required
                  >
                    <option value="">Select Business Type</option>
                    {businessCategories[formData.industry as keyof typeof businessCategories]?.categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="prospect">Prospect</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Target Market</label>
                  <select
                    value={formData.target_market}
                    onChange={(e) => setFormData({...formData, target_market: e.target.value})}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                  >
                    <option value="local">Local Market</option>
                    <option value="regional">Regional Market</option>
                    <option value="national">National Market</option>
                    <option value="international">International Market</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
                >
                  Update Client
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedClient(null); resetForm() }}
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
  )
}