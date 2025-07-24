// TableTalk Radar - Google-Specific Review Scraping API (v1)
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

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

// Request validation schemas
const GoogleScrapePostSchema = z.object({
  location_id: z.string().min(1, 'Location ID is required'),
  business_name: z.string().min(1, 'Business name is required'),
  address: z.string().optional()
})

const GoogleScrapeGetSchema = z.object({
  location_id: z.string().min(1, 'Location ID is required')
})

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

interface LocationUpdateData {
  google_place_id: string
  google_rating: number
  google_review_count: number
  business_description: string
  google_listing_completeness: number
  gbp_data_last_updated: string
  address?: string
  phone?: string
  website?: string
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

// Helper to calculate sentiment based on rating
function calculateSentiment(rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating >= 4) return 'positive'
  if (rating >= 3) return 'neutral'
  return 'negative'
}

// Helper to calculate Google listing completeness
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

// POST /api/v1/reviews/reviews/google-scrape - Scrape Google reviews for specific location
export const POST = withMethods(['POST'])(
  withValidation(GoogleScrapePostSchema)(
    async (req: NextRequest, data: z.infer<typeof GoogleScrapePostSchema>) => {
    const { location_id, business_name, address } = data

    if (!GOOGLE_API_KEY) {
      throw new Error('Google API key not configured')
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
      throw new NotFoundError('Location')
    }

    // Step 1: Search for the place using Places API
    const searchQuery = `${business_name} ${address || location.address || location.city}`
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_API_KEY}`
    
    const searchResponse = await fetch(searchUrl)
    const searchData = await searchResponse.json()

    if (searchData.status !== 'OK' || !searchData.results.length) {
      throw new Error(`Business not found on Google: ${searchData.error_message || 'No results found'}`)
    }

    const place = searchData.results[0]
    const placeId = place.place_id

    // Step 2: Get detailed place information including reviews
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews,formatted_address,formatted_phone_number,website,opening_hours,photos&key=${GOOGLE_API_KEY}`
    
    const detailsResponse = await fetch(detailsUrl)
    const detailsData = await detailsResponse.json()

    if (detailsData.status !== 'OK') {
      throw new Error(`Failed to get place details: ${detailsData.error_message}`)
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
            agency_id: location.clients?.[0]?.agency_id,
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
    const updateData: LocationUpdateData = {
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

    return successResponse(
      {
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
      },
      `Successfully scraped ${newReviewsCount} new Google reviews for ${location.business_name}`
    )
    }
  )
)

// GET /api/v1/reviews/reviews/google-scrape - Fetch current Google data for a location
export const GET = withMethods(['GET'])(
  withValidation(GoogleScrapeGetSchema)(
    async (req: NextRequest, query: z.infer<typeof GoogleScrapeGetSchema>) => {
    const { location_id } = query

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('location_id', location_id)
      .eq('platform', 'google')
      .order('review_date', { ascending: false })
      .limit(20)

    if (error) {
      throw error
    }

    return successResponse(
      { reviews: reviews || [] },
      `Retrieved ${reviews?.length || 0} Google reviews for location`
    )
    }
  )
)