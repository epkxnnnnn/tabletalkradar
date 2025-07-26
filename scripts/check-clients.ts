#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkClients() {
  console.log('🔍 Checking client data in Supabase...\n')

  try {
    // 1. Get total client count
    const { count: totalClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Total clients: ${totalClients}\n`)

    // 2. Get all clients with details
    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        *,
        agencies (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching clients:', error)
      return
    }

    // 3. Analyze the data
    const clientsWithSlugs = clients.filter(c => c.slug)
    const clientsWithoutSlugs = clients.filter(c => !c.slug)
    const clientsWithAgencies = clients.filter(c => c.agency_id)
    const activeClients = clients.filter(c => c.status === 'active')

    console.log('📈 Client Analysis:')
    console.log(`- Clients with slugs: ${clientsWithSlugs.length}`)
    console.log(`- Clients without slugs: ${clientsWithoutSlugs.length}`)
    console.log(`- Clients linked to agencies: ${clientsWithAgencies.length}`)
    console.log(`- Active clients: ${activeClients.length}\n`)

    // 4. Show clients without slugs
    if (clientsWithoutSlugs.length > 0) {
      console.log('⚠️  Clients missing slugs (need migration):')
      clientsWithoutSlugs.forEach(c => {
        console.log(`   - ${c.business_name} (ID: ${c.id})`)
      })
      console.log()
    }

    // 5. Show all clients
    console.log('📋 All Clients:')
    console.log('─'.repeat(80))
    
    clients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.business_name}`)
      console.log(`   ID: ${client.id}`)
      console.log(`   Slug: ${client.slug || '❌ MISSING'}`)
      console.log(`   Status: ${client.status}`)
      console.log(`   Tier: ${client.client_tier || 'Not set'}`)
      console.log(`   Agency: ${client.agencies?.name || 'No agency linked'}`)
      console.log(`   Owner ID: ${client.owner_id}`)
      console.log(`   Created: ${new Date(client.created_at).toLocaleDateString()}`)
      console.log('─'.repeat(80))
    })

    // 6. Check client users
    const { data: clientUsers, error: usersError } = await supabase
      .from('client_users')
      .select(`
        *,
        clients (
          business_name
        )
      `)

    if (!usersError && clientUsers) {
      console.log(`\n👥 Client Users: ${clientUsers.length} total`)
      const activeUsers = clientUsers.filter(u => u.is_active)
      console.log(`   - Active: ${activeUsers.length}`)
      console.log(`   - Inactive: ${clientUsers.length - activeUsers.length}`)
    }

    // 7. Check locations
    const { count: locationsCount } = await supabase
      .from('client_locations')
      .select('*', { count: 'exact', head: true })

    console.log(`\n📍 Client Locations: ${locationsCount || 0} total`)

    // 8. Summary
    console.log('\n✅ Summary:')
    console.log(`- Total Clients: ${totalClients}`)
    console.log(`- Need Slug Migration: ${clientsWithoutSlugs.length}`)
    console.log(`- Properly Linked to Agencies: ${clientsWithAgencies.length}`)
    console.log(`- Active Status: ${activeClients.length}`)
    
    if (clientsWithoutSlugs.length > 0) {
      console.log('\n💡 Action Required:')
      console.log('1. Run migration 013 to add slug field')
      console.log('2. Call POST /api/v1/admin/generate-client-slugs to generate slugs')
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

checkClients()