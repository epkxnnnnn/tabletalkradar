// TableTalk Radar - Admin Location SEO Update API (v1)
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withValidation, 
  withMethods,
  successResponse,
  AuthenticationError,
  NotFoundError,
  ValidationError
} from '@/lib/api-handler'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Request validation schemas
const LocationUpdateSchema = z.object({
  location_id: z.string().min(1, 'Location ID is required'),
  update_type: z.enum(['seo_scores', 'google_business_profile', 'keywords', 'full_audit']),
  data: z.record(z.any())
})

const GetLocationDataSchema = z.object({
  location_id: z.string().min(1, 'Location ID is required')
})

// Helper to authenticate admin requests
function authenticateAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const adminToken = process.env.ADMIN_UPDATE_TOKEN
  
  if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
    throw new AuthenticationError('Invalid admin token')
  }
}

// Helper to calculate overall SEO score based on weighted factors
function calculateOverallSEOScore(scores: any): number {
  const weights = {
    citation_score: 0.25,
    review_score: 0.35,
    visibility_score: 0.25,
    optimization_score: 0.15
  }

  let totalScore = 0
  let totalWeight = 0

  for (const [key, weight] of Object.entries(weights)) {
    if (scores[key] !== null && scores[key] !== undefined) {
      totalScore += scores[key] * weight
      totalWeight += weight
    }
  }

  // Normalize if not all scores are present
  if (totalWeight > 0 && totalWeight < 1) {
    totalScore = totalScore / totalWeight
  }

  return Math.round(totalScore * 100) / 100
}

// Update SEO scores with automatic calculations
async function updateSEOScores(locationId: string, newScores: any, currentLocation: any) {
  const {
    citation_score,
    review_score,
    visibility_score,
    optimization_score
  } = newScores

  // Calculate overall SEO score based on weighted factors
  const local_seo_score = calculateOverallSEOScore({
    citation_score: citation_score ?? currentLocation.citation_score,
    review_score: review_score ?? currentLocation.review_score,
    visibility_score: visibility_score ?? currentLocation.visibility_score,
    optimization_score: optimization_score ?? currentLocation.optimization_score
  })

  const updates = {
    ...newScores,
    local_seo_score,
    seo_data_last_updated: new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin()
    .from('client_locations')
    .update(updates)
    .eq('id', locationId)
    .select()

  return { 
    data, 
    error,
    changes: {
      previous_seo_score: currentLocation.local_seo_score,
      new_seo_score: local_seo_score,
      score_change: local_seo_score - currentLocation.local_seo_score
    }
  }
}

// Update Google Business Profile data
async function updateGoogleBusinessProfile(locationId: string, gbpData: any) {
  const updates = {
    ...gbpData,
    gbp_data_last_updated: new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin()
    .from('client_locations')
    .update(updates)
    .eq('id', locationId)
    .select()

  return { data, error, changes: gbpData }
}

// Update keyword rankings with history tracking
async function updateKeywordRankings(locationId: string, keywordData: any) {
  const { keywords } = keywordData
  const results = []

  for (const keyword of keywords) {
    // Get current keyword data
    const { data: currentKeyword } = await supabaseAdmin()
      .from('location_keywords')
      .select('*')
      .eq('location_id', locationId)
      .eq('keyword', keyword.keyword)
      .single()

    if (currentKeyword) {
      // Calculate rank change
      const rank_change = currentKeyword.current_rank 
        ? (Number(keyword.new_rank) || 0) - (Number(currentKeyword.current_rank) || 0)
        : 0

      // Update rank history
      const rankHistory = (currentKeyword.rank_history as any[]) || []
      rankHistory.push({
        date: new Date().toISOString(),
        rank: Number(keyword.new_rank) || 0,
        change: rank_change
      })

      // Keep only last 12 weeks of history
      if (rankHistory.length > 12) {
        rankHistory.shift()
      }

      const { data, error } = await supabaseAdmin()
        .from('location_keywords')
        .update({
          previous_rank: currentKeyword.current_rank,
          current_rank: keyword.new_rank,
          rank_change,
          best_rank: Math.min(Number(currentKeyword.best_rank) || 999, Number(keyword.new_rank) || 999),
          worst_rank: Math.max(Number(currentKeyword.worst_rank) || 0, Number(keyword.new_rank) || 0),
          rank_history: rankHistory,
          last_checked_at: new Date().toISOString(),
          search_url: keyword.search_url,
          featured_snippet: keyword.featured_snippet || false,
          local_pack_position: keyword.local_pack_position
        })
        .eq('id', currentKeyword.id as string)

      results.push({ keyword: keyword.keyword, success: !error, rank_change })
    }
  }

  return { data: results, error: null, changes: results }
}

// Perform comprehensive weekly audit
async function performFullAudit(locationId: string, location: any, auditData: any) {
  const {
    seo_scores,
    google_business_profile,
    keywords,
    issues_found,
    recommendations,
    improvements_made
  } = auditData

  // Update location with new data
  if (seo_scores) {
    await updateSEOScores(locationId, seo_scores, location)
  }

  if (google_business_profile) {
    await updateGoogleBusinessProfile(locationId, google_business_profile)
  }

  if (keywords) {
    await updateKeywordRankings(locationId, { keywords })
  }

  // Calculate keyword statistics
  const { data: keywordStats } = await supabaseAdmin()
    .from('location_keywords')
    .select('current_rank')
    .eq('location_id', locationId)
    .eq('is_tracking', true)

  const total_keywords_tracked = keywordStats?.length || 0
  const keywords_ranking_top_3 = keywordStats?.filter(k => k.current_rank && Number(k.current_rank) <= 3).length || 0
  const keywords_ranking_top_10 = keywordStats?.filter(k => k.current_rank && Number(k.current_rank) <= 10).length || 0
  const average_keyword_rank = keywordStats && keywordStats.length > 0
    ? keywordStats.reduce((sum, k) => sum + (Number(k.current_rank) || 0), 0) / keywordStats.length
    : 0

  // Create audit record
  const { data: audit, error: auditError } = await supabaseAdmin()
    .from('location_seo_audits')
    .insert({
      location_id: locationId,
      client_id: location.client_id,
      agency_id: location.agency_id,
      audit_date: new Date().toISOString().split('T')[0],
      audit_type: 'weekly',
      local_seo_score: location.local_seo_score,
      citation_score: location.citation_score,
      review_score: location.review_score,
      visibility_score: location.visibility_score,
      optimization_score: location.optimization_score,
      google_rating: location.google_rating,
      google_review_count: location.google_review_count,
      google_listing_completeness: location.google_listing_completeness,
      total_keywords_tracked,
      keywords_ranking_top_3,
      keywords_ranking_top_10,
      average_keyword_rank: Math.round(average_keyword_rank * 10) / 10,
      issues_found: issues_found || [],
      recommendations: recommendations || [],
      improvements_made: improvements_made || '',
      internal_notes: auditData.internal_notes,
      data_sources: {
        gbp_scraped: auditData.gbp_scraped || false,
        keywords_checked: auditData.keywords_checked || false,
        citations_verified: auditData.citations_verified || false,
        last_update: new Date().toISOString()
      }
    })
    .select()

  return { 
    data: audit, 
    error: auditError,
    changes: {
      audit_created: true,
      keywords_updated: keywords?.length || 0,
      scores_updated: !!seo_scores,
      gbp_updated: !!google_business_profile
    }
  }
}

// POST /api/v1/admin/admin/location-seo-update - Update location SEO data
export const POST = withMethods(['POST'])(
  withValidation(LocationUpdateSchema)(
    async (req: NextRequest, data: z.infer<typeof LocationUpdateSchema>) => {
    authenticateAdmin(req)
    
    const { location_id, update_type, data: updateData } = data

    // Get current location data
    const { data: location, error: locationError } = await supabaseAdmin()
      .from('client_locations')
      .select('*')
      .eq('id', location_id)
      .single()

    if (locationError || !location) {
      throw new NotFoundError('Location')
    }

    let updateResult
    const timestamp = new Date().toISOString()

    switch (update_type) {
      case 'seo_scores':
        updateResult = await updateSEOScores(location_id, updateData, location)
        break
      
      case 'google_business_profile':
        updateResult = await updateGoogleBusinessProfile(location_id, updateData)
        break
      
      case 'keywords':
        updateResult = await updateKeywordRankings(location_id, updateData)
        break
      
      case 'full_audit':
        updateResult = await performFullAudit(location_id, location, updateData)
        break
      
      default:
        throw new ValidationError('Invalid update type', ['update_type must be one of: seo_scores, google_business_profile, keywords, full_audit'])
    }

    if (updateResult.error) {
      throw updateResult.error
    }

    return successResponse(
      {
        location_id,
        updated_at: timestamp,
        changes: updateResult.changes
      },
      `${update_type} updated successfully`
    )
    }
  )
)

// GET /api/v1/admin/admin/location-seo-update - Fetch current location data
export const GET = withMethods(['GET'])(
  withValidation(GetLocationDataSchema)(
    async (req: NextRequest, query: z.infer<typeof GetLocationDataSchema>) => {
    const { location_id } = query

    // Get location with all related data
    const { data: location, error: locationError } = await supabaseAdmin()
      .from('client_locations')
      .select(`
        *,
        location_keywords (
          id,
          keyword,
          keyword_type,
          current_rank,
          previous_rank,
          rank_change,
          last_checked_at
        ),
        location_seo_audits (
          audit_date,
          local_seo_score,
          issues_found,
          recommendations
        )
      `)
      .eq('id', location_id)
      .order('audit_date', { foreignTable: 'location_seo_audits', ascending: false })
      .limit(5, { foreignTable: 'location_seo_audits' })
      .single()

    if (locationError) {
      throw new NotFoundError('Location')
    }

    return successResponse(
      {
        location,
        last_seo_update: location.seo_data_last_updated,
        last_gbp_update: location.gbp_data_last_updated,
        keyword_count: location.location_keywords?.length || 0,
        audit_history: location.location_seo_audits || []
      },
      'Successfully retrieved location data'
    )
    }
  )
)