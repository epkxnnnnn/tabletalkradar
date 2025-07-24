// TableTalk Radar - Google My Business Review Replies API (v1)
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withValidation, 
  withMethods,
  successResponse,
  ValidationError,
  NotFoundError
} from '@/lib/api-handler'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Request validation schemas
const PostReplySchema = z.object({
  review_id: z.string().min(1, 'Review ID is required'),
  reply_text: z.string().min(1, 'Reply text is required')
})

const DeleteReplySchema = z.object({
  review_id: z.string().min(1, 'Review ID is required')
})

const GetRepliesSchema = z.object({
  location_id: z.string().min(1, 'Location ID is required')
})

// Helper to get review with client credentials
async function getReviewWithCredentials(reviewId: string) {
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .select(`
      *,
      client_locations!inner(
        google_place_id,
        google_account_id,
        clients!inner(
          agency_id,
          google_refresh_token,
          google_client_id,
          google_client_secret,
          business_name
        )
      )
    `)
    .eq('id', reviewId)
    .single()

  if (reviewError || !review) {
    throw new NotFoundError('Review')
  }

  const client = review.client_locations.clients[0]
  if (!client.google_refresh_token) {
    throw new Error('Google Business Profile API requires OAuth 2.0 setup')
  }

  return { review, client }
}

// Helper to get location with client details
async function getLocationWithClient(locationId: string) {
  const { data: location, error: locationError } = await supabase
    .from('client_locations')
    .select(`
      *,
      clients!inner(
        agency_id,
        google_refresh_token,
        google_client_id,
        google_client_secret,
        business_name
      )
    `)
    .eq('id', locationId)
    .single()

  if (locationError || !location) {
    throw new NotFoundError('Location')
  }

  return location
}

// POST /api/v1/business/google/review-replies - Reply to a Google review
export const POST = withMethods(['POST'])(
  withValidation(PostReplySchema)(
    async (req: NextRequest, data: z.infer<typeof PostReplySchema>) => {
    const { review_id, reply_text } = data
    const { review, client } = await getReviewWithCredentials(review_id)

    // Extract Google review ID from external_review_id
    const googleReviewId = review.external_review_id?.replace('google_', '').split('_')[1]
    if (!googleReviewId) {
      throw new ValidationError('Invalid Google review ID format', ['external_review_id format is invalid'])
    }

    // Call Supabase Edge Function for GMB reply
    const { data: edgeData, error } = await supabase.functions.invoke('gmb-reply', {
      body: {
        refresh_token: client.google_refresh_token,
        account_id: review.client_locations.google_account_id,
        client_id: client.google_client_id,
        client_secret: client.google_client_secret,
        location_id: review.client_locations.google_place_id,
        review_id: googleReviewId,
        reply_text: reply_text
      }
    })

    if (error) {
      throw new Error(`Failed to post reply to Google: ${error.message || 'Unknown error'}`)
    }

    // Update review status in database
    const { error: updateError } = await supabase
      .from('reviews')
      .update({
        response_status: 'responded',
        response_text: reply_text,
        response_date: new Date().toISOString(),
        google_reply_data: edgeData
      })
      .eq('id', review_id)

    if (updateError) {
      console.error('Error updating review status:', updateError)
    }

    // Log the reply activity
    await supabase
      .from('review_activities')
      .insert({
        review_id: review_id,
        location_id: review.location_id,
        client_id: review.client_id,
        agency_id: client.agency_id,
        activity_type: 'reply_posted',
        activity_data: {
          reply_text: reply_text,
          google_response: edgeData
        },
        created_at: new Date().toISOString()
      })

    return successResponse(
      { 
        reply: edgeData.reply,
        review_id: review_id 
      },
      'Reply posted successfully to Google My Business'
    )
    }
  )
)

// DELETE /api/v1/business/google/review-replies - Remove a reply
export const DELETE = withMethods(['DELETE'])(
  withValidation(DeleteReplySchema)(
    async (req: NextRequest, query: z.infer<typeof DeleteReplySchema>) => {
    const { review_id } = query

    // For now, just update the database status since Google doesn't always allow reply deletion
    await supabase
      .from('reviews')
      .update({
        response_status: 'pending',
        response_text: null,
        response_date: null,
        google_reply_data: null
      })
      .eq('id', review_id)

    return successResponse(
      { review_id },
      'Reply status updated (Google My Business may not support reply deletion)'
    )
    }
  )
)

// GET /api/v1/business/google/review-replies - Fetch reviews with AI-generated reply suggestions
export const GET = withMethods(['GET'])(
  withValidation(GetRepliesSchema)(
    async (req: NextRequest, query: z.infer<typeof GetRepliesSchema>) => {
    const { location_id } = query
    const location = await getLocationWithClient(location_id)
    const client = location.clients[0]
    
    // If we have Google credentials, fetch reviews with AI suggestions via Edge Function
    if (client.google_refresh_token) {
      const { data: reviewsData, error: reviewsError } = await supabase.functions.invoke('gmb-reviews', {
        body: {
          refresh_token: client.google_refresh_token,
          account_id: location.google_account_id,
          client_id: client.google_client_id,
          client_secret: client.google_client_secret,
          business_name: client.business_name
        }
      })

      if (reviewsError) {
        console.error('Error fetching reviews from Edge Function:', reviewsError)
      } else if (reviewsData) {
        // Process and store reviews in database
        const locations = reviewsData.locations?.locations || []
        for (const loc of locations) {
          const locId = loc.name.split('/').pop()
          const reviews = reviewsData.reviews?.[locId]?.reviews || []
          
          for (const review of reviews) {
            await supabase
              .from('reviews')
              .upsert({
                location_id: location_id,
                client_id: location.client_id,
                platform: 'google',
                external_review_id: `google_${locId}_${review.reviewId || review.name}`,
                reviewer_name: review.reviewer?.displayName || 'Anonymous',
                rating: review.starRating || 0,
                review_text: review.comment || '',
                review_date: review.createTime || new Date().toISOString(),
                response_status: review.reviewReply ? 'responded' : 'pending',
                response_text: review.reviewReply?.comment || null,
                response_date: review.reviewReply?.updateTime || null,
                ai_suggested_reply: review.suggested_reply || null,
                sentiment: review.starRating >= 4 ? 'positive' : review.starRating >= 3 ? 'neutral' : 'negative'
              }, {
                onConflict: 'external_review_id'
              })
          }
        }
      }
    }

    // Fetch reviews from database
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        id,
        reviewer_name,
        rating,
        review_text,
        review_date,
        response_status,
        response_text,
        response_date,
        sentiment,
        platform,
        ai_suggested_reply
      `)
      .eq('location_id', location_id)
      .eq('platform', 'google')
      .order('review_date', { ascending: false })

    if (error) {
      throw error
    }

    // Calculate reply statistics
    const totalReviews = reviews?.length || 0
    const repliedReviews = reviews?.filter(r => r.response_status === 'responded').length || 0
    const replyRate = totalReviews > 0 ? Math.round((repliedReviews / totalReviews) * 100) : 0

    return successResponse(
      {
        reviews: reviews || [],
        statistics: {
          total_reviews: totalReviews,
          replied_reviews: repliedReviews,
          reply_rate: replyRate,
          pending_replies: totalReviews - repliedReviews
        }
      },
      `Retrieved ${totalReviews} reviews for location`
    )
    }
  )
)