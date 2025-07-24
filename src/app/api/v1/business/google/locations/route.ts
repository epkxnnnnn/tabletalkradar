// TableTalk Radar - Google My Business Locations API (v1)
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withValidation, 
  withMethods,
  successResponse,
  errorResponse,
  AuthenticationError,
  NotFoundError
} from '@/lib/api-handler'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

// Request validation schemas
const GetLocationsSchema = z.object({})

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
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new AuthenticationError('Not authenticated')
  }
  
  return { user, supabase }
}

// Helper to get Google refresh token
async function getGoogleIntegration(supabase: any, userId: string, clientId?: string) {
  let query = supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', 'google_my_business')
    .eq('is_active', true)
    
  if (clientId) {
    query = query.eq('client_id', clientId)
  }
    
  const { data: integration, error: integrationError } = await query.single()
    
  if (integrationError || !integration) {
    throw new NotFoundError('Google My Business integration')
  }
  
  const refresh_token = integration.refresh_token || integration.account_name
  if (!refresh_token) {
    throw new Error('No refresh token found')
  }
  
  return { integration, refresh_token }
}

// Helper to get Google access token
async function getGoogleAccessToken(refreshToken: string) {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  
  const tokenData = await tokenRes.json()
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error('Failed to refresh access token')
  }
  
  return tokenData.access_token
}

// Helper to fetch GMB locations
async function fetchGMBLocations(accessToken: string) {
  const gmbRes = await fetch('https://mybusinessbusinessinformation.googleapis.com/v1/accounts', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  
  const gmbData = await gmbRes.json()
  if (!gmbRes.ok) {
    throw new Error('Failed to fetch GMB locations')
  }
  
  return gmbData
}

// GET /api/v1/business/google/locations - Fetch Google My Business locations
export const GET = withMethods(['GET'])(
  withValidation(GetLocationsSchema)(
    async (req: NextRequest, query: z.infer<typeof GetLocationsSchema>) => {
    const { user, supabase } = await getAuthenticatedUser()
    
    // Get client_id from query params
    const url = new URL(req.url)
    const clientId = url.searchParams.get('client_id')
    
    const { integration, refresh_token } = await getGoogleIntegration(supabase, user.id, clientId || undefined)
    const accessToken = await getGoogleAccessToken(refresh_token)
    const locations = await fetchGMBLocations(accessToken)
    
    // Update the integration with the new access token
    await supabase
      .from('integrations')
      .update({ 
        access_token: accessToken,
        updated_at: new Date().toISOString()
      })
      .eq('id', integration.id)
    
    return successResponse(
      { locations, integration_info: integration.integration_data },
      'Successfully retrieved Google My Business locations'
    )
    }
  )
) 