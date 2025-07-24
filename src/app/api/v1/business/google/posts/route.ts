// TableTalk Radar - Google My Business Posts API (v1)
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withValidation, 
  withMethods,
  successResponse,
  NotFoundError
} from '@/lib/api-handler'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Request validation schemas
const CreatePostSchema = z.object({
  location_id: z.string().min(1, 'Location ID is required'),
  post_data: z.object({
    type: z.enum(['EVENT', 'OFFER', 'CALL_TO_ACTION']),
    summary: z.string().min(1, 'Summary is required'),
    callToAction: z.object({
      actionType: z.enum(['BOOK', 'ORDER', 'SHOP', 'LEARN_MORE', 'SIGN_UP', 'CALL']),
      url: z.string().url().optional()
    }).optional(),
    event: z.object({
      title: z.string().min(1),
      schedule: z.object({
        startDate: z.string(),
        startTime: z.string().optional(),
        endDate: z.string(),
        endTime: z.string().optional()
      })
    }).optional(),
    offer: z.object({
      title: z.string().min(1),
      couponCode: z.string().optional(),
      redeemOnlineUrl: z.string().url().optional(),
      termsConditions: z.string().optional()
    }).optional(),
    media: z.array(z.object({
      sourceUrl: z.string().url()
    })).optional()
  })
})

const GetPostsSchema = z.object({
  location_id: z.string().min(1, 'Location ID is required')
})

// Helper to get location with client credentials
async function getLocationWithCredentials(locationId: string) {
  const { data: location, error: locationError } = await supabase
    .from('client_locations')
    .select(`
      *,
      clients!inner(
        business_name, 
        agency_id,
        google_refresh_token,
        google_client_id,
        google_client_secret
      )
    `)
    .eq('id', locationId)
    .single()

  if (locationError || !location || !location.google_place_id) {
    throw new NotFoundError('Location or missing Google Place ID')
  }

  const client = location.clients[0]
  if (!client.google_refresh_token) {
    throw new Error('Google Business Profile API requires OAuth 2.0 setup')
  }

  return { location, client }
}

// Helper to format post data for Google API
function formatPostData(postData: any) {
  const formatted: any = {}

  switch (postData.type) {
    case 'EVENT':
      if (postData.event) {
        formatted.event = {
          title: postData.event.title,
          schedule: {
            startDate: {
              year: parseInt(postData.event.schedule.startDate.split('-')[0]),
              month: parseInt(postData.event.schedule.startDate.split('-')[1]),
              day: parseInt(postData.event.schedule.startDate.split('-')[2])
            },
            endDate: {
              year: parseInt(postData.event.schedule.endDate.split('-')[0]),
              month: parseInt(postData.event.schedule.endDate.split('-')[1]),
              day: parseInt(postData.event.schedule.endDate.split('-')[2])
            }
          }
        }
        
        if (postData.event.schedule.startTime) {
          const [hours, minutes] = postData.event.schedule.startTime.split(':')
          formatted.event.schedule.startTime = {
            hours: parseInt(hours),
            minutes: parseInt(minutes)
          }
        }
        
        if (postData.event.schedule.endTime) {
          const [hours, minutes] = postData.event.schedule.endTime.split(':')
          formatted.event.schedule.endTime = {
            hours: parseInt(hours),
            minutes: parseInt(minutes)
          }
        }
      }
      break

    case 'OFFER':
      if (postData.offer) {
        formatted.offer = {
          title: postData.offer.title,
          couponCode: postData.offer.couponCode,
          redeemOnlineUrl: postData.offer.redeemOnlineUrl,
          termsConditions: postData.offer.termsConditions
        }
      }
      break

    case 'CALL_TO_ACTION':
      if (postData.callToAction) {
        formatted.callToAction = {
          actionType: postData.callToAction.actionType,
          url: postData.callToAction.url
        }
      }
      break
  }

  // Add media if provided
  if (postData.media && postData.media.length > 0) {
    formatted.media = postData.media.map((m: any) => ({
      mediaFormat: 'PHOTO',
      sourceUrl: m.sourceUrl
    }))
  }

  return formatted
}

// POST /api/v1/business/google/posts - Create a Google My Business post
export const POST = withMethods(['POST'])(
  withValidation(CreatePostSchema)(
    async (req: NextRequest, data: z.infer<typeof CreatePostSchema>) => {
    const { location_id, post_data } = data
    const { location, client } = await getLocationWithCredentials(location_id)

    // Prepare the post payload
    const postPayload = {
      summary: post_data.summary,
      ...formatPostData(post_data)
    }

    // Create post via Supabase Edge Function
    const { data: edgeData, error } = await supabase.functions.invoke('gmb-schedule', {
      body: {
        refresh_token: client.google_refresh_token,
        account_id: location.google_account_id,
        client_id: client.google_client_id,
        client_secret: client.google_client_secret,
        location_id: location.google_place_id,
        update_type: 'post',
        update_data: postPayload,
        scheduled_time: null // immediate posting
      }
    })

    if (error) {
      throw new Error(`Failed to create Google My Business post: ${error.message || 'Unknown error'}`)
    }

    // Store post record in database
    const { data: savedPost, error: saveError } = await supabase
      .from('google_business_posts')
      .insert({
        location_id: location_id,
        client_id: location.client_id,
        agency_id: client.agency_id,
        google_post_id: edgeData.result?.name || `post_${Date.now()}`,
        post_type: post_data.type,
        summary: post_data.summary,
        post_data: postPayload,
        google_response: edgeData.result,
        status: 'published',
        published_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving post to database:', saveError)
    }

    return successResponse(
      {
        post: edgeData.result,
        database_record: savedPost
      },
      'Google My Business post created successfully'
    )
    }
  )
)

// GET /api/v1/business/google/posts - Retrieve posts for a location
export const GET = withMethods(['GET'])(
  withValidation(GetPostsSchema)(
    async (req: NextRequest, query: z.infer<typeof GetPostsSchema>) => {
    const { location_id } = query

    const { data: posts, error } = await supabase
      .from('google_business_posts')
      .select('*')
      .eq('location_id', location_id)
      .order('published_at', { ascending: false })

    if (error) {
      throw error
    }

    return successResponse(
      { posts: posts || [] },
      `Retrieved ${posts?.length || 0} posts for location`
    )
    }
  )
)