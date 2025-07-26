'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ClientCard } from './ClientCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ClientData {
  id: string
  slug: string
  business_name: string
  industry?: string
  location?: string
  website?: string
  status?: string
  client_tier?: string
  performance_change?: number
  last_audit_date?: string
}

export function AgencyClientList() {
  const [clients, setClients] = useState<ClientData[]>([])
  const [filteredClients, setFilteredClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')
  const [isAgencySuperAdmin, setIsAgencySuperAdmin] = useState(false)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    filterClients()
  }, [clients, searchTerm, statusFilter, tierFilter])

  const loadClients = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if user is agency superadmin
      const { data: membership } = await supabase
        .from('agency_memberships')
        .select('agency_id, role')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin'])
        .eq('status', 'active')
        .single()

      if (!membership) {
        setLoading(false)
        return
      }

      setIsAgencySuperAdmin(true)

      // Load all agency clients
      const { data: agencyClients, error } = await supabase
        .from('clients')
        .select(`
          *,
          audits (
            id,
            created_at
          )
        `)
        .eq('agency_id', membership.agency_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const clientsWithMetrics = (agencyClients || []).map((client: any) => {
        // Get last audit date
        const lastAudit = client.audits?.[0]
        
        return {
          id: client.id,
          slug: client.slug || client.id,
          business_name: client.business_name,
          industry: client.industry,
          location: client.location,
          website: client.website,
          status: client.status || 'active',
          client_tier: client.client_tier,
          performance_change: Math.floor(Math.random() * 40) - 10, // Mock data for now
          last_audit_date: lastAudit?.created_at
        }
      })

      setClients(clientsWithMetrics)
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterClients = () => {
    let filtered = clients

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter)
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(client => client.client_tier === tierFilter)
    }

    setFilteredClients(filtered)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agency Clients</h2>
          <p className="text-muted-foreground">
            Manage and monitor all your clients from one place
          </p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="churned">Churned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client Grid */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' || tierFilter !== 'all'
              ? 'No clients found matching your filters'
              : 'No clients yet. Add your first client to get started!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              isAgencySuperAdmin={isAgencySuperAdmin}
            />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border">
          <p className="text-sm text-muted-foreground">Total Clients</p>
          <p className="text-2xl font-bold">{clients.length}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <p className="text-sm text-muted-foreground">Active Clients</p>
          <p className="text-2xl font-bold">
            {clients.filter(c => c.status === 'active').length}
          </p>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <p className="text-sm text-muted-foreground">Premium/Enterprise</p>
          <p className="text-2xl font-bold">
            {clients.filter(c => c.client_tier === 'premium' || c.client_tier === 'enterprise').length}
          </p>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <p className="text-sm text-muted-foreground">Avg Performance</p>
          <p className="text-2xl font-bold">
            {clients.length > 0 
              ? `${(clients.reduce((acc, c) => acc + (c.performance_change || 0), 0) / clients.length).toFixed(1)}%`
              : '0%'
            }
          </p>
        </div>
      </div>
    </div>
  )
}