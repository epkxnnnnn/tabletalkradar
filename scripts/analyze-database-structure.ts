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

async function analyzeDatabase() {
  console.log('🔍 Analyzing database structure for client profiles...\n')

  try {
    // Get all table names
    const { data: tables, error } = await supabase
      .rpc('get_table_names')
      .single()

    if (error) {
      // Try alternative method to get tables
      const { data: tablesAlt } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name')

      console.log('📋 Database Tables Found:')
      tablesAlt?.forEach((table: any, index: number) => {
        console.log(`${index + 1}. ${table.table_name}`)
      })
    }

    // Check specific tables relevant to client profiles
    const relevantTables = [
      'clients',
      'client_locations', 
      'google_business_profiles',
      'reviews',
      'social_posts',
      'google_posts',
      'seo_keywords',
      'business_hours',
      'services',
      'menu_items',
      'social_media_links'
    ]

    console.log('\n🔍 Checking relevant tables for client profiles:')
    console.log('─'.repeat(80))

    for (const tableName of relevantTables) {
      try {
        // Check if table exists and get structure
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0)

        if (!error) {
          // Get column information
          const { data: columns } = await supabase
            .rpc('exec_sql', {
              sql: `
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = '${tableName}' 
                AND table_schema = 'public'
                ORDER BY ordinal_position;
              `
            })

          console.log(`✅ ${tableName}`)
          if (columns && columns.length > 0) {
            columns.forEach((col: any) => {
              console.log(`   - ${col.column_name} (${col.data_type}${col.is_nullable === 'YES' ? ', nullable' : ''})`)
            })
          }

          // Get sample data count
          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })

          console.log(`   📊 Records: ${count || 0}`)
        } else {
          console.log(`❌ ${tableName} - Table not found`)
        }
        console.log('─'.repeat(80))

      } catch (err) {
        console.log(`❌ ${tableName} - Error checking table`)
        console.log('─'.repeat(80))
      }
    }

    // Check current client data to see what's already stored
    console.log('\n📊 Current Client Data Analysis:')
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .limit(1)

    if (clients && clients.length > 0) {
      const sampleClient = clients[0]
      console.log('\n📋 Sample Client Record Structure:')
      Object.keys(sampleClient).forEach(key => {
        const value = sampleClient[key]
        const type = typeof value
        console.log(`   ${key}: ${type} ${value ? `(example: ${String(value).substring(0, 50)}${String(value).length > 50 ? '...' : ''})` : '(null)'}`)
      })
    }

    // Check client_locations structure
    console.log('\n📍 Client Locations Analysis:')
    const { data: locations } = await supabase
      .from('client_locations')
      .select('*')
      .limit(1)

    if (locations && locations.length > 0) {
      const sampleLocation = locations[0]
      console.log('\n📋 Sample Location Record Structure:')
      Object.keys(sampleLocation).forEach(key => {
        const value = sampleLocation[key]
        const type = typeof value
        console.log(`   ${key}: ${type} ${value ? `(example: ${String(value).substring(0, 50)}${String(value).length > 50 ? '...' : ''})` : '(null)'}`)
      })
    }

    // Generate recommendations
    console.log('\n💡 Recommendations:')
    console.log('═'.repeat(80))
    
    console.log('Based on the analysis, here\'s what we need for comprehensive client profiles:')
    
    const recommendations = [
      '🎯 Google Business Profile Integration',
      '📍 SEO Keywords & Ranking Data', 
      '🕒 Business Hours Management',
      '🛍️ Services & Menu Management',
      '🌐 Social Media Links',
      '📊 Performance Metrics',
      '🏆 Review Management',
      '📈 SEO Tracking'
    ]

    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`)
    })

    console.log('═'.repeat(80))

  } catch (error) {
    console.error('❌ Error analyzing database:', error)
  }
}

analyzeDatabase()