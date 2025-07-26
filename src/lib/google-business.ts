interface GoogleBusinessLocation {
  name: string
  locationName: string
  primaryPhone: string
  primaryCategory: {
    displayName: string
  }
  websiteUri?: string
  regularHours?: {
    periods: Array<{
      openDay: string
      openTime: string
      closeDay: string
      closeTime: string
    }>
  }
  latlng?: {
    latitude: number
    longitude: number
  }
  metadata?: {
    duplicate?: boolean
    suspended?: boolean
  }
}

interface GoogleReview {
  name: string
  reviewId: string
  reviewer: {
    profilePhotoUrl: string
    displayName: string
    isAnonymous: boolean
  }
  starRating: number
  comment: string
  createTime: string
  updateTime: string
  reviewReply?: {
    comment: string
    updateTime: string
  }
}

interface GoogleBusinessProfile {
  name: string
  title: string
  phoneNumbers: {
    primaryPhone: string
  }
  categories: {
    primaryCategory: {
      displayName: string
    }
    additionalCategories: Array<{
      displayName: string
    }>
  }
  storefrontAddress: {
    addressLines: string[]
    locality: string
    administrativeArea: string
    postalCode: string
    regionCode: string
  }
  websiteUri?: string
  regularHours: {
    periods: Array<{
      openDay: string
      openTime: string
      closeDay: string
      closeTime: string
    }>
  }
  specialHours?: {
    specialHourPeriods: Array<{
      startDate: {
        year: number
        month: number
        day: number
      }
      endDate: {
        year: number
        month: number
        day: number
      }
      openTime?: string
      closeTime?: string
      isClosed: boolean
    }>
  }
  serviceRadius?: {
    radiusKm: number
  }
  labels: string[]
  adWordsLocationExtensions?: {
    adPhone: string
  }
  latlng: {
    latitude: number
    longitude: number
  }
  openInfo?: {
    status: 'OPEN' | 'CLOSED_PERMANENTLY' | 'CLOSED_TEMPORARILY'
    canReopen: boolean
  }
  localPostAttributes: Array<{
    attributeId: string
    values: string[]
  }>
  moreHours: Array<{
    hoursTypeId: string
    periods: Array<{
      openDay: string
      openTime: string
      closeDay: string
      closeTime: string
    }>
  }>
}

class GoogleBusinessService {
  private accessTokens: Map<string, string> = new Map() // clientId -> accessToken
  private readonly baseURL = 'https://mybusinessbusinessinformation.googleapis.com/v1'
  private readonly reviewsURL = 'https://mybusiness.googleapis.com/v4'

  setAccessToken(clientId: string, token: string) {
    this.accessTokens.set(clientId, token)
  }

  getAccessToken(clientId: string): string | null {
    return this.accessTokens.get(clientId) || null
  }

  private async makeRequest(clientId: string, url: string, options: Parameters<typeof fetch>[1] = {}) {
    const accessToken = this.getAccessToken(clientId)
    if (!accessToken) {
      throw new Error(`Google Business access token not set for client ${clientId}`)
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Google API error: ${response.status} - ${error.message || 'Unknown error'}`)
    }

    return response.json()
  }

  // Get all business locations for a client account
  async getLocations(clientId: string, accountId: string): Promise<GoogleBusinessLocation[]> {
    const url = `${this.baseURL}/accounts/${accountId}/locations`
    const response = await this.makeRequest(clientId, url)
    return response.locations || []
  }

  // Get specific location details
  async getLocation(clientId: string, locationName: string): Promise<GoogleBusinessProfile> {
    const url = `${this.baseURL}/${locationName}`
    return this.makeRequest(clientId, url)
  }

  // Get reviews for a location
  async getReviews(clientId: string, locationName: string): Promise<GoogleReview[]> {
    // Note: The Reviews API requires special approval from Google
    // This is a placeholder implementation
    const url = `${this.reviewsURL}/${locationName}/reviews`
    try {
      const response = await this.makeRequest(clientId, url)
      return response.reviews || []
    } catch (error) {
      console.warn('Reviews API not available:', error)
      return []
    }
  }

  // Reply to a review
  async replyToReview(clientId: string, reviewName: string, reply: string): Promise<void> {
    const url = `${this.reviewsURL}/${reviewName}/reply`
    await this.makeRequest(clientId, url, {
      method: 'PUT',
      body: JSON.stringify({
        comment: reply
      })
    })
  }

  // Update business information
  async updateLocation(clientId: string, locationName: string, updates: Partial<GoogleBusinessProfile>): Promise<GoogleBusinessProfile> {
    const url = `${this.baseURL}/${locationName}`
    return this.makeRequest(clientId, url, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
  }

  // Get business insights (requires Google My Business API)
  async getInsights(clientId: string, locationName: string, startDate: string, endDate: string) {
    const url = `${this.reviewsURL}/${locationName}/reportInsights`
    return this.makeRequest(clientId, url, {
      method: 'POST',
      body: JSON.stringify({
        locationNames: [locationName],
        basicRequest: {
          timeRange: {
            startTime: startDate,
            endTime: endDate
          },
          metricRequests: [
            { metric: 'QUERIES_DIRECT' },
            { metric: 'QUERIES_INDIRECT' },
            { metric: 'QUERIES_CHAIN' },
            { metric: 'VIEWS_MAPS' },
            { metric: 'VIEWS_SEARCH' },
            { metric: 'ACTIONS_WEBSITE' },
            { metric: 'ACTIONS_PHONE' },
            { metric: 'ACTIONS_DRIVING_DIRECTIONS' }
          ]
        }
      })
    })
  }

  // Search for a business by name and address (for initial setup)
  async searchBusiness(businessName: string, address: string) {
    // This would typically use the Google Places API
    // For now, return a mock structure
    return {
      candidates: [{
        place_id: 'placeholder_place_id',
        name: businessName,
        formatted_address: address,
        rating: 0,
        user_ratings_total: 0
      }]
    }
  }
}

export const googleBusinessService = new GoogleBusinessService()
export type { GoogleBusinessProfile, GoogleReview, GoogleBusinessLocation }