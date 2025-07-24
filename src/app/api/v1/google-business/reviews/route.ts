// TableTalk Radar - Google Business Profile Reviews API
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

// GET /api/v1/google-business/reviews - Get business reviews
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
      
      // Get reviews for the location using v4 API (reviews still use v4)
      const reviewsResponse = await fetch(
        `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )
      
      if (!reviewsResponse.ok) {
        const errorData = await reviewsResponse.text()
        console.error('Reviews API error:', errorData)
        throw new Error('Failed to fetch reviews')
      }
      
      const reviewsData = await reviewsResponse.json()
      const reviews = reviewsData.reviews || []
      
      // Process reviews for better structure
      const processedReviews = reviews.map((review: any) => ({
        name: review.name,
        reviewId: review.reviewId,
        reviewer: review.reviewer,
        starRating: review.starRating,
        comment: review.comment,
        createTime: review.createTime,
        updateTime: review.updateTime,
        reviewReply: review.reviewReply,
        location: locationName
      }))
      
      return successResponse(
        {
          reviews: processedReviews,
          total_reviews: processedReviews.length,
          location_name: locationName
        },
        'Reviews retrieved successfully'
      )
      
    } catch (error) {
      console.error('Google Business Reviews API error:', error)
      throw new Error('Failed to fetch reviews')
    }
  }
)

// POST /api/v1/google-business/reviews - Reply to a review
export const POST = withMethods(['POST'])(
  async (req: NextRequest) => {
    const body = await req.json()
    const { client_id, review_name, reply_text } = body
    
    if (!client_id || !review_name || !reply_text) {
      throw new Error('client_id, review_name, and reply_text are required')
    }
    
    const { integration, supabase } = await getGoogleIntegration(client_id)
    const accessToken = await refreshTokenIfNeeded(integration, supabase)
    
    try {
      // Parse the review name to extract account, location, and review IDs
      // Review name format: accounts/{accountId}/locations/{locationId}/reviews/{reviewId}
      const reviewParts = review_name.split('/')
      if (reviewParts.length < 6 || reviewParts[0] !== 'accounts' || reviewParts[2] !== 'locations' || reviewParts[4] !== 'reviews') {
        throw new Error('Invalid review name format. Expected: accounts/{accountId}/locations/{locationId}/reviews/{reviewId}')
      }
      
      const accountId = reviewParts[1]
      const locationId = reviewParts[3]
      const reviewId = reviewParts[5]
      
      // Reply to the review using v4 API (reviews still use v4)
      const replyResponse = await fetch(
        `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment: reply_text
          })
        }
      )
      
      if (!replyResponse.ok) {
        const errorData = await replyResponse.text()
        console.error('Review reply API error:', errorData)
        throw new Error('Failed to reply to review')
      }
      
      const replyData = await replyResponse.json()
      
      return successResponse(
        {
          reply: replyData,
          review_name: review_name,
          reply_text: reply_text
        },
        'Review reply posted successfully'
      )
      
    } catch (error) {
      console.error('Google Business Review Reply API error:', error)
      throw new Error('Failed to reply to review')
    }
  }
)