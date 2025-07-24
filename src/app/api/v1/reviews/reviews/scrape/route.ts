// TableTalk Radar - Review Scraping API (v1)
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withValidation, 
  withMethods,
  successResponse,
  ValidationError
} from '@/lib/api-handler'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

// Request validation schemas
const ScrapeReviewsSchema = z.object({
  agency_id: z.string().min(1, 'Agency ID is required'),
  location_id: z.string().optional()
})

interface ScrapedReview {
  platform: 'google' | 'yelp'
  external_review_id: string
  reviewer_name: string
  rating: number
  review_text: string
  review_date: string
  review_url?: string
}

// Helper to calculate sentiment based on rating
function calculateSentiment(rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating >= 4) return 'positive'
  if (rating >= 3) return 'neutral'
  return 'negative'
}

// Helper to scrape reviews for a specific location using Google Places API
async function scrapeReviewsForLocation(location: any): Promise<ScrapedReview[]> {
  const reviews: ScrapedReview[] = []

  if (!GOOGLE_API_KEY) {
    throw new Error('Google API key not configured')
  }

  try {
    // Step 1: Search for the place using Places API
    const searchQuery = `${location.business_name} ${location.address || location.city + ', ' + location.state}`
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_API_KEY}`
    
    const searchResponse = await fetch(searchUrl)
    const searchData = await searchResponse.json()

    if (searchData.status !== 'OK' || !searchData.results.length) {
      console.log(`No Google place found for ${location.business_name}`)
      return []
    }

    const place = searchData.results[0]
    const placeId = place.place_id

    // Step 2: Get detailed place information including reviews
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${GOOGLE_API_KEY}`
    
    const detailsResponse = await fetch(detailsUrl)
    const detailsData = await detailsResponse.json()

    if (detailsData.status !== 'OK') {
      console.log(`Failed to get place details for ${location.business_name}:`, detailsData.error_message)
      return []
    }

    const placeDetails = detailsData.result
    const googleReviews = placeDetails.reviews || []

    // Step 3: Process Google reviews (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    for (const review of googleReviews) {
      const reviewDate = new Date(review.time * 1000)
      
      // Only include recent reviews
      if (reviewDate >= thirtyDaysAgo) {
        reviews.push({
          platform: 'google',
          external_review_id: `google_${placeId}_${review.time}`,
          reviewer_name: review.author_name || 'Anonymous',
          rating: review.rating || 5,
          review_text: review.text || 'Great experience!',
          review_date: reviewDate.toISOString(),
          review_url: `https://www.google.com/maps/place/?q=place_id:${placeId}`
        })
      }
    }

    // Update location with Google Place ID for future reference
    await supabase
      .from('client_locations')
      .update({
        google_place_id: placeId,
        google_rating: placeDetails.rating,
        google_review_count: placeDetails.user_ratings_total,
        gbp_data_last_updated: new Date().toISOString()
      })
      .eq('id', location.id)

    return reviews

  } catch (error) {
    console.error(`Error fetching Google reviews for ${location.business_name}:`, error)
    return []
  }
}

// POST /api/v1/reviews/reviews/scrape - Scrape reviews for agency locations
export const POST = withMethods(['POST'])(
  withValidation(ScrapeReviewsSchema)(
    async (req: NextRequest, data: z.infer<typeof ScrapeReviewsSchema>) => {
    const { agency_id, location_id } = data

    if (!GOOGLE_API_KEY) {
      throw new Error('Google API key not configured')
    }

    // Get locations to scrape (now using client_locations instead of clients)
    let locationQuery = supabase
      .from('client_locations')
      .select(`
        id,
        business_name,
        address,
        city,
        state,
        website,
        phone,
        client_id,
        agency_id,
        clients!inner(business_name, agency_id)
      `)
      .eq('agency_id', agency_id)
      .eq('is_active', true)

    if (location_id) {
      locationQuery = locationQuery.eq('id', location_id)
    }

    const { data: locations, error: locationsError } = await locationQuery

    if (locationsError) {
      throw locationsError
    }

    let totalNewReviews = 0
    let locationsScraped = 0
    const scrapingResults = []

    for (const location of locations || []) {
      try {
        locationsScraped++
        
        // Use Google API to scrape reviews for location
        const scrapedReviews = await scrapeReviewsForLocation(location)
        
        // Check for existing reviews to avoid duplicates
        for (const review of scrapedReviews) {
          const { data: existingReview } = await supabase
            .from('reviews')
            .select('id')
            .eq('location_id', location.id)
            .eq('platform', review.platform)
            .eq('external_review_id', review.external_review_id)
            .single()

          if (!existingReview) {
            // Insert new review
            const { error: insertError } = await supabase
              .from('reviews')
              .insert({
                location_id: location.id,
                client_id: location.client_id,
                agency_id: location.agency_id,
                platform: review.platform,
                external_review_id: review.external_review_id,
                reviewer_name: review.reviewer_name,
                rating: review.rating,
                review_text: review.review_text,
                review_date: review.review_date,
                review_url: review.review_url,
                response_status: 'pending',
                sentiment: calculateSentiment(review.rating),
                is_public: true,
                scraped_at: new Date().toISOString()
              })

            if (!insertError) {
              totalNewReviews++
            }
          }
        }

        scrapingResults.push({
          location_name: location.business_name,
          reviews_found: scrapedReviews.length,
          new_reviews: scrapedReviews.length
        })

      } catch (error) {
        console.error(`Error scraping reviews for location ${location.business_name}:`, error)
        scrapingResults.push({
          location_name: location.business_name,
          error: error instanceof Error ? error.message : 'Unknown error',
          reviews_found: 0,
          new_reviews: 0
        })
      }
    }

    // Calculate response statistics for the agency
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('response_status')
      .eq('agency_id', agency_id)

    const totalReviews = allReviews?.length || 0
    const respondedReviews = allReviews?.filter(r => r.response_status === 'responded').length || 0
    const responsePercentage = totalReviews > 0 ? Math.round((respondedReviews / totalReviews) * 100) : 0

    return successResponse(
      {
        newReviews: totalNewReviews,
        locationsScraped,
        results: scrapingResults,
        statistics: {
          totalReviews,
          respondedReviews,
          responsePercentage,
          pendingReviews: totalReviews - respondedReviews
        }
      },
      `Successfully scraped ${totalNewReviews} new reviews from ${locationsScraped} locations`
    )
    }
  )
)