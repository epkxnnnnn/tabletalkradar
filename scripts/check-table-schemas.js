import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTableSchemas() {
  console.log('🔍 Checking table schemas for correct column names...\n')

  const tablesToCheck = [
    'clients',
    'client_locations', 
    'client_users',
    'reviews',
    'google_business_accounts',
    'google_business_locations',
    'analytics_snapshots',
    'audit_reports',
    'social_media_posts'
  ]

  for (const tableName of tablesToCheck) {
    try {
      // Try to query the table with limit 0 to get column structure
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0)

      if (error) {
        console.error(`❌ Error checking ${tableName}:`, error.message)
        continue
      }

      console.log(`📋 Table: ${tableName} exists`)

      // Try a simple select to see if common columns exist
      const testColumns = ['user_id', 'owner_id', 'client_id', 'agency_id']
      
      for (const col of testColumns) {
        try {
          const { error: colError } = await supabase
            .from(tableName)
            .select(col)
            .limit(0)
          
          if (!colError) {
            console.log(`   ✅ Has column: ${col}`)
          }
        } catch (e) {
          // Column doesn't exist, which is fine
        }
      }

      console.log('')

    } catch (err) {
      console.error(`❌ Unexpected error checking ${tableName}:`, err.message)
    }
  }
}

checkTableSchemas().catch(console.error)