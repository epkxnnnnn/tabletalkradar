import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { review_id, reply_text } = await request.json()

    if (!review_id || !reply_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get review and client credentials from database
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
      .eq('id', review_id)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const client = review.client_locations.clients[0]
    if (!client.google_refresh_token) {
      return NextResponse.json({ 
        error: 'Google Business Profile API requires OAuth 2.0 setup',
        setup_required: true 
      }, { status: 400 })
    }

    // Extract Google review ID from external_review_id
    const googleReviewId = review.external_review_id?.replace('google_', '').split('_')[1]
    if (!googleReviewId) {
      return NextResponse.json({ 
        error: 'Invalid Google review ID format' 
      }, { status: 400 })
    }

    // Call Supabase Edge Function for GMB reply
    const { data, error } = await supabase.functions.invoke('gmb-reply', {
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
      return NextResponse.json({ 
        error: 'Failed to post reply to Google',
        details: error.message || 'Unknown error'
      }, { status: 400 })
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
        agency_id: client.agency_id,
        activity_type: 'reply_posted',
        activity_data: {
          reply_text: reply_text,
          google_response: data
        },
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      reply: data.reply,
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

// DELETE endpoint to remove a reply (Note: GMB API may not support this - keeping for future use)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('review_id')

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 })
    }

    // For now, just update the database status since Google doesn't always allow reply deletion
    await supabase
      .from('reviews')
      .update({
        response_status: 'pending',
        response_text: null,
        response_date: null,
        google_reply_data: null
      })
      .eq('id', reviewId)

    return NextResponse.json({
      success: true,
      message: 'Reply status updated (Google My Business may not support reply deletion)'
    })

  } catch (error) {
    console.error('Error updating review reply status:', error)
    return NextResponse.json(
      { error: 'Failed to update reply status' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch reviews with AI-generated reply suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')

    if (!locationId) {
      return NextResponse.json({ error: 'Location ID required' }, { status: 400 })
    }

    // Get location and client details
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
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

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
                location_id: locationId,
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