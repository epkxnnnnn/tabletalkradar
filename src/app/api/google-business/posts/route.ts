import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface GoogleMyBusinessPost {
  type: 'EVENT' | 'OFFER' | 'CALL_TO_ACTION'
  summary: string
  callToAction?: {
    actionType: 'BOOK' | 'ORDER' | 'SHOP' | 'LEARN_MORE' | 'SIGN_UP' | 'CALL'
    url?: string
  }
  event?: {
    title: string
    schedule: {
      startDate: string
      startTime?: string
      endDate: string
      endTime?: string
    }
  }
  offer?: {
    title: string
    couponCode?: string
    redeemOnlineUrl?: string
    termsConditions?: string
  }
  media?: {
    mediaFormat: 'PHOTO'
    sourceUrl: string
  }[]
}

export async function POST(request: NextRequest) {
  try {
    const { location_id, post_data } = await request.json()

    if (!location_id || !post_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get location and client details
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
      .eq('id', location_id)
      .single()

    if (locationError || !location || !location.google_place_id) {
      return NextResponse.json({ 
        error: 'Location not found or missing Google Place ID' 
      }, { status: 404 })
    }

    const client = location.clients[0]
    if (!client.google_refresh_token) {
      return NextResponse.json({ 
        error: 'Google Business Profile API requires OAuth 2.0 setup',
        setup_required: true 
      }, { status: 400 })
    }

    // Prepare the post payload
    const postPayload = {
      summary: post_data.summary,
      ...formatPostData(post_data)
    }

    // Create post via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('gmb-schedule', {
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
      return NextResponse.json({ 
        error: 'Failed to create Google My Business post',
        details: error.message || 'Unknown error'
      }, { status: 400 })
    }

    // Store post record in database
    const { data: savedPost, error: saveError } = await supabase
      .from('google_business_posts')
      .insert({
        location_id: location_id,
        client_id: location.client_id,
        agency_id: client.agency_id,
        google_post_id: data.result?.name || `post_${Date.now()}`,
        post_type: post_data.type,
        summary: post_data.summary,
        post_data: postPayload,
        google_response: data.result,
        status: 'published',
        published_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving post to database:', saveError)
    }

    return NextResponse.json({
      success: true,
      post: data.result,
      database_record: savedPost
    })

  } catch (error) {
    console.error('Error creating Google My Business post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve posts for a location
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')

    if (!locationId) {
      return NextResponse.json({ error: 'Location ID required' }, { status: 400 })
    }

    const { data: posts, error } = await supabase
      .from('google_business_posts')
      .select('*')
      .eq('location_id', locationId)
      .order('published_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ posts: posts || [] })

  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

function formatPostData(postData: any) {
  const formatted: any = {}

  switch (postData.type) {
    case 'EVENT':
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
      break

    case 'OFFER':
      formatted.offer = {
        title: postData.offer.title,
        couponCode: postData.offer.couponCode,
        redeemOnlineUrl: postData.offer.redeemOnlineUrl,
        termsConditions: postData.offer.termsConditions
      }
      break

    case 'CALL_TO_ACTION':
      formatted.callToAction = {
        actionType: postData.callToAction.actionType,
        url: postData.callToAction.url
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