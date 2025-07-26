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

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCurrentSchema() {
  console.log('🔍 Checking current database schema...\n')

  try {
    // Check if tables exist and their columns
    const tablesToCheck = [
      'clients',
      'client_locations', 
      'seo_keywords',
      'business_services',
      'business_menu',
      'social_media_posts'
    ]

    for (const tableName of tablesToCheck) {
      console.log(`📋 Checking table: ${tableName}`)
      
      try {
        // Try to select from table to see if it exists
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0)

        if (error) {
          console.log(`   ❌ Table does not exist: ${error.message}`)
        } else {
          console.log(`   ✅ Table exists`)
          
          // Get column information
          const { data: columns, error: columnError } = await supabase
            .rpc('exec_sql', {
              sql: `
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = '${tableName}' 
                AND table_schema = 'public'
                ORDER BY ordinal_position;
              `
            })

          if (!columnError && columns && columns.length > 0) {
            console.log(`   📊 Columns:`)
            columns.forEach((col: any) => {
              console.log(`      - ${col.column_name} (${col.data_type})`)
            })
          }
        }
      } catch (err) {
        console.log(`   ❌ Error checking table: ${err}`)
      }
      console.log('')
    }

    // Check current clients table structure specifically
    console.log('🔍 Detailed clients table analysis:')
    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .limit(1)

    if (clientsData && clientsData.length > 0) {
      const sampleClient = clientsData[0]
      console.log('Available columns in clients table:')
      Object.keys(sampleClient).forEach(key => {
        console.log(`   - ${key}: ${typeof sampleClient[key]}`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkCurrentSchema()