import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
      clients: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          business_name: string
          website: string | null
          address: string | null
          phone: string | null
          category: string
          owner_id: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          business_name: string
          website?: string | null
          address?: string | null
          phone?: string | null
          category: string
          owner_id: string
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          business_name?: string
          website?: string | null
          address?: string | null
          phone?: string | null
          category?: string
          owner_id?: string
          status?: string
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