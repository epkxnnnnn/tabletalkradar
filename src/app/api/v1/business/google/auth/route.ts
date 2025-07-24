// TableTalk Radar - Google OAuth Authentication API (v1)
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withValidation, 
  withMethods,
  ValidationError
} from '@/lib/api-handler'
import { NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback'
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'

// Request validation schemas
const GoogleAuthSchema = z.object({
  client_id: z.string().min(1, 'Client ID is required')
})

// GET /api/v1/business/google/auth - Initiate Google OAuth flow
export async function GET(req: NextRequest) {
  try {
    // Check method
    if (req.method !== 'GET') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
    }
    
    const url = new URL(req.url)
    const client_id = url.searchParams.get('client_id')
    
    if (!client_id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }
    
    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: 'Google Client ID not configured' }, { status: 500 })
    }
    
    // Use client_id as state for security and tracking
    const state = client_id
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(GOOGLE_SCOPE)}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${state}`
      
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Google Auth Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 