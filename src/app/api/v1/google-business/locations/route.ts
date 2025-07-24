// TableTalk Radar - Google Business Profile Locations API
import { NextRequest } from 'next/server'
import { 
  withMethods,
  successResponse,
  errorResponse,
  AuthenticationError
} from '@/lib/api-handler'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Helper to get authenticated user and Google integration
async function getGoogleIntegration(clientId: string) {
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
  
  // Get Google Business integration
  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('client_id', clientId)
    .eq('provider', 'google_business')
    .eq('status', 'active')
    .single()
  
  if (integrationError || !integration) {
    throw new Error('Google Business integration not found or inactive')
  }
  
  return { user, integration, supabase }
}

// Helper to refresh access token if needed
async function refreshTokenIfNeeded(integration: any, supabase: any) {
  if (!integration.token_expires_at) {
    return integration.access_token
  }
  
  const expiresAt = new Date(integration.token_expires_at)
  const now = new Date()
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)
  
  // Refresh if token expires within 5 minutes
  if (expiresAt <= fiveMinutesFromNow) {
    if (!integration.refresh_token) {
      throw new Error('No refresh token available - re-authentication required')
    }
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      }),
    })
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to refresh access token')
    }
    
    const tokens = await tokenResponse.json()
    
    // Update integration with new tokens
    const { error: updateError } = await supabase
      .from('integrations')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || integration.refresh_token,
        token_expires_at: tokens.expires_in ? 
          new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', integration.id)
    
    if (updateError) {
      console.error('Failed to update tokens:', updateError)
    }
    
    return tokens.access_token
  }
  
  return integration.access_token
}

// GET /api/v1/google-business/locations - Get business locations
export const GET = withMethods(['GET'])(
  async (req: NextRequest) => {
    const url = new URL(req.url)
    const clientId = url.searchParams.get('client_id')
    
    if (!clientId) {
      throw new Error('client_id parameter required')
    }
    
    const { integration, supabase } = await getGoogleIntegration(clientId)
    const accessToken = await refreshTokenIfNeeded(integration, supabase)
    
    try {
      // Get accounts first
      const accountsResponse = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!accountsResponse.ok) {
        const errorData = await accountsResponse.text()
        console.error('Accounts API error:', errorData)
        throw new Error('Failed to fetch Google Business accounts')
      }
      
      const accountsData = await accountsResponse.json()
      const accounts = accountsData.accounts || []
      
      // Get locations for each account
      const allLocations = []
      
      for (const account of accounts) {
        try {
          const locationsResponse = await fetch(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,phoneNumbers,categories,websiteUri,latlng,metadata,storeCode,labels`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          )
          
          if (locationsResponse.ok) {
            const locationsData = await locationsResponse.json()
            const locations = (locationsData.locations || []).map((location: any) => ({
              ...location,
              accountName: account.name,
              accountDisplayName: account.accountName || account.name
            }))
            allLocations.push(...locations)
          }
        } catch (error) {
          console.error(`Error fetching locations for account ${account.name}:`, error)
        }
      }
      
      return successResponse(
        {
          accounts,
          locations: allLocations,
          total_locations: allLocations.length
        },
        'Business locations retrieved successfully'
      )
      
    } catch (error) {
      console.error('Google Business API error:', error)
      throw new Error('Failed to fetch business locations')
    }
  }
)