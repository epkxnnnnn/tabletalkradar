// TableTalk Radar - Shared Type Definitions
import * as React from 'react'
import { z } from 'zod'

// Base Types
export const UserRoleSchema = z.enum(['superadmin', 'agency_owner', 'agency_user', 'client'])
export type UserRole = z.infer<typeof UserRoleSchema>

export const LocationStatusSchema = z.enum(['active', 'inactive', 'pending', 'suspended'])
export type LocationStatus = z.infer<typeof LocationStatusSchema>

// User & Profile Types
export const ProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  full_name: z.string().optional(),
  role: UserRoleSchema,
  agency_id: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string()
})
export type Profile = z.infer<typeof ProfileSchema>

// Agency Types
export const AgencySchema = z.object({
  id: z.string(),
  name: z.string(),
  owner_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  settings: z.record(z.unknown()).optional()
})
export type Agency = z.infer<typeof AgencySchema>

// Client Types
export const ClientSchema = z.object({
  id: z.string(),
  owner_id: z.string(),
  agency_id: z.string().nullable(),
  business_name: z.string(),
  phone: z.string().optional(),
  website: z.string().optional(),
  category: z.string().optional(),
  industry: z.string().optional(),
  business_type: z.string().optional(),
  google_account_id: z.string().optional(),
  status: z.string().default('active'),
  is_agency: z.boolean().default(false),
  slug: z.string().optional(),
  client_tier: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string()
})
export type Client = z.infer<typeof ClientSchema>

// Location Types
export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  client_id: z.string(),
  google_place_id: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  status: LocationStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
  metadata: z.record(z.unknown()).optional()
})
export type Location = z.infer<typeof LocationSchema>

// Google Business Types
export const GoogleBusinessProfileSchema = z.object({
  name: z.string(),
  accountName: z.string(),
  locationName: z.string(),
  primaryPhone: z.string().optional(),
  categories: z.object({
    primaryCategory: z.object({
      displayName: z.string()
    }).optional(),
    additionalCategories: z.array(z.object({
      displayName: z.string()
    })).optional()
  }).optional(),
  websiteUri: z.string().url().optional(),
  regularHours: z.object({
    periods: z.array(z.object({
      openDay: z.string(),
      openTime: z.string(),
      closeDay: z.string(),
      closeTime: z.string()
    })).optional()
  }).optional()
})
export type GoogleBusinessProfile = z.infer<typeof GoogleBusinessProfileSchema>

// Review Types
export const ReviewSchema = z.object({
  id: z.string(),
  location_id: z.string(),
  google_review_id: z.string().optional(),
  reviewer_name: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  review_date: z.string(),
  response: z.string().optional(),
  response_date: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string()
})
export type Review = z.infer<typeof ReviewSchema>

// Social Media Types
export const SocialPostSchema = z.object({
  id: z.string(),
  location_id: z.string(),
  platform: z.enum(['google_posts', 'facebook', 'instagram', 'linkedin']),
  content: z.string(),
  media_urls: z.array(z.string().url()).optional(),
  scheduled_for: z.string().optional(),
  published_at: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'failed']),
  created_at: z.string(),
  updated_at: z.string()
})
export type SocialPost = z.infer<typeof SocialPostSchema>

// API Response Types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional()
})
export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Form Types
export const LoginFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})
export type LoginFormData = z.infer<typeof LoginFormSchema>

export const SignupFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  agencyName: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})
export type SignupFormData = z.infer<typeof SignupFormSchema>

// Client Import Types
export const ClientImportSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  business_type: z.string().optional(),
  google_place_id: z.string().optional()
})
export type ClientImportData = z.infer<typeof ClientImportSchema>

// Analytics Types
export const AnalyticsDataSchema = z.object({
  location_id: z.string(),
  metric_type: z.enum(['views', 'calls', 'directions', 'website_clicks']),
  value: z.number(),
  date: z.string(),
  period: z.enum(['daily', 'weekly', 'monthly'])
})
export type AnalyticsData = z.infer<typeof AnalyticsDataSchema>

// Settings Types
export const UserSettingsSchema = z.object({
  theme: z.enum(['light', 'dark']).default('dark'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    reviews: z.boolean().default(true),
    reports: z.boolean().default(true)
  }).default({}),
  timezone: z.string().default('UTC'),
  language: z.string().default('en')
})
export type UserSettings = z.infer<typeof UserSettingsSchema>

// Database Error Types
export interface DatabaseError {
  message: string
  code?: string
  details?: string
}

// Component Props Types
export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  color?: string
}

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}