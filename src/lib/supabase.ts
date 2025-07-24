import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('NEXT_PUBLIC_SUPABASE_URL is not set')
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

console.log('Initializing Supabase client with URL:', supabaseUrl)

// Client for browser/frontend operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string
          full_name: string | null
          email: string | null
          company_name: string | null
          role: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          updated_at?: string
          full_name?: string | null
          email?: string | null
          company_name?: string | null
          role?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          updated_at?: string
          full_name?: string | null
          email?: string | null
          company_name?: string | null
          role?: string | null
          avatar_url?: string | null
        }
      }
      agencies: {
        Row: {
          id: string
          name: string
          slug: string | null
          description: string | null
          logo_url: string | null
          website: string | null
          industry: string | null
          location: string | null
          contact_email: string | null
          contact_phone: string | null
          business_type: string | null
          target_market: string | null
          founded_year: number | null
          team_size: string | null
          subscription_plan: string
          subscription_status: string
          plan_limits: any
          billing_cycle: string
          settings: any
          features: any
          integrations: any
          owner_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          description?: string | null
          logo_url?: string | null
          website?: string | null
          industry?: string | null
          location?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          business_type?: string | null
          target_market?: string | null
          founded_year?: number | null
          team_size?: string | null
          subscription_plan?: string
          subscription_status?: string
          plan_limits?: any
          billing_cycle?: string
          settings?: any
          features?: any
          integrations?: any
          owner_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          description?: string | null
          logo_url?: string | null
          website?: string | null
          industry?: string | null
          location?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          business_type?: string | null
          target_market?: string | null
          founded_year?: number | null
          team_size?: string | null
          subscription_plan?: string
          subscription_status?: string
          plan_limits?: any
          billing_cycle?: string
          settings?: any
          features?: any
          integrations?: any
          owner_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          agency_id: string
          business_name: string
          contact_name: string | null
          email: string | null
          phone: string | null
          website: string | null
          industry: string | null
          business_type: string | null
          location: string | null
          address: string | null
          founded_year: number | null
          employee_count: string | null
          annual_revenue: string | null
          target_audience: string | null
          unique_selling_proposition: string | null
          service_tier: string
          account_manager: string | null
          client_since: string
          contract_value: number | null
          billing_cycle: string
          status: string
          health_score: number | null
          satisfaction_score: number | null
          competitors: string[] | null
          market_position: string | null
          growth_stage: string | null
          audit_frequency: string
          reporting_preferences: any
          communication_preferences: any
          external_ids: any
          integrations: any
          custom_fields: any
          audit_categories: string[] | null
          priority_areas: string[] | null
          created_at: string
          updated_at: string
          last_audit_at: string | null
          next_audit_due: string | null
        }
        Insert: {
          id?: string
          agency_id: string
          business_name: string
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          industry?: string | null
          business_type?: string | null
          location?: string | null
          address?: string | null
          founded_year?: number | null
          employee_count?: string | null
          annual_revenue?: string | null
          target_audience?: string | null
          unique_selling_proposition?: string | null
          service_tier?: string
          account_manager?: string | null
          client_since?: string
          contract_value?: number | null
          billing_cycle?: string
          status?: string
          health_score?: number | null
          satisfaction_score?: number | null
          competitors?: string[] | null
          market_position?: string | null
          growth_stage?: string | null
          audit_frequency?: string
          reporting_preferences?: any
          communication_preferences?: any
          external_ids?: any
          integrations?: any
          custom_fields?: any
          audit_categories?: string[] | null
          priority_areas?: string[] | null
          created_at?: string
          updated_at?: string
          last_audit_at?: string | null
          next_audit_due?: string | null
        }
        Update: {
          id?: string
          agency_id?: string
          business_name?: string
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          industry?: string | null
          business_type?: string | null
          location?: string | null
          address?: string | null
          founded_year?: number | null
          employee_count?: string | null
          annual_revenue?: string | null
          target_audience?: string | null
          unique_selling_proposition?: string | null
          service_tier?: string
          account_manager?: string | null
          client_since?: string
          contract_value?: number | null
          billing_cycle?: string
          status?: string
          health_score?: number | null
          satisfaction_score?: number | null
          competitors?: string[] | null
          market_position?: string | null
          growth_stage?: string | null
          audit_frequency?: string
          reporting_preferences?: any
          communication_preferences?: any
          external_ids?: any
          integrations?: any
          custom_fields?: any
          audit_categories?: string[] | null
          priority_areas?: string[] | null
          created_at?: string
          updated_at?: string
          last_audit_at?: string | null
          next_audit_due?: string | null
        }
      }
      audits: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          client_id: string
          business_name: string
          website: string | null
          category: string
          overall_score: number
          audit_data: any
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          client_id: string
          business_name: string
          website?: string | null
          category: string
          overall_score: number
          audit_data: any
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          client_id?: string
          business_name?: string
          website?: string | null
          category?: string
          overall_score?: number
          audit_data?: any
          status?: string
        }
      }
    }
  }
}