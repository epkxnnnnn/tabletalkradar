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
const AGENCY_ID = '624c0c6a-9d88-4ae1-adfa-b511132279e4'

// Client contact emails (you can modify these)
const CLIENT_CONTACTS = [
  { slug: 'alisa-sushi-and-thai-bistro-6cd31666', email: 'manager@alisasushithai.com', name: 'Alisa Manager' },
  { slug: 'basil-vegan-thai-and-sushi-c0d44d88', email: 'contact@basilveganthai.com', name: 'Basil Manager' },
  { slug: 'bright-facial-spa-and-thai-massage-72f755f2', email: 'info@brightspalv.com', name: 'Bright Spa Manager' },
  { slug: 'chang-kao-thai-cuisine-92467e40', email: 'manager@changkaothai.com', name: 'Chang Kao Manager' },
  { slug: 'daikon-vegan-sushi-418ecefc', email: 'contact@daikonvegansushi.com', name: 'Daikon Manager' },
  { slug: 'daikon-vegan-sushi-and-more-b56766ad', email: 'contact2@daikonvegansushi.com', name: 'Daikon More Manager' },
  { slug: 'koloa-thai-bistro-26f0fecf', email: 'info@koloathai.com', name: 'Koloa Manager' },
  { slug: 'lullabar-thai-fusion-48c51a89', email: 'contact@lullabarlv.com', name: 'Lulla Manager' }
]

async function createClientUsers() {
  console.log('👥 Creating client users for dashboard access...\n')

  try {
    // Get all clients
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .order('business_name')

    if (!clients || clients.length === 0) {
      console.log('❌ No clients found')
      return
    }

    console.log(`📋 Found ${clients.length} clients`)

    for (const client of clients) {
      console.log(`\n🔄 Processing: ${client.business_name}`)
      
      // Find contact info for this client
      const contactInfo = CLIENT_CONTACTS.find(c => c.slug === client.slug)
      
      if (!contactInfo) {
        console.log(`  ⚠️  No contact info defined, skipping`)
        continue
      }

      try {
        // Check if auth user already exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers.users.find(u => u.email === contactInfo.email)

        let authUserId = existingUser?.id

        if (!existingUser) {
          // Create auth user
          console.log(`  👤 Creating auth user: ${contactInfo.email}`)
          const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
            email: contactInfo.email,
            password: 'TempPass123!', // They should change this
            email_confirm: true,
            user_metadata: {
              full_name: contactInfo.name,
              role: 'client'
            }
          })

          if (authError) {
            console.log(`  ❌ Error creating auth user: ${authError.message}`)
            continue
          }

          authUserId = newUser.user?.id
          console.log(`  ✅ Auth user created: ${authUserId}`)
        } else {
          console.log(`  ✅ Auth user exists: ${authUserId}`)
        }

        if (!authUserId) {
          console.log(`  ❌ No auth user ID available`)
          continue
        }

        // Check if client_user already exists
        const { data: existingClientUser } = await supabase
          .from('client_users')
          .select('*')
          .eq('user_id', authUserId)
          .eq('client_id', client.id)
          .single()

        if (existingClientUser) {
          console.log(`  ✅ Client user already exists`)
          continue
        }

        // Create client_users record
        console.log(`  🔗 Creating client user link`)
        const { error: clientUserError } = await supabase
          .from('client_users')
          .insert({
            user_id: authUserId,
            client_id: client.id,
            agency_id: AGENCY_ID,
            role: 'owner',
            permissions: {},
            is_active: true,
            dashboard_preferences: {},
            invited_by: USER_ID
          })

        if (clientUserError) {
          console.log(`  ❌ Error creating client user: ${clientUserError.message}`)
          continue
        }

        console.log(`  ✅ Client user created successfully`)
        console.log(`  🔗 Dashboard: /clients/${client.slug}`)
        console.log(`  📧 Login: ${contactInfo.email} / TempPass123!`)

      } catch (error) {
        console.log(`  ❌ Error processing client: ${error}`)
      }
    }

    // Final summary
    console.log('\n📊 Final Summary:')
    const { data: finalClientUsers, count } = await supabase
      .from('client_users')
      .select(`
        *,
        clients(business_name, slug)
      `, { count: 'exact' })
      .eq('agency_id', AGENCY_ID)

    console.log(`✅ Total client users created: ${count}`)
    
    if (finalClientUsers && finalClientUsers.length > 0) {
      console.log('\n📋 Client Dashboard Access:')
      console.log('─'.repeat(80))
      
      finalClientUsers.forEach((cu: any, index: number) => {
        console.log(`${index + 1}. ${cu.clients.business_name}`)
        console.log(`   🔗 Dashboard: /clients/${cu.clients.slug}`)
        console.log(`   👤 Role: ${cu.role}`)
        console.log(`   ✅ Active: ${cu.is_active}`)
        console.log('─'.repeat(80))
      })
    }

    console.log('\n🎉 Client users setup complete!')
    console.log('📝 Note: Default password is "TempPass123!" - clients should change this')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the script
createClientUsers()