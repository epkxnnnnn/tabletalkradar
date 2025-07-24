import { createClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors
let adminClient: ReturnType<typeof createClient> | null = null

// Admin client for server-side operations
export const supabaseAdmin = () => {
  if (!adminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl) {
      throw new Error('supabaseUrl is required. Please set NEXT_PUBLIC_SUPABASE_URL environment variable.')
    }
    
    if (!supabaseServiceKey) {
      throw new Error('supabaseServiceKey is required. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.')
    }
    
    adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  
  return adminClient
}

// Function to create superadmin account
export async function createSuperAdmin() {
  try {
    // Create the user account
    const { data: userData, error: userError } = await supabaseAdmin().auth.admin.createUser({
      email: 'kphstk@gmail.com',
      password: 'tabletalksuperadmin2025',
      email_confirm: true,
      user_metadata: {
        full_name: 'Super Admin',
        company_name: 'TableTalk Radar',
        role: 'superadmin'
      }
    })

    if (userError) {
      console.error('Error creating superadmin user:', userError)
      return { error: userError }
    }

    // Create profile record
    const { error: profileError } = await supabaseAdmin()
      .from('profiles')
      .insert({
        id: userData.user.id,
        full_name: 'Super Admin',
        email: 'kphstk@gmail.com',
        company_name: 'TableTalk Radar',
        role: 'superadmin',
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Error creating superadmin profile:', profileError)
      return { error: profileError }
    }

    console.log('Superadmin account created successfully:', userData.user.id)
    return { success: true, user: userData.user }
  } catch (error) {
    console.error('Error creating superadmin:', error)
    return { error }
  }
}

export async function getProfile(access_token: string) {
  const { data: { user }, error } = await supabaseAdmin().auth.getUser(access_token);
  if (error || !user) return null;
  // Fetch profile from profiles table
  const { data: profile } = await supabaseAdmin().from('profiles').select('*').eq('id', user.id).single();
  return profile;
} 