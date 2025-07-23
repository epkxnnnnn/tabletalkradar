'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthProvider'

interface Business {
  id: string
  name: string
  address: string
  phone: string
  website: string
  rating: number
  review_count: number
  status: 'active' | 'inactive'
  created_at: string
}

export default function BusinessManager() {
  const { user } = useAuth()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBusiness, setNewBusiness] = useState({
    name: '',
    address: '',
    phone: '',
    website: ''
  })

  useEffect(() => {
    loadBusinesses()
  }, [])

  const loadBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBusinesses(data || [])
    } catch (error) {
      console.error('Error loading businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert([{
          ...newBusiness,
          user_id: user?.id,
          status: 'active'
        }])
        .select()

      if (error) throw error
      
      setBusinesses([...businesses, ...(data || [])])
      setNewBusiness({ name: '', address: '', phone: '', website: '' })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding business:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading businesses...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Businesses</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Add Business
        </button>
      </div>

      {showAddForm && (
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Add New Business</h2>
          <form onSubmit={handleAddBusiness} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={newBusiness.name}
                onChange={(e) => setNewBusiness({...newBusiness, name: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Address
              </label>
              <input
                type="text"
                value={newBusiness.address}
                onChange={(e) => setNewBusiness({...newBusiness, address: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="text"
                value={newBusiness.phone}
                onChange={(e) => setNewBusiness({...newBusiness, phone: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                value={newBusiness.website}
                onChange={(e) => setNewBusiness({...newBusiness, website: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add Business
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businesses.map((business) => (
          <div key={business.id} className="bg-slate-800 p-6 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-white">{business.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                business.status === 'active' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-600 text-gray-300'
              }`}>
                {business.status}
              </span>
            </div>
            <div className="space-y-2 text-gray-300">
              <p className="text-sm">{business.address}</p>
              {business.phone && <p className="text-sm">{business.phone}</p>}
              {business.website && (
                <a 
                  href={business.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  {business.website}
                </a>
              )}
              <div className="flex items-center space-x-2 mt-3">
                <span className="text-yellow-400">⭐</span>
                <span className="text-sm">{business.rating || 'N/A'}</span>
                <span className="text-sm text-gray-400">
                  ({business.review_count || 0} reviews)
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {businesses.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-xl font-medium text-white mb-2">No businesses yet</h3>
          <p className="text-gray-400 mb-4">Add your first business to get started</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Add Your First Business
          </button>
        </div>
      )}
    </div>
  )
}