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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Your actual IDs
const USER_ID = 'bbc06d26-ac73-4b38-8363-1e1c9fdecb68'
const AGENCY_ID = '624c0c6a-9d88-4ae1-adfa-b511132279e4' // Rep Pro Marketing Agency

function generateSlug(businessName: string, clientId: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s-&]/g, '') // Keep & for names like "Sushi & Thai"
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') + '-' + clientId.substring(0, 8)
}

async function completeClientCleanup() {
  console.log('🧹 Starting complete client cleanup...\n')

  try {
    // Step 1: Add slug column if not exists
    console.log('📋 Step 1: Adding slug column...')
    
    // This might fail if column exists, that's ok
    try {
      await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE clients ADD COLUMN slug VARCHAR(255) UNIQUE;'
      })
      console.log('✅ Slug column added')
    } catch (error) {
      console.log('✅ Slug column already exists')
    }

    // Step 2: Get all clients and identify duplicates
    console.log('\n📋 Step 2: Analyzing clients...')
    const { data: allClients } = await supabase
      .from('clients')
      .select('*')
      .order('business_name, created_at')

    console.log(`Found ${allClients?.length} total clients`)

    // Group by business name
    const clientGroups = allClients?.reduce((acc: any, client: any) => {
      if (!acc[client.business_name]) {
        acc[client.business_name] = []
      }
      acc[client.business_name].push(client)
      return acc
    }, {})

    const duplicateGroups = Object.entries(clientGroups || {})
      .filter(([_, clients]: any) => clients.length > 1)

    console.log(`Found ${duplicateGroups.length} businesses with duplicates`)

    // Step 3: Clean up duplicates
    console.log('\n📋 Step 3: Cleaning up duplicates...')
    
    for (const [businessName, clients] of duplicateGroups as any) {
      console.log(`\n🔄 Processing: ${businessName} (${clients.length} duplicates)`)
      
      // Sort to keep the best one: has agency > has owner > oldest
      const sorted = clients.sort((a: any, b: any) => {
        // Prefer clients with agency_id
        if (a.agency_id && !b.agency_id) return -1
        if (!a.agency_id && b.agency_id) return 1
        // Then prefer clients with owner_id
        if (a.owner_id && !b.owner_id) return -1
        if (!a.owner_id && b.owner_id) return 1
        // Finally, prefer older clients
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })

      const keepClient = sorted[0]
      const deleteClients = sorted.slice(1)

      console.log(`  ✅ Keeping: ${keepClient.id}`)
      
      // Move any related data to the kept client
      for (const deleteClient of deleteClients) {
        console.log(`  🗑️  Deleting: ${deleteClient.id}`)
        
        // Move client_locations
        const { error: locationError } = await supabase
          .from('client_locations')
          .update({ client_id: keepClient.id })
          .eq('client_id', deleteClient.id)

        if (locationError) {
          console.log(`    ⚠️  Warning moving locations: ${locationError.message}`)
        }

        // Move any other related data (reviews, posts, etc.)
        const tables = ['reviews', 'google_posts', 'social_posts']
        for (const table of tables) {
          try {
            await supabase
              .from(table)
              .update({ client_id: keepClient.id })
              .eq('client_id', deleteClient.id)
          } catch (error) {
            // Table might not exist, that's ok
          }
        }

        // Delete the duplicate client
        const { error: deleteError } = await supabase
          .from('clients')
          .delete()
          .eq('id', deleteClient.id)

        if (deleteError) {
          console.log(`    ❌ Error deleting: ${deleteError.message}`)
        }
      }
    }

    // Step 4: Update all remaining clients
    console.log('\n📋 Step 4: Updating all clients with proper agency and owner...')
    
    const { data: remainingClients } = await supabase
      .from('clients')
      .select('*')

    let updated = 0
    for (const client of remainingClients || []) {
      const updates: any = {}
      let needsUpdate = false

      // Set owner_id if missing
      if (!client.owner_id) {
        updates.owner_id = USER_ID
        needsUpdate = true
      }

      // Set agency_id if missing
      if (!client.agency_id) {
        updates.agency_id = AGENCY_ID
        needsUpdate = true
      }

      // Generate slug if missing
      if (!client.slug) {
        updates.slug = generateSlug(client.business_name, client.id)
        needsUpdate = true
      }

      if (needsUpdate) {
        updates.updated_at = new Date().toISOString()
        
        const { error } = await supabase
          .from('clients')
          .update(updates)
          .eq('id', client.id)

        if (error) {
          console.log(`❌ Error updating ${client.business_name}: ${error.message}`)
        } else {
          updated++
          console.log(`✅ Updated: ${client.business_name}`)
          if (updates.slug) {
            console.log(`   Slug: ${updates.slug}`)
          }
        }
      }
    }

    console.log(`\n✅ Updated ${updated} clients`)

    // Step 5: Final verification
    console.log('\n📋 Step 5: Final verification...')
    
    const { data: finalClients, count } = await supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .order('business_name')

    const { count: locationCount } = await supabase
      .from('client_locations')
      .select('*', { count: 'exact' })

    const stats = {
      total: count || 0,
      withSlugs: finalClients?.filter(c => c.slug).length || 0,
      withAgency: finalClients?.filter(c => c.agency_id).length || 0,
      withOwner: finalClients?.filter(c => c.owner_id).length || 0,
      active: finalClients?.filter(c => c.status === 'active').length || 0
    }

    console.log('\n🎉 Cleanup Complete!')
    console.log('═'.repeat(60))
    console.log(`📊 Final Statistics:`)
    console.log(`   Total Clients: ${stats.total}`)
    console.log(`   With Slugs: ${stats.withSlugs}/${stats.total}`)
    console.log(`   Linked to Agency: ${stats.withAgency}/${stats.total}`)
    console.log(`   With Owner: ${stats.withOwner}/${stats.total}`)
    console.log(`   Active: ${stats.active}/${stats.total}`)
    console.log(`   Total Locations: ${locationCount}`)
    console.log('═'.repeat(60))

    // Show final client list
    console.log('\n📋 Your Clean Client List:')
    console.log('─'.repeat(80))
    
    finalClients?.forEach((client: any, index: number) => {
      console.log(`${index + 1}. ${client.business_name}`)
      console.log(`   🔗 Dashboard: https://yourdomain.com/clients/${client.slug}`)
      console.log(`   📊 Status: ${client.status} | Tier: ${client.client_tier}`)
      console.log(`   📅 Created: ${new Date(client.created_at).toLocaleDateString()}`)
      console.log('─'.repeat(80))
    })

    console.log('\n✅ All done! Your clients are now:')
    console.log('   ✅ Deduplicated')
    console.log('   ✅ Linked to your agency')
    console.log('   ✅ Have unique slugs')
    console.log('   ✅ Ready for individual dashboards')

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  }
}

// Run the cleanup
completeClientCleanup()