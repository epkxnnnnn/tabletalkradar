import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GOOGLE_ACCESS_TOKEN = process.env.GOOGLE_BUSINESS_ACCESS_TOKEN

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_ACCESS_TOKEN) {
      return NextResponse.json({ 
        error: 'Google Business Profile API requires OAuth 2.0 setup',
        setup_required: true 
      }, { status: 400 })
    }

    const { review_id, reply_text } = await request.json()

    if (!review_id || !reply_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get review details from database
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select(`
        *,
        client_locations!inner(
          google_place_id,
          google_account_id,
          clients!inner(agency_id)
        )
      `)
      .eq('id', review_id)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    if (!review.client_locations.google_place_id) {
      return NextResponse.json({ 
        error: 'Google Place ID not found for this location' 
      }, { status: 400 })
    }

    // Extract Google review ID from external_review_id
    const googleReviewId = review.external_review_id?.replace('google_', '').split('_')[1]
    if (!googleReviewId) {
      return NextResponse.json({ 
        error: 'Invalid Google review ID format' 
      }, { status: 400 })
    }

    const accountId = review.client_locations.google_account_id
    const locationId = review.client_locations.google_place_id

    // Create reply via Google My Business API
    const response = await fetch(
      `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${googleReviewId}/reply`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GOOGLE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment: reply_text
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to post reply to Google',
        details: data.error?.message || 'Unknown error'
      }, { status: response.status })
    }

    // Update review status in database
    const { error: updateError } = await supabase
      .from('reviews')
      .update({
        response_status: 'responded',
        response_text: reply_text,
        response_date: new Date().toISOString(),
        google_reply_data: data
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
        agency_id: review.client_locations.clients.agency_id,
        activity_type: 'reply_posted',
        activity_data: {
          reply_text: reply_text,
          google_response: data
        },
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      reply: data,
      message: 'Reply posted successfully to Google My Business'
    })

  } catch (error) {
    console.error('Error posting review reply:', error)
    return NextResponse.json(
      { error: 'Failed to post reply' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove a reply
export async function DELETE(request: NextRequest) {
  try {
    if (!GOOGLE_ACCESS_TOKEN) {
      return NextResponse.json({ 
        error: 'Google Business Profile API requires OAuth 2.0 setup',
        setup_required: true 
      }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('review_id')

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 })
    }

    // Get review details
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select(`
        *,
        client_locations!inner(
          google_place_id,
          google_account_id,
          clients!inner(agency_id)
        )
      `)
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const googleReviewId = review.external_review_id?.replace('google_', '').split('_')[1]
    const accountId = review.client_locations.google_account_id
    const locationId = review.client_locations.google_place_id

    // Delete reply via Google My Business API
    const response = await fetch(
      `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${googleReviewId}/reply`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${GOOGLE_ACCESS_TOKEN}`
        }
      }
    )

    if (!response.ok) {
      const data = await response.json()
      return NextResponse.json({ 
        error: 'Failed to delete reply from Google',
        details: data.error?.message || 'Unknown error'
      }, { status: response.status })
    }

    // Update review status in database
    await supabase
      .from('reviews')
      .update({
        response_status: 'pending',
        response_text: null,
        response_date: null,
        google_reply_data: null
      })
      .eq('id', reviewId)

    // Log the activity
    await supabase
      .from('review_activities')
      .insert({
        review_id: reviewId,
        location_id: review.location_id,
        client_id: review.client_id,
        agency_id: review.client_locations.clients.agency_id,
        activity_type: 'reply_deleted',
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: 'Reply deleted successfully from Google My Business'
    })

  } catch (error) {
    console.error('Error deleting review reply:', error)
    return NextResponse.json(
      { error: 'Failed to delete reply' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch reply status and data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')

    if (!locationId) {
      return NextResponse.json({ error: 'Location ID required' }, { status: 400 })
    }

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
        platform
      `)
      .eq('location_id', locationId)
      .eq('platform', 'google')
      .order('review_date', { ascending: false })

    if (error) {
      throw error
    }

    // Calculate reply statistics
    const totalReviews = reviews?.length || 0
    const repliedReviews = reviews?.filter(r => r.response_status === 'responded').length || 0
    const replyRate = totalReviews > 0 ? Math.round((repliedReviews / totalReviews) * 100) : 0

    return NextResponse.json({
      reviews: reviews || [],
      statistics: {
        total_reviews: totalReviews,
        replied_reviews: repliedReviews,
        reply_rate: replyRate,
        pending_replies: totalReviews - repliedReviews
      }
    })

  } catch (error) {
    console.error('Error fetching review replies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch review replies' },
      { status: 500 }
    )
  }
}