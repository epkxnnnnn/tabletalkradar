import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

interface ClientLocation {
  id: string
  business_name: string
  location_name?: string
  city: string
  state: string
  client_id: string
  agency_id: string
  google_place_id?: string
  google_rating?: number
  google_review_count?: number
  google_listing_completeness?: number
  gbp_data_last_updated?: string
  address?: string
  phone?: string
  website?: string
  clients?: {
    business_name: string
    agency_id: string
  }[]
}

interface GooglePlaceDetails {
  place_id: string
  name: string
  rating: number
  user_ratings_total: number
  reviews: GoogleReview[]
  formatted_address: string
  formatted_phone_number?: string
  website?: string
  opening_hours?: {
    open_now: boolean
    weekday_text: string[]
  }
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
}

interface GoogleReview {
  author_name: string
  author_url?: string
  profile_photo_url?: string
  rating: number
  relative_time_description: string
  text: string
  time: number
  language?: string
}

export async function POST(request: NextRequest) {
  try {
    const { location_id, business_name, address } = await request.json()

    if (!location_id || !business_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 })
    }

    // Get location details from database
    const { data: location, error: locationError }: { data: ClientLocation | null, error: any } = await supabase
      .from('client_locations')
      .select(`
        *,
        clients!inner(business_name, agency_id)
      `)
      .eq('id', location_id)
      .single()

    if (locationError || !location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Step 1: Search for the place using Places API
    const searchQuery = `${business_name} ${address || location.address || location.city}`
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_API_KEY}`
    
    const searchResponse = await fetch(searchUrl)
    const searchData = await searchResponse.json()

    if (searchData.status !== 'OK' || !searchData.results.length) {
      return NextResponse.json({ 
        error: 'Business not found on Google',
        details: searchData.error_message || 'No results found'
      }, { status: 404 })
    }

    const place = searchData.results[0]
    const placeId = place.place_id

    // Step 2: Get detailed place information including reviews
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews,formatted_address,formatted_phone_number,website,opening_hours,photos&key=${GOOGLE_API_KEY}`
    
    const detailsResponse = await fetch(detailsUrl)
    const detailsData = await detailsResponse.json()

    if (detailsData.status !== 'OK') {
      return NextResponse.json({ 
        error: 'Failed to get place details',
        details: detailsData.error_message
      }, { status: 500 })
    }

    const placeDetails: GooglePlaceDetails = detailsData.result
    const reviews = placeDetails.reviews || []

    // Step 3: Process and store reviews
    const processedReviews = []
    let newReviewsCount = 0

    for (const review of reviews) {
      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('location_id', location_id)
        .eq('platform', 'google')
        .eq('external_review_id', `google_${placeId}_${review.time}`)
        .single()

      if (!existingReview) {
        // Insert new review
        const { data: newReview, error: reviewError } = await supabase
          .from('reviews')
          .insert({
            location_id: location_id,
            client_id: location.client_id,
            agency_id: location.clients.agency_id,
            platform: 'google',
            external_review_id: `google_${placeId}_${review.time}`,
            reviewer_name: review.author_name,
            reviewer_avatar: review.profile_photo_url,
            reviewer_profile_url: review.author_url,
            rating: review.rating,
            review_text: review.text,
            review_date: new Date(review.time * 1000).toISOString(),
            language: review.language || 'en',
            sentiment: calculateSentiment(review.rating),
            response_status: 'pending',
            is_public: true,
            metadata: {
              relative_time: review.relative_time_description,
              google_place_id: placeId
            }
          })
          .select()
          .single()

        if (!reviewError && newReview) {
          processedReviews.push(newReview)
          newReviewsCount++
        }
      }
    }

    // Step 4: Update location with Google Business Profile data
    const updateData = {
      google_place_id: placeId,
      google_rating: placeDetails.rating,
      google_review_count: placeDetails.user_ratings_total,
      business_description: placeDetails.name,
      google_listing_completeness: calculateListingCompleteness(placeDetails),
      gbp_data_last_updated: new Date().toISOString()
    }

    // Update formatted address if we got a better one
    if (placeDetails.formatted_address && !location.address?.includes(placeDetails.formatted_address.split(',')[0])) {
      updateData.address = placeDetails.formatted_address
    }

    // Update phone if we got one
    if (placeDetails.formatted_phone_number && !location.phone) {
      updateData.phone = placeDetails.formatted_phone_number
    }

    // Update website if we got one
    if (placeDetails.website && !location.website) {
      updateData.website = placeDetails.website
    }

    await supabase
      .from('client_locations')
      .update(updateData)
      .eq('id', location_id)

    // Step 5: Calculate response statistics
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('response_status')
      .eq('location_id', location_id)
      .eq('platform', 'google')

    const totalReviews = allReviews?.length || 0
    const respondedReviews = allReviews?.filter(r => r.response_status === 'responded').length || 0
    const responsePercentage = totalReviews > 0 ? Math.round((respondedReviews / totalReviews) * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        location_name: location.business_name,
        google_place_id: placeId,
        total_reviews_found: reviews.length,
        new_reviews_imported: newReviewsCount,
        existing_reviews_skipped: reviews.length - newReviewsCount,
        total_reviews_in_system: totalReviews,
        response_rate: responsePercentage,
        google_rating: placeDetails.rating,
        google_review_count: placeDetails.user_ratings_total,
        listing_completeness: calculateListingCompleteness(placeDetails),
        business_profile: {
          name: placeDetails.name,
          address: placeDetails.formatted_address,
          phone: placeDetails.formatted_phone_number,
          website: placeDetails.website,
          currently_open: placeDetails.opening_hours?.open_now,
          has_photos: (placeDetails.photos?.length || 0) > 0
        },
        processed_reviews: processedReviews
      }
    })

  } catch (error) {
    console.error('Google scraping error:', error)
    return NextResponse.json(
      { error: 'Failed to scrape Google reviews' },
      { status: 500 }
    )
  }
}

function calculateSentiment(rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating >= 4) return 'positive'
  if (rating >= 3) return 'neutral'
  return 'negative'
}

function calculateListingCompleteness(place: GooglePlaceDetails): number {
  let completeness = 0
  const maxPoints = 10

  // Basic info (4 points)
  if (place.name) completeness += 1
  if (place.formatted_address) completeness += 1
  if (place.formatted_phone_number) completeness += 1
  if (place.website) completeness += 1

  // Hours (1 point)  
  if (place.opening_hours) completeness += 1

  // Photos (2 points)
  if (place.photos && place.photos.length > 0) {
    completeness += place.photos.length >= 5 ? 2 : 1
  }

  // Reviews (2 points)
  if (place.user_ratings_total) {
    completeness += place.user_ratings_total >= 10 ? 2 : 1
  }

  // Rating (1 point)
  if (place.rating && place.rating >= 3.0) completeness += 1

  return Math.round((completeness / maxPoints) * 100)
}

// GET endpoint to fetch current Google data for a location
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')

    if (!locationId) {
      return NextResponse.json({ error: 'Location ID required' }, { status: 400 })
    }

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('location_id', locationId)
      .eq('platform', 'google')
      .order('review_date', { ascending: false })
      .limit(20)

    if (error) {
      throw error
    }

    return NextResponse.json({ reviews: reviews || [] })

  } catch (error) {
    console.error('Error fetching Google reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Google reviews' },
      { status: 500 }
    )
  }
}