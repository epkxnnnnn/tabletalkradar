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

async function getUserInfo() {
  try {
    // Get user by email
    const { data: user } = await supabase.auth.admin.listUsers()
    const targetUser = user.users.find(u => u.email === 'kphstk@gmail.com')
    
    if (!targetUser) {
      console.log('User not found')
      return
    }

    console.log('👤 User Info:')
    console.log(`Email: ${targetUser.email}`)
    console.log(`ID: ${targetUser.id}`)

    // Get agency memberships
    const { data: memberships } = await supabase
      .from('agency_memberships')
      .select(`
        *,
        agencies (
          id,
          name
        )
      `)
      .eq('user_id', targetUser.id)

    console.log('\n🏢 Agency Memberships:')
    memberships?.forEach(m => {
      console.log(`- ${m.agencies.name} (ID: ${m.agencies.id}) - Role: ${m.role}`)
    })

    // Get all agencies
    const { data: allAgencies } = await supabase
      .from('agencies')
      .select('*')

    console.log('\n🏢 All Agencies:')
    allAgencies?.forEach(a => {
      console.log(`- ${a.name} (ID: ${a.id})`)
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

getUserInfo()