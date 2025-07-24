'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { businessCategories } from '@/lib/business-types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ClientDashboard from './ClientDashboard'
import { ClientProvider } from './ClientProvider'

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
}

export default function ClientManagerWithTabs() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [activeClientTab, setActiveClientTab] = useState<string>('')
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
    location_type: 'local'
  })

  useEffect(() => {
    if (user) {
      loadClients()
    }
  }, [user])

  useEffect(() => {
    // Set first client as active tab when clients load
    if (clients.length > 0 && !activeClientTab) {
      setActiveClientTab(clients[0].id)
    }
  }, [clients, activeClientTab])

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          business_name: formData.business_name,
          website: formData.website || null,
          contact_email: formData.website || null,
          contact_phone: formData.phone || null,
          category: formData.category,
          industry: formData.industry,
          business_type: formData.business_type || null,
          target_market: formData.target_market || 'local',
          business_size: formData.business_size || 'small',
          location_type: formData.location_type || 'local',
          user_id: user.id,
          notes: ''
        })
        .select()
        .single()

      if (error) throw error

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
        location_type: 'local'
      })
      setShowAddForm(false)
      loadClients()
      
      // Set new client as active tab
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
      const { error } = await supabase
        .from('clients')
        .update({
          business_name: formData.business_name,
          website: formData.website || null,
          contact_phone: formData.phone || null,
          category: formData.category,
          industry: formData.industry,
          business_type: formData.business_type || null,
          target_market: formData.target_market || 'local',
          business_size: formData.business_size || 'small',
          location_type: formData.location_type || 'local'
        })
        .eq('id', selectedClient.id)

      if (error) throw error

      setSelectedClient(null)
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
        location_type: 'local'
      })
      loadClients()
    } catch (error) {
      console.error('Error updating client:', error)
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) throw error
      
      // If deleting active tab, switch to first remaining client
      if (clientId === activeClientTab) {
        const remainingClients = clients.filter(c => c.id !== clientId)
        if (remainingClients.length > 0) {
          setActiveClientTab(remainingClients[0].id)
        } else {
          setActiveClientTab('')
        }
      }
      
      loadClients()
    } catch (error) {
      console.error('Error deleting client:', error)
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
      location_type: client.location_type || 'local'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading clients...</div>
      </div>
    )
  }

  if (clients.length === 0 && !showAddForm) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-white">Client Management</h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
              Add New Client
            </button>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-12 text-center">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="text-lg font-medium text-white mb-2">No Clients Yet</h3>
            <p className="text-slate-400 mb-4">Get started by adding your first client.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md"
            >
              Add First Client
            </button>
          </div>
        </div>
        
        {/* Add Client Modal */}
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
                    <label className="block text-sm font-medium text-slate-300 mb-2">Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
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
                    <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                    />
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
                    onClick={() => setShowAddForm(false)}
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

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Client Management</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
          >
            Add New Client
          </button>
        </div>
      </div>

      {/* Client Tabs */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="px-6">
          <Tabs value={activeClientTab} onValueChange={setActiveClientTab} className="w-full">
            <TabsList className="h-auto bg-transparent border-none p-0 space-x-0 justify-start">
              {clients.map((client) => (
                <TabsTrigger 
                  key={client.id} 
                  value={client.id}
                  className="
                    relative px-6 py-4 text-sm font-medium border-b-2 bg-transparent
                    data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-red-600
                    data-[state=inactive]:text-slate-400 data-[state=inactive]:border-transparent
                    hover:text-slate-300 hover:border-slate-600 transition-colors
                    shadow-none
                  "
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <div className="text-left">
                      <div className="font-medium">{client.business_name}</div>
                      <div className="text-xs text-slate-500">{client.category}</div>
                    </div>
                    <div className="flex items-center space-x-1 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          editClient(client)
                        }}
                        className="text-slate-500 hover:text-blue-400 p-1"
                        title="Edit client"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClient(client.id)
                        }}
                        className="text-slate-500 hover:text-red-400 p-1"
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
            {clients.map((client) => (
              <TabsContent key={client.id} value={client.id} className="mt-0">
                <div className="p-6">
                  <ClientDashboard />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Add Client Modal */}
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                  />
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
                  onClick={() => setShowAddForm(false)}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Client</h3>
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                  />
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
                  onClick={() => setSelectedClient(null)}
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