'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { businessCategories } from '@/lib/business-types'

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

export default function ClientManager() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
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
      const { error } = await supabase
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Client Management</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
        >
          Add New Client
        </button>
      </div>

      {showAddForm && (
        <div className="bg-slate-800 p-6 rounded-lg">
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
                      category: '' // Reset category when industry changes
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
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                Add Client
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedClient && (
        <div className="bg-slate-800 p-6 rounded-lg">
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
                      category: '' // Reset category when industry changes
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
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                Update Client
              </button>
              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center text-slate-400">Loading clients...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div key={client.id} className="bg-slate-800 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-white">{client.business_name}</h3>
                <span className="px-2 py-1 text-xs rounded-full bg-green-600 text-white">
                  Active
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-1">{client.category}</p>
              <p className="text-slate-500 text-xs mb-2">
                {businessCategories[client.industry as keyof typeof businessCategories]?.name || 'Other'} • {client.target_market || 'Local'} Market
              </p>
              {client.website && (
                <p className="text-slate-400 text-sm mb-1">🌐 {client.website}</p>
              )}
              {client.contact_phone && (
                <p className="text-slate-400 text-sm mb-1">📞 {client.contact_phone}</p>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => editClient(client)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
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
      )}
    </div>
  )
} 