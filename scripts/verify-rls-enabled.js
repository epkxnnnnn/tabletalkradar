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

async function verifyRLS() {
  console.log('🔐 Verifying Row Level Security (RLS) status...\n')

  const tablesToCheck = [
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

  const results = {
    enabled: [],
    disabled: [],
    policies: {}
  }

  // Check RLS status for each table
  for (const table of tablesToCheck) {
    try {
      // Query to check if RLS is enabled
      const { data: rlsStatus, error: rlsError } = await supabase
        .rpc('check_rls_enabled', { table_name: table })

      if (rlsError) {
        // Fallback: Try direct query
        const { data, error } = await supabase
          .from('pg_tables')
          .select('rowsecurity')
          .eq('schemaname', 'public')
          .eq('tablename', table)
          .single()

        if (!error && data) {
          if (data.rowsecurity) {
            results.enabled.push(table)
          } else {
            results.disabled.push(table)
          }
        }
      } else if (rlsStatus) {
        results.enabled.push(table)
      } else {
        results.disabled.push(table)
      }

      // Check policies for the table
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('policyname, cmd')
        .eq('schemaname', 'public')
        .eq('tablename', table)

      if (!policiesError && policies) {
        results.policies[table] = policies
      }
    } catch (err) {
      console.error(`Error checking table ${table}:`, err.message)
    }
  }

  // Display results
  console.log('✅ TABLES WITH RLS ENABLED:')
  if (results.enabled.length > 0) {
    results.enabled.forEach(table => {
      const policyCount = results.policies[table]?.length || 0
      console.log(`   - ${table} (${policyCount} policies)`)
    })
  } else {
    console.log('   None')
  }

  console.log('\n❌ TABLES WITH RLS DISABLED:')
  if (results.disabled.length > 0) {
    results.disabled.forEach(table => console.log(`   - ${table}`))
    console.log('\n⚠️  WARNING: These tables are vulnerable to unauthorized access!')
    console.log('   Run the migration file: database/migrations/012_enable_rls_security.sql')
  } else {
    console.log('   None - All tables are secured! 🎉')
  }

  // Summary
  console.log('\n📊 SUMMARY:')
  console.log(`   Total tables checked: ${tablesToCheck.length}`)
  console.log(`   RLS enabled: ${results.enabled.length}`)
  console.log(`   RLS disabled: ${results.disabled.length}`)

  // Check if all critical tables have policies
  if (results.enabled.length > 0) {
    console.log('\n📋 POLICY CHECK:')
    let missingPolicies = []
    results.enabled.forEach(table => {
      const policyCount = results.policies[table]?.length || 0
      if (policyCount === 0) {
        missingPolicies.push(table)
      }
    })

    if (missingPolicies.length > 0) {
      console.log('⚠️  Tables with RLS enabled but NO POLICIES:')
      missingPolicies.forEach(table => console.log(`   - ${table}`))
      console.log('\n   These tables will block ALL access until policies are added!')
    } else {
      console.log('✅ All RLS-enabled tables have policies configured')
    }
  }
}

// Create the RLS check function if it doesn't exist
async function createRLSCheckFunction() {
  const functionSQL = `
    CREATE OR REPLACE FUNCTION check_rls_enabled(table_name text)
    RETURNS boolean AS $$
    DECLARE
      rls_enabled boolean;
    BEGIN
      SELECT relrowsecurity INTO rls_enabled
      FROM pg_class
      WHERE relname = table_name
      AND relnamespace = 'public'::regnamespace;
      
      RETURN COALESCE(rls_enabled, false);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  try {
    await supabase.rpc('query', { query: functionSQL })
  } catch (err) {
    // Function might already exist or we don't have permission
  }
}

// Run the verification
createRLSCheckFunction().then(() => {
  verifyRLS().catch(console.error)
})