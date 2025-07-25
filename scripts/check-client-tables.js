import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkClientTables() {
  console.log('Checking client-related tables in your database...\n')

  const clientTables = [
    'clients',
    'client_users',
    'client_locations',
    'client_dashboard_widgets',
    'agencies',
    'agency_users',
    'agency_invites',
    'reviews',
    'review_activities',
    'google_business_posts',
    'google_business_qna',
    'qna_activities'
  ]

  const results = {
    existing: [],
    missing: []
  }

  for (const table of clientTables) {
    try {
      // Try to query each table to see if it exists
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
        .single()

      if (error && error.code === 'PGRST116') {
        // Table doesn't exist
        results.missing.push(table)
      } else {
        // Table exists (even if empty or with other errors)
        results.existing.push(table)
      }
    } catch (err) {
      // Unexpected error
      console.error(`Error checking table ${table}:`, err.message)
    }
  }

  console.log('✅ EXISTING TABLES:')
  results.existing.forEach(table => console.log(`   - ${table}`))
  
  if (results.missing.length > 0) {
    console.log('\n❌ MISSING TABLES:')
    results.missing.forEach(table => console.log(`   - ${table}`))
    
    console.log('\n📝 To install missing tables, run the appropriate migration files from:')
    console.log('   - /database/migrations/')
    console.log('   - /supabase/migrations/')
  } else {
    console.log('\n✅ All client-related tables are installed!')
  }

  // Check table structure for main client tables
  if (results.existing.includes('clients')) {
    console.log('\n📊 Checking clients table structure...')
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .limit(0)

      if (!error && data !== null) {
        console.log('   Clients table is accessible and queryable')
      }
    } catch (err) {
      console.error('   Error accessing clients table:', err.message)
    }
  }
}

checkClientTables().catch(console.error)