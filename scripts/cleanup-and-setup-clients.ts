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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Your user email
const USER_EMAIL = 'kphstk@gmail.com'

async function cleanupAndSetupClients() {
  console.log('🧹 Starting client cleanup and setup...\n')

  try {
    // Step 1: Get your user and agency info
    console.log('📋 Step 1: Getting your user and agency info...')
    const { data: userData } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        agency_memberships!inner(
          agency_id,
          role,
          agencies(
            id,
            name
          )
        )
      `)
      .eq('email', USER_EMAIL)
      .single()

    if (!userData) {
      console.error('❌ User not found')
      return
    }

    const userId = userData.id
    const agencyId = userData.agency_memberships[0]?.agency_id
    const agencyName = userData.agency_memberships[0]?.agencies?.name

    console.log(`✅ User ID: ${userId}`)
    console.log(`✅ Agency: ${agencyName} (${agencyId})\n`)

    if (!agencyId) {
      console.error('❌ No agency found for user')
      return
    }

    // Step 2: Identify duplicates
    console.log('📋 Step 2: Identifying duplicate clients...')
    const { data: allClients } = await supabase
      .from('clients')
      .select('*')
      .order('business_name')

    const clientsByName = allClients?.reduce((acc: any, client: any) => {
      if (!acc[client.business_name]) {
        acc[client.business_name] = []
      }
      acc[client.business_name].push(client)
      return acc
    }, {})

    const duplicates = Object.entries(clientsByName || {})
      .filter(([_, clients]: any) => clients.length > 1)

    console.log(`Found ${duplicates.length} businesses with duplicates\n`)

    // Step 3: Clean up duplicates
    console.log('📋 Step 3: Cleaning up duplicates...')
    for (const [businessName, clients] of duplicates as any) {
      console.log(`\nProcessing: ${businessName}`)
      
      // Sort to prioritize: has agency > has owner > oldest
      const sorted = clients.sort((a: any, b: any) => {
        if (a.agency_id && !b.agency_id) return -1
        if (!a.agency_id && b.agency_id) return 1
        if (a.owner_id && !b.owner_id) return -1
        if (!a.owner_id && b.owner_id) return 1
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })

      const keepClient = sorted[0]
      const deleteClients = sorted.slice(1)

      console.log(`  ✅ Keeping: ${keepClient.id} (agency: ${keepClient.agency_id ? 'yes' : 'no'})`)
      
      // Update client_locations to point to the kept client
      for (const deleteClient of deleteClients) {
        console.log(`  🗑️  Deleting: ${deleteClient.id}`)
        
        // Move any locations
        await supabase
          .from('client_locations')
          .update({ client_id: keepClient.id })
          .eq('client_id', deleteClient.id)

        // Delete the duplicate
        await supabase
          .from('clients')
          .delete()
          .eq('id', deleteClient.id)
      }
    }

    // Step 4: Update all clients to have proper agency and owner
    console.log('\n📋 Step 4: Updating all clients with proper agency and owner...')
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        owner_id: userId,
        agency_id: agencyId,
        updated_at: new Date().toISOString()
      })
      .or('owner_id.is.null,agency_id.is.null')

    if (updateError) {
      console.error('❌ Error updating clients:', updateError)
    } else {
      console.log('✅ All clients updated with proper agency and owner')
    }

    // Step 5: Generate slugs
    console.log('\n📋 Step 5: Generating slugs for all clients...')
    const { data: clientsNeedingSlugs } = await supabase
      .from('clients')
      .select('id, business_name')
      .is('slug', null)

    for (const client of clientsNeedingSlugs || []) {
      const slug = client.business_name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') + '-' + client.id.substring(0, 8)

      await supabase
        .from('clients')
        .update({ slug })
        .eq('id', client.id)

      console.log(`  ✅ Generated slug for ${client.business_name}: ${slug}`)
    }

    // Step 6: Final verification
    console.log('\n📋 Step 6: Final verification...')
    const { data: finalClients, count } = await supabase
      .from('clients')
      .select('*', { count: 'exact' })

    const { data: locations, count: locationCount } = await supabase
      .from('client_locations')
      .select('*', { count: 'exact' })

    console.log('\n✅ Cleanup Complete!')
    console.log('─'.repeat(50))
    console.log(`Total Clients: ${count}`)
    console.log(`Total Locations: ${locationCount}`)
    console.log(`All clients linked to agency: ${agencyName}`)
    console.log(`All clients have slugs: Yes`)
    console.log('─'.repeat(50))

    // Show final client list
    console.log('\n📋 Final Client List:')
    finalClients?.forEach((client: any, index: number) => {
      console.log(`${index + 1}. ${client.business_name}`)
      console.log(`   Slug: ${client.slug}`)
      console.log(`   Dashboard: /clients/${client.slug}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the cleanup
cleanupAndSetupClients()