// TableTalk Radar - Google OAuth Callback Handler (v1)
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/v1/business/google/auth/callback'

// GET /api/v1/business/google/auth/callback - Handle OAuth callback
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // This is the client_id
    const error = url.searchParams.get('error')
    
    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=${encodeURIComponent('Google authorization failed')}&details=${encodeURIComponent(error)}`, req.url)
      )
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard?error=' + encodeURIComponent('Missing authorization code or state'), req.url)
      )
    }
    
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return NextResponse.redirect(
        new URL('/dashboard?error=' + encodeURIComponent('Google OAuth not configured'), req.url)
      )
    }
    
    // Exchange code for tokens
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
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData)
      return NextResponse.redirect(
        new URL('/dashboard?error=' + encodeURIComponent('Failed to exchange authorization code'), req.url)
      )
    }
    
    const { access_token, refresh_token, expires_in, scope } = tokenData
    
    if (!access_token || !refresh_token) {
      return NextResponse.redirect(
        new URL('/dashboard?error=' + encodeURIComponent('Invalid token response from Google'), req.url)
      )
    }
    
    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })
    
    const userInfo = await userInfoResponse.json()
    
    if (!userInfoResponse.ok) {
      console.error('Failed to get user info:', userInfo)
      return NextResponse.redirect(
        new URL('/dashboard?error=' + encodeURIComponent('Failed to get Google user info'), req.url)
      )
    }
    
    // Get authenticated user from Supabase
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
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.redirect(
        new URL('/auth/login?error=' + encodeURIComponent('Please login first'), req.url)
      )
    }
    
    // Store the integration in database
    const expiresAt = new Date(Date.now() + (expires_in * 1000)).toISOString()
    
    const { error: dbError } = await supabase
      .from('integrations')
      .upsert({
        user_id: user.id,
        client_id: state, // The client_id passed as state
        platform: 'google_my_business',
        account_id: userInfo.id,
        account_name: refresh_token, // Store refresh token as account_name for now
        access_token: access_token,
        refresh_token: refresh_token,
        token_expires_at: expiresAt,
        scope: scope,
        is_active: true,
        integration_data: {
          user_email: userInfo.email,
          user_name: userInfo.name,
          picture: userInfo.picture,
          connected_at: new Date().toISOString()
        }
      }, {
        onConflict: 'user_id,client_id,platform'
      })
    
    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.redirect(
        new URL('/dashboard?error=' + encodeURIComponent('Failed to save Google integration'), req.url)
      )
    }
    
    // Redirect back to dashboard with success message
    return NextResponse.redirect(
      new URL('/dashboard?success=' + encodeURIComponent('Google My Business connected successfully'), req.url)
    )
    
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/dashboard?error=' + encodeURIComponent('Internal server error'), req.url)
    )
  }
} 