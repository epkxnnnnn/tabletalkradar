import { z } from 'zod'

// ================================================================================
// Enhanced Client Types
// ================================================================================

export const EnhancedClientSchema = z.object({
  // Base fields (existing)
  id: z.string(),
  owner_id: z.string(),
  agency_id: z.string().nullable(),
  business_name: z.string(),
  slug: z.string(),
  status: z.string(),
  
  // Contact & Basic Info
  phone: z.string().optional(),
  website: z.string().url().optional(),
  contact_email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  
  // Business Classification
  category: z.string().optional(),
  industry: z.string().optional(),
  business_type: z.string().optional(),
  client_tier: z.string().optional(),
  
  // Enhanced Business Info
  business_description: z.string().optional(),
  tagline: z.string().optional(),
  founded_year: z.number().optional(),
  employee_count: z.number().optional(),
  annual_revenue: z.number().optional(),
  target_keywords: z.array(z.string()).optional(),
  primary_services: z.array(z.string()).optional(),
  
  // Branding
  brand_colors: z.record(z.string()).optional(),
  logo_url: z.string().url().optional(),
  cover_image_url: z.string().url().optional(),
  
  // Social Media
  social_media_links: z.record(z.string()).optional(),
  
  // Google Business Profile
  google_account_id: z.string().optional(),
  google_business_name: z.string().optional(),
  google_business_url: z.string().url().optional(),
  google_business_categories: z.array(z.string()).optional(),
  google_business_attributes: z.record(z.unknown()).optional(),
  google_verification_status: z.string().optional(),
  
  // Timestamps
  created_at: z.string(),
  updated_at: z.string()
})

export type EnhancedClient = z.infer<typeof EnhancedClientSchema>

// ================================================================================
// SEO Keywords
// ================================================================================

export const SEOKeywordSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  location_id: z.string().optional(),
  
  // Keyword data
  keyword: z.string(),
  search_volume: z.number().optional(),
  competition_level: z.enum(['low', 'medium', 'high']).optional(),
  difficulty_score: z.number().min(0).max(100).optional(),
  
  // Ranking data
  current_rank: z.number().optional(),
  previous_rank: z.number().optional(),
  best_rank: z.number().optional(),
  rank_change: z.number().optional(),
  
  // Tracking details
  search_engine: z.string().default('google'),
  location_target: z.string().optional(),
  device_type: z.enum(['desktop', 'mobile']).default('desktop'),
  
  // Results
  ranking_url: z.string().url().optional(),
  search_result_snippet: z.string().optional(),
  featured_snippet: z.boolean().default(false),
  
  // Status
  is_tracking: z.boolean().default(true),
  priority_level: z.enum(['low', 'medium', 'high']).default('medium'),
  last_checked_at: z.string().optional(),
  
  created_at: z.string(),
  updated_at: z.string()
})

export type SEOKeyword = z.infer<typeof SEOKeywordSchema>

// ================================================================================
// Business Services
// ================================================================================

export const BusinessServiceSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  location_id: z.string().optional(),
  
  // Service details
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  
  // Pricing
  price_type: z.enum(['fixed', 'range', 'hourly', 'custom']).default('fixed'),
  price_min: z.number().optional(),
  price_max: z.number().optional(),
  price_currency: z.string().default('USD'),
  price_display: z.string().optional(),
  
  // Service details
  duration_minutes: z.number().optional(),
  availability_type: z.enum(['appointment', 'walk_in', 'both']).default('appointment'),
  booking_url: z.string().url().optional(),
  
  // SEO and marketing
  seo_keywords: z.array(z.string()).optional(),
  featured_image_url: z.string().url().optional(),
  gallery_images: z.array(z.string()).optional(),
  
  // Status
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  display_order: z.number().default(0),
  
  created_at: z.string(),
  updated_at: z.string()
})

export type BusinessService = z.infer<typeof BusinessServiceSchema>

// ================================================================================
// Business Menu
// ================================================================================

export const MenuItemSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  location_id: z.string().optional(),
  
  // Organization
  category: z.string(),
  subcategory: z.string().optional(),
  
  // Item details
  name: z.string(),
  description: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  dietary_tags: z.array(z.string()).optional(),
  
  // Pricing
  price: z.number().optional(),
  price_currency: z.string().default('USD'),
  size_options: z.array(z.object({
    size: z.string(),
    price: z.number()
  })).optional(),
  
  // Availability
  is_available: z.boolean().default(true),
  available_days: z.array(z.string()).optional(),
  available_hours: z.record(z.string()).optional(),
  seasonal_availability: z.record(z.unknown()).optional(),
  
  // Presentation
  image_url: z.string().url().optional(),
  preparation_time_minutes: z.number().optional(),
  spice_level: z.number().min(0).max(5).optional(),
  popularity_score: z.number().default(0),
  
  // Status
  is_featured: z.boolean().default(false),
  display_order: z.number().default(0),
  
  created_at: z.string(),
  updated_at: z.string()
})

export type MenuItem = z.infer<typeof MenuItemSchema>

// ================================================================================
// Social Media Posts
// ================================================================================

export const SocialMediaPostSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  location_id: z.string().optional(),
  
  // Platform and content
  platform: z.enum(['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube']),
  post_type: z.string().optional(),
  content: z.string(),
  hashtags: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
  
  // Media
  media_urls: z.array(z.string()).optional(),
  thumbnail_url: z.string().url().optional(),
  
  // Scheduling
  scheduled_for: z.string().optional(),
  published_at: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'failed', 'deleted']).default('draft'),
  
  // Platform data
  platform_post_id: z.string().optional(),
  platform_url: z.string().url().optional(),
  platform_data: z.record(z.unknown()).optional(),
  
  // Engagement
  likes_count: z.number().default(0),
  comments_count: z.number().default(0),
  shares_count: z.number().default(0),
  views_count: z.number().default(0),
  engagement_rate: z.number().optional(),
  
  // Campaign
  campaign_name: z.string().optional(),
  campaign_tags: z.array(z.string()).optional(),
  
  created_by: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string()
})

export type SocialMediaPost = z.infer<typeof SocialMediaPostSchema>

// ================================================================================
// Enhanced Client Location
// ================================================================================

export const BusinessHoursSchema = z.object({
  monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
  tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
  wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
  thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
  friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
  saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
  sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional()
})

export const EnhancedClientLocationSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  
  // Basic info (existing fields)
  business_name: z.string(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  
  // Business hours
  business_hours: BusinessHoursSchema.optional(),
  special_hours: z.record(z.unknown()).optional(),
  timezone: z.string().default('UTC'),
  
  // Service area
  service_radius_km: z.number().optional(),
  service_areas: z.array(z.string()).optional(),
  delivery_available: z.boolean().default(false),
  pickup_available: z.boolean().default(true),
  
  // Google Business Profile
  google_place_id: z.string().optional(),
  google_cid: z.string().optional(),
  google_business_status: z.string().optional(),
  google_rating: z.number().optional(),
  google_review_count: z.number().optional(),
  google_photos: z.array(z.unknown()).optional(),
  google_posts: z.array(z.unknown()).optional(),
  google_questions_and_answers: z.array(z.unknown()).optional(),
  
  // SEO scores
  local_seo_score: z.number().optional(),
  citation_score: z.number().optional(),
  visibility_score: z.number().optional(),
  
  // Status
  is_primary_location: z.boolean().default(false),
  is_active: z.boolean().default(true),
  
  created_at: z.string(),
  updated_at: z.string()
})

export type EnhancedClientLocation = z.infer<typeof EnhancedClientLocationSchema>

// ================================================================================
// Comprehensive Client Profile (Combined)
// ================================================================================

export interface ComprehensiveClientProfile {
  client: EnhancedClient
  locations: EnhancedClientLocation[]
  services: BusinessService[]
  menu: MenuItem[]
  seo_keywords: SEOKeyword[]
  social_posts: SocialMediaPost[]
  
  // Computed metrics
  total_keywords: number
  average_ranking: number
  total_services: number
  social_engagement: number
  google_rating: number
  review_count: number
}