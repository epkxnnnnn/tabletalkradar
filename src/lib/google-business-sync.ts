import { supabaseAdmin } from './supabase-admin'
import { googleBusinessService } from './google-business'
import { logger } from './logger'

interface GoogleBusinessSyncConfig {
  clientId: string
  locationId: string
  googleAccountId: string
  accessToken: string
}

export class GoogleBusinessSyncService {
  /**
   * Link a client location to Google Business Profile
   */
  async linkClientToGoogleBusiness(config: GoogleBusinessSyncConfig) {
    try {
      // Store the Google Business integration
      const { data: integration, error: integrationError } = await (supabaseAdmin() as any)
        .from('integrations')
        .upsert({
          user_id: config.clientId,
          client_id: config.clientId,
          provider: 'google_business',
          provider_account_id: config.googleAccountId,
          account_name: `Google Business Profile - ${config.locationId}`,
          is_connected: true,
          last_sync: new Date().toISOString(),
          permissions: ['read', 'write'],
          integration_data: {
            location_id: config.locationId,
            google_account_id: config.googleAccountId
          }
        }, {
          onConflict: 'user_id,client_id,provider'
        })

      if (integrationError) {
        throw integrationError as any
      }

      // Update client_locations with Google Business data
      const { data: locations, error: locationsError } = await (supabaseAdmin() as any)
        .from('client_locations')
        .update({
          google_account_id: config.googleAccountId,
          gbp_data_last_updated: new Date().toISOString()
        })
        .eq('id', config.locationId)

      if (locationsError) {
        throw locationsError as any
      }

      logger.info(`Successfully linked client ${config.clientId} to Google Business Profile`)
      return { success: true, integration, locations }
    } catch (error) {
      logger.error('Failed to link client to Google Business:', error as any)
      throw error as any
    }
  }

  /**
   * Sync Google Business data for a specific location
   */
  async syncLocationData(clientId: string, locationId: string, googleAccountId: string) {
    try {
      // Get integration to retrieve access token
      const { data: integration } = await (supabaseAdmin() as any)
        .from('integrations')
        .select('access_token')
        .eq('client_id', clientId)
        .eq('provider', 'google_business')
        .single()

      if (!integration?.access_token) {
        throw new Error('No access token found for Google Business integration')
      }

      // Set access token for Google Business service
      googleBusinessService.setAccessToken(clientId, integration.access_token)

      // Fetch Google Business data
      const locations = await googleBusinessService.getLocations(clientId, googleAccountId)
      
      if (locations.length === 0) {
        throw new Error('No Google Business locations found')
      }

      const location = locations[0] // Get first location
      const locationDetails = await googleBusinessService.getLocation(clientId, location.name)
      const reviews = await googleBusinessService.getReviews(clientId, location.name)

      // Store location data
      await this.storeLocationData(locationId, locationDetails, reviews)

      // Update sync timestamp
      await (supabaseAdmin() as any)
        .from('client_locations')
        .update({
          gbp_data_last_updated: new Date().toISOString(),
          google_rating: (locationDetails as any).averageRating || 0,
          google_review_count: reviews.length
        })
        .eq('id', locationId)

      logger.info(`Successfully synced Google Business data for location ${locationId}`)
      return { success: true, location: locationDetails, reviews }
    } catch (error) {
      logger.error('Failed to sync Google Business data:', error as any)
      throw error as any
    }
  }

  /**
   * Store Google Business location and review data
   */
  private async storeLocationData(locationId: string, locationData: any, reviews: any[]) {
    try {
      // Store location details
      const { error: locationError } = await (supabaseAdmin() as any)
        .from('client_locations')
        .update({
          business_name: locationData.title || locationData.locationName,
          address: locationData.storefrontAddress?.addressLines?.join(', ') || '',
          city: locationData.storefrontAddress?.locality || '',
          state: locationData.storefrontAddress?.administrativeArea || '',
          zip_code: locationData.storefrontAddress?.postalCode || '',
          phone: locationData.phoneNumbers?.primaryPhone || '',
          website: locationData.websiteUri || '',
          business_description: locationData.description || '',
          business_hours: locationData.regularHours || {},
          business_categories: [locationData.categories?.primaryCategory?.displayName || ''],
          google_business_profile_url: locationData.name || ''
        })
        .eq('id', locationId)

      if (locationError) {
        throw locationError as any
      }

      // Store reviews
      for (const review of reviews) {
        await this.storeReview(locationId, review)
      }

      logger.info(`Stored Google Business data for location ${locationId}`)
    } catch (error) {
      logger.error('Failed to store location data:', error as any)
      throw error as any
    }
  }

  /**
   * Store individual review
   */
  private async storeReview(locationId: string, review: any) {
    try {
      const { error } = await (supabaseAdmin() as any)
        .from('reviews')
        .upsert({
          location_id: locationId,
          platform: 'google',
          reviewer_name: review.reviewer?.displayName || 'Anonymous',
          rating: review.starRating || 0,
          review_text: review.comment || '',
          review_date: new Date(review.createTime).toISOString().split('T')[0],
          review_url: review.name || '',
          response_status: review.reviewReply ? 'responded' : 'pending',
          scraped_at: new Date().toISOString()
        }, {
          onConflict: 'location_id,platform,reviewer_name,review_date'
        })

      if (error) {
        throw error as any
      }
    } catch (error) {
      logger.error('Failed to store review:', error as any)
      throw error as any
    }
  }

  /**
   * Sync all client locations
   */
  async syncAllClients() {
    try {
      // Get all clients with Google Business integrations
      const { data: integrations, error } = await (supabaseAdmin() as any)
        .from('integrations')
        .select('client_id, provider_account_id, access_token')
        .eq('provider', 'google_business')
        .eq('is_connected', true)

      if (error) {
        throw error as any
      }

      const results = []
      for (const integration of integrations || []) {
        try {
          // Get client locations
          const { data: locations } = await (supabaseAdmin() as any)
            .from('client_locations')
            .select('id, google_account_id')
            .eq('client_id', integration.client_id)

          for (const location of locations || []) {
            if (location.google_account_id) {
              const result = await this.syncLocationData(
                integration.client_id,
                location.id,
                location.google_account_id
              )
              results.push({ clientId: integration.client_id, locationId: location.id, ...result })
            }
          }
        } catch (error) {
          logger.error(`Failed to sync client ${integration.client_id}:`, error as any)
          results.push({ clientId: integration.client_id, error: error instanceof Error ? error.message : String(error) })
        }
      }

      return { success: true, results }
    } catch (error) {
      logger.error('Failed to sync all clients:', error as any)
      throw error as any
    }
  }
}

export const googleBusinessSyncService = new GoogleBusinessSyncService()
