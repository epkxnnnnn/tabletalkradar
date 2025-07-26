// TableTalk Radar - Runtime Validation Utilities
import { z } from 'zod'
import type { ApiResponse } from '@/types'

// Email validation utility
export const validateEmail = (email: string): boolean => {
  const emailSchema = z.string().email()
  return emailSchema.safeParse(email).success
}

// Phone validation utility
export const validatePhone = (phone: string): boolean => {
  const phoneSchema = z.string().regex(/^\+?[\d\s\-()]+$/)
  return phoneSchema.safeParse(phone).success
}

// URL validation utility
export const validateUrl = (url: string): boolean => {
  const urlSchema = z.string().url()
  return urlSchema.safeParse(url).success
}

// Generic validation wrapper with error handling
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errors = result.error.errors.map(err => 
    `${err.path.join('.')}: ${err.message}`
  )
  
  return { success: false, errors }
}

// API response validation
export function createApiResponse<T>(
  data?: T, 
  error?: string, 
  message?: string
): ApiResponse<T> {
  return {
    success: !error,
    data,
    error,
    message
  }
}

// Form validation helper
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  formData: FormData | Record<string, unknown>
): { isValid: true; data: T } | { isValid: false; errors: Record<string, string> } {
  let dataToValidate: Record<string, unknown>
  
  if (formData instanceof FormData) {
    dataToValidate = Object.fromEntries(formData.entries())
  } else {
    dataToValidate = formData
  }
  
  const result = schema.safeParse(dataToValidate)
  
  if (result.success) {
    return { isValid: true, data: result.data }
  }
  
  const errors: Record<string, string> = {}
  result.error.errors.forEach(err => {
    const path = err.path.join('.')
    errors[path] = err.message
  })
  
  return { isValid: false, errors }
}

// Environment variable validation
export function validateEnvVar(
  name: string, 
  value: string | undefined,
  required = true
): string {
  if (required && !value) {
    throw new Error(`Environment variable ${name} is required but not set`)
  }
  return value || ''
}

// ID validation (UUID format)
export const validateId = (id: string): boolean => {
  const uuidSchema = z.string().uuid()
  return uuidSchema.safeParse(id).success
}

// Date validation
export const validateDate = (dateString: string): boolean => {
  const dateSchema = z.string().datetime()
  return dateSchema.safeParse(dateString).success
}

// Rating validation (1-5 scale)
export const validateRating = (rating: number): boolean => {
  const ratingSchema = z.number().min(1).max(5)
  return ratingSchema.safeParse(rating).success
}