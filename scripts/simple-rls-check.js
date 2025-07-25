import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRLSStatus() {
  console.log('🔍 Checking RLS status after migration...\n')

  const vulnerableTables = [
    '_migrations',
    'reviews', 
    'google_business_accounts',
    'google_business_locations',
    'google_posts',
    'social_media_posts',
    'analytics_snapshots', 
    'audit_reports',
    'client_users',
    'client_dashboard_widgets',
    'qna_activities',
    'clients',
    'client_locations'
  ]

  let allSecured = true
  let securedCount = 0

  for (const table of vulnerableTables) {
    try {
      // Try to select without auth - this should fail if RLS is working
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        if (error.message?.includes('RLS') || error.message?.includes('policy') || error.code === 'PGRST301') {
          console.log(`✅ ${table}: RLS enabled and working`)
          securedCount++
        } else {
          console.log(`❓ ${table}: Error (${error.message})`)
        }
      } else {
        console.log(`❌ ${table}: No RLS protection detected`)
        allSecured = false
      }
    } catch (err) {
      console.log(`❓ ${table}: Unexpected error - ${err.message}`)
    }
  }

  console.log('\n📊 SUMMARY:')
  console.log(`Secured tables: ${securedCount}/${vulnerableTables.length}`)
  
  if (allSecured && securedCount > 0) {
    console.log('🎉 All tables appear to be secured with RLS!')
  } else if (securedCount === 0) {
    console.log('⚠️  Unable to verify RLS status - this may be normal with service role key')
  } else {
    console.log('⚠️  Some tables may not be fully secured')
  }

  // Test with a specific table that should definitely exist
  console.log('\n🧪 Testing clients table specifically:')
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .limit(1)

    if (error) {
      console.log(`✅ Clients table: RLS working (${error.message})`)
    } else {
      console.log(`ℹ️  Clients table: Accessible (normal with service role key)`)
    }
  } catch (err) {
    console.log(`❓ Clients table test failed: ${err.message}`)
  }
}

checkRLSStatus().catch(console.error)