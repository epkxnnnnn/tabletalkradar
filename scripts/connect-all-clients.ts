import { googleBusinessSyncService } from '@/lib/google-business-sync'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface ConnectionResult {
  client: string
  locationId: string
  googleAccountId: string
  status: string
}

async function getAllClientsWithLocations() {
  const { data: clients, error: clientsError } = await (supabaseAdmin() as any)
    .from('clients')
    .select(`
      id,
      name,
      email,
      google_account_id,
      client_locations (
        id,
        name,
        google_account_id
      )
    `)

  if (clientsError) {
    throw clientsError
  }

  return clients || []
}

async function connectAllClients() {
  console.log('🚀 Starting to connect all clients...')
  
  const clients = await getAllClientsWithLocations()
  const results: ConnectionResult[] = []
  
  for (const client of clients) {
    console.log(`\n📋 Processing client: ${client.name}`)
    
    for (const location of client.client_locations || []) {
      try {
        console.log(`  🏪 Processing location: ${location.name} (${location.id})`)
        
        // Sync initial data using the correct service
        if (location.google_account_id) {
          await googleBusinessSyncService.syncLocationData(
            client.id,
            location.id,
            location.google_account_id
          )
          
          results.push({
            client: client.name,
            locationId: location.id,
            googleAccountId: location.google_account_id,
            status: 'connected'
          })
          
          console.log(`🎉 Successfully connected ${client.name}\n`)
        } else {
          console.log(`  ⚠️  Skipping ${client.name} - no Google account ID`)
          results.push({
            client: client.name,
            locationId: location.id,
            googleAccountId: 'N/A',
            status: 'skipped - no google account'
          })
        }
      } catch (error) {
        console.error(`❌ Failed to connect ${client.name}:`, error)
        results.push({
          client: client.name,
          locationId: location.id,
          googleAccountId: location.google_account_id || 'N/A',
          status: 'failed'
        })
      }
    }
  }
  
  console.log('\n📊 Connection Results:')
  console.table(results)
  
  return results
}

// Run if called directly
if (require.main === module) {
  connectAllClients()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { connectAllClients }
