// TableTalk Radar - Google Business Profile Posts API
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

// GET /api/v1/google-business/posts - Get business posts
export const GET = withMethods(['GET'])(
  async (req: NextRequest) => {
    const url = new URL(req.url)
    const clientId = url.searchParams.get('client_id')
    const locationName = url.searchParams.get('location_name')
    
    if (!clientId) {
      throw new Error('client_id parameter required')
    }
    
    if (!locationName) {
      throw new Error('location_name parameter required')
    }
    
    const { integration, supabase } = await getGoogleIntegration(clientId)
    const accessToken = await refreshTokenIfNeeded(integration, supabase)
    
    try {
      // Parse the location name to extract account and location IDs
      // Location name format: accounts/{accountId}/locations/{locationId}
      const locationParts = locationName.split('/')
      if (locationParts.length < 4 || locationParts[0] !== 'accounts' || locationParts[2] !== 'locations') {
        throw new Error('Invalid location name format. Expected: accounts/{accountId}/locations/{locationId}')
      }
      
      const accountId = locationParts[1]
      const locationId = locationParts[3]
      
      // Get posts for the location using v4 API (posts still use v4)
      const postsResponse = await fetch(
        `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/localPosts`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )
      
      if (!postsResponse.ok) {
        const errorData = await postsResponse.text()
        console.error('Posts API error:', errorData)
        throw new Error('Failed to fetch posts')
      }
      
      const postsData = await postsResponse.json()
      const posts = postsData.localPosts || []
      
      return successResponse(
        {
          posts,
          total_posts: posts.length,
          location_name: locationName
        },
        'Posts retrieved successfully'
      )
      
    } catch (error) {
      console.error('Google Business Posts API error:', error)
      throw new Error('Failed to fetch posts')
    }
  }
)

// POST /api/v1/google-business/posts - Create a new business post
export const POST = withMethods(['POST'])(
  async (req: NextRequest) => {
    const body = await req.json()
    const { 
      client_id, 
      location_name, 
      topic_type = 'STANDARD',
      language_code = 'en',
      summary,
      call_to_action,
      media_urls = []
    } = body
    
    if (!client_id || !location_name || !summary) {
      throw new Error('client_id, location_name, and summary are required')
    }
    
    const { integration, supabase } = await getGoogleIntegration(client_id)
    const accessToken = await refreshTokenIfNeeded(integration, supabase)
    
    try {
      // Parse the location name to extract account and location IDs
      // Location name format: accounts/{accountId}/locations/{locationId}
      const locationParts = location_name.split('/')
      if (locationParts.length < 4 || locationParts[0] !== 'accounts' || locationParts[2] !== 'locations') {
        throw new Error('Invalid location name format. Expected: accounts/{accountId}/locations/{locationId}')
      }
      
      const accountId = locationParts[1]
      const locationId = locationParts[3]
      
      // Build post data
      const postData: any = {
        topicType: topic_type,
        languageCode: language_code,
        summary
      }
      
      // Add call to action if provided
      if (call_to_action) {
        postData.callToAction = call_to_action
      }
      
      // Add media if provided
      if (media_urls.length > 0) {
        postData.media = media_urls.map((url: string) => ({
          mediaFormat: 'PHOTO',
          sourceUrl: url
        }))
      }
      
      // Create the post using v4 API (posts still use v4)
      const createResponse = await fetch(
        `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/localPosts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData)
        }
      )
      
      if (!createResponse.ok) {
        const errorData = await createResponse.text()
        console.error('Create post API error:', errorData)
        throw new Error('Failed to create post')
      }
      
      const createdPost = await createResponse.json()
      
      return successResponse(
        {
          post: createdPost,
          location_name: location_name
        },
        'Post created successfully'
      )
      
    } catch (error) {
      console.error('Google Business Create Post API error:', error)
      throw new Error('Failed to create post')
    }
  }
)