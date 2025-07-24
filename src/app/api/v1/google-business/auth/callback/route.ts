// TableTalk Radar - Google Business Profile OAuth Callback
import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL}/api/v1/google-business/auth/callback`

// GET /api/v1/google-business/auth/callback - Handle Google OAuth callback
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  
  // Handle OAuth errors
  if (error) {
    console.error('Google OAuth error:', error)
    return redirect('/dashboard/integrations?error=oauth_denied')
  }
  
  if (!code || !state) {
    console.error('Missing code or state parameter')
    return redirect('/dashboard/integrations?error=invalid_callback')
  }
  
  try {
    // Decode and validate state
    const decodedState = Buffer.from(state, 'base64url').toString()
    const [userId, clientId, timestamp] = decodedState.split(':')
    
    if (!userId || !clientId) {
      throw new Error('Invalid state parameter')
    }
    
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    })
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      throw new Error('Failed to exchange authorization code')
    }
    
    const tokens = await tokenResponse.json()
    
    // Get user profile from Google
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    })
    
    if (!profileResponse.ok) {
      throw new Error('Failed to fetch user profile')
    }
    
    const profile = await profileResponse.json()
    
    // Store integration in database
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          }
        },
      }
    )
    
    // Upsert integration record
    const { error: dbError } = await supabase
      .from('integrations')
      .upsert({
        user_id: userId,
        client_id: clientId,
        provider: 'google_business',
        provider_account_id: profile.id,
        provider_account_name: profile.name || profile.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokens.expires_in ? 
          new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
        scopes: ['business.manage', 'userinfo.profile', 'userinfo.email'],
        integration_data: {
          profile,
          token_type: tokens.token_type,
          scope: tokens.scope
        },
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,client_id,provider'
      })
    
    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to save integration')
    }
    
    // Redirect to integrations page with success
    return redirect(`/dashboard/integrations?success=google_connected&account=${encodeURIComponent(profile.name || profile.email)}`)
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    return redirect('/dashboard/integrations?error=connection_failed')
  }
}