// TableTalk Radar - Google Business Profile OAuth Initialization
import { NextRequest } from 'next/server'
import { 
  withMethods,
  successResponse,
  errorResponse,
  AuthenticationError
} from '@/lib/api-handler'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL}/api/v1/google-business/auth/callback`

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ')

// Helper to get authenticated user
async function getAuthenticatedUser() {
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
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new AuthenticationError('Authentication required')
  }
  
  return { user, supabase }
}

// GET /api/v1/google-business/auth - Initialize Google OAuth flow
export const GET = withMethods(['GET'])(
  async (req: NextRequest) => {
    const { user } = await getAuthenticatedUser()
    
    const url = new URL(req.url)
    const clientId = url.searchParams.get('client_id')
    
    if (!clientId) {
      throw new Error('client_id parameter required')
    }
    
    // Generate state parameter for security
    const state = `${user.id}:${clientId}:${Date.now()}`
    const encodedState = Buffer.from(state).toString('base64url')
    
    // Build Google OAuth URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
    googleAuthUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    googleAuthUrl.searchParams.set('response_type', 'code')
    googleAuthUrl.searchParams.set('scope', GOOGLE_SCOPES)
    googleAuthUrl.searchParams.set('access_type', 'offline')
    googleAuthUrl.searchParams.set('prompt', 'consent')
    googleAuthUrl.searchParams.set('state', encodedState)
    
    return successResponse(
      { 
        auth_url: googleAuthUrl.toString(),
        state: encodedState
      },
      'Google OAuth URL generated successfully'
    )
  }
)