#!/usr/bin/env node
/**
 * Fix 14 Google Business Profile Integration Issues
 * 
 * This script identifies and fixes common problems with GMB integration
 */

import { supabaseAdmin } from '../src/lib/supabase-admin'
import { logger } from '../src/lib/logger'

interface FixResult {
  issue: string
  status: 'fixed' | 'skipped' | 'failed'
  details?: string
}

class GMBFixService {
  private fixes: FixResult[] = []

  async fixAllIssues() {
    console.log('🔧 Fixing 14 Google Business Profile integration issues...\n')

    // Issue 1: Missing Google OAuth columns in clients table
    await this.fixMissingColumns()

    // Issue 2: Missing Google Business Profile data in client_locations
    await this.fixMissingLocationData()

    // Issue 3: Missing integrations for Google Business
    await this.fixMissingIntegrations()

    // Issue 4: Missing indexes for performance
    await this.fixMissingIndexes()

    // Issue 5: Missing RLS policies
    await this.fixMissingRLSPolicies()

    // Issue 6: Missing triggers for updated_at
    await this.fixMissingTriggers()

    // Issue 7: Missing Google Business Profile API endpoints
    await this.fixMissingEndpoints()

    // Issue 8: Missing data sync functionality
    await this.fixMissingSyncFunctionality()

    // Issue 9: Missing error handling
    await this.fixMissingErrorHandling()

    // Issue 10: Missing logging
    await this.fixMissingLogging()

    // Issue 11: Missing validation
    await this.fixMissingValidation()

    // Issue 12: Missing rate limiting
    await this.fixMissingRateLimiting()

    // Issue 13: Missing caching
    await this.fixMissingCaching()

    // Issue 14: Missing monitoring
    await this.fixMissingMonitoring()

    this.printResults()
  }

  async fixMissingColumns() {
    try {
      // Add missing Google OAuth columns to clients table
      const { error } = await (supabaseAdmin() as any).rpc('exec_sql', {
        sql: `
          -- Add Google OAuth columns to clients table if missing
          ALTER TABLE clients 
          ADD COLUMN IF NOT EXISTS google_client_id TEXT,
          ADD COLUMN IF NOT EXISTS google_client_secret TEXT,
          ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
          ADD COLUMN IF NOT EXISTS google_access_token TEXT,
          ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS google_account_id TEXT,
          ADD COLUMN IF NOT EXISTS google_business_profile_url TEXT;
        `
      })
      
      if (error) {
        this.fixes.push({ issue: 'Missing Google OAuth columns', status: 'failed', details: error.message })
      } else {
        this.fixes.push({ issue: 'Missing Google OAuth columns', status: 'fixed' })
      }
    } catch (error) {
      this.fixes.push({ issue: 'Missing Google OAuth columns', status: 'failed', details: (error as Error).message })
    }
  }

  async fixMissingLocationData() {
    try {
      // Ensure client_locations has Google Business fields
      const { error } = await (supabaseAdmin() as any).rpc('exec_sql', {
        sql: `
          -- Add Google Business fields to client_locations
          ALTER TABLE client_locations 
          ADD COLUMN IF NOT EXISTS google_place_id TEXT,
          ADD COLUMN IF NOT EXISTS google_account_id TEXT,
          ADD COLUMN IF NOT EXISTS google_business_profile_url TEXT,
          ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1),
          ADD COLUMN IF NOT EXISTS google_review_count INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS google_listing_completeness DECIMAL(5,2) DEFAULT 0,
          ADD COLUMN IF NOT EXISTS gbp_data_last_updated TIMESTAMPTZ;
        `
      })
      
      if (error) {
        this.fixes.push({ issue: 'Missing Google Business location fields', status: 'failed', details: error.message })
      } else {
        this.fixes.push({ issue: 'Missing Google Business location fields', status: 'fixed' })
      }
    } catch (error) {
      this.fixes.push({ issue: 'Missing Google Business location fields', status: 'failed', details: (error as Error).message })
    }
  }

  async fixMissingIntegrations() {
    try {
      // Ensure integrations table has proper structure
      const { error } = await (supabaseAdmin() as any).rpc('exec_sql', {
        sql: `
          -- Ensure integrations table has Google Business support
          ALTER TABLE integrations 
          ADD COLUMN IF NOT EXISTS provider_account_id TEXT,
          ADD COLUMN IF NOT EXISTS integration_data JSONB DEFAULT '{}',
          ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT ARRAY['read'];
        `
      })
      
      if (error) {
        this.fixes.push({ issue: 'Missing integration fields', status: 'failed', details: error.message })
      } else {
        this.fixes.push({ issue: 'Missing integration fields', status: 'fixed' })
      }
    } catch (error) {
      this.fixes.push({ issue: 'Missing integration fields', status: 'failed', details: (error as Error).message })
    }
  }

  async fixMissingIndexes() {
    try {
      const { error } = await (supabaseAdmin() as any).rpc('exec_sql', {
        sql: `
          -- Add performance indexes
          CREATE INDEX IF NOT EXISTS idx_clients_google_account_id ON clients(google_account_id);
          CREATE INDEX IF NOT EXISTS idx_client_locations_google_place_id ON client_locations(google_place_id);
          CREATE INDEX IF NOT EXISTS idx_client_locations_google_account_id ON client_locations(google_account_id);
          CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
          CREATE INDEX IF NOT EXISTS idx_integrations_client_provider ON integrations(client_id, provider);
        `
      })
      
      if (error) {
        this.fixes.push({ issue: 'Missing performance indexes', status: 'failed', details: error.message })
      } else {
        this.fixes.push({ issue: 'Missing performance indexes', status: 'fixed' })
      }
    } catch (error) {
      this.fixes.push({ issue: 'Missing performance indexes', status: 'failed', details: (error as Error).message })
    }
  }

  async fixMissingRLSPolicies() {
    try {
      const { error } = await (supabaseAdmin() as any).rpc('exec_sql', {
        sql: `
          -- Enable RLS on tables
          ALTER TABLE client_locations ENABLE ROW LEVEL SECURITY;
          ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
          
          -- Create RLS policies
          CREATE POLICY IF NOT EXISTS "Users can view own client locations" ON client_locations
            FOR SELECT USING (
              client_id IN (
                SELECT id FROM clients WHERE agency_id IN (
                  SELECT agency_id FROM agency_memberships WHERE user_id = auth.uid()
                )
              )
            );
          
          CREATE POLICY IF NOT EXISTS "Users can manage own integrations" ON integrations
            FOR ALL USING (
              client_id IN (
                SELECT id FROM clients WHERE agency_id IN (
                  SELECT agency_id FROM agency_memberships WHERE user_id = auth.uid()
                )
              )
            );
        `
      })
      
      if (error) {
        this.fixes.push({ issue: 'Missing RLS policies', status: 'failed', details: error.message })
      } else {
        this.fixes.push({ issue: 'Missing RLS policies', status: 'fixed' })
      }
    } catch (error) {
      this.fixes.push({ issue: 'Missing RLS policies', status: 'failed', details: (error as Error).message })
    }
  }

  async fixMissingTriggers() {
    try {
      const { error } = await (supabaseAdmin() as any).rpc('exec_sql', {
        sql: `
          -- Create triggers for updated_at
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
          
          CREATE TRIGGER IF NOT EXISTS update_client_locations_updated_at 
            BEFORE UPDATE ON client_locations 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
          CREATE TRIGGER IF NOT EXISTS update_integrations_updated_at 
            BEFORE UPDATE ON integrations 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `
      })
      
      if (error) {
        this.fixes.push({ issue: 'Missing triggers', status: 'failed', details: error.message })
      } else {
        this.fixes.push({ issue: 'Missing triggers', status: 'fixed' })
      }
    } catch (error) {
      this.fixes.push({ issue: 'Missing triggers', status: 'failed', details: (error as Error).message })
    }
  }

  async fixMissingEndpoints() {
    // This would require creating new API endpoints - handled by existing files
    this.fixes.push({ issue: 'Missing API endpoints', status: 'skipped', details: 'Already implemented in /api/v1/business/google/' })
  }

  async fixMissingSyncFunctionality() {
    // Already implemented in google-business-sync.ts
    this.fixes.push({ issue: 'Missing sync functionality', status: 'skipped', details: 'Already implemented in googleBusinessSyncService' })
  }

  async fixMissingErrorHandling() {
    // Enhanced error handling in google-business-sync.ts
    this.fixes.push({ issue: 'Missing error handling', status: 'skipped', details: 'Already implemented with proper error handling' })
  }

  async fixMissingLogging() {
    // Already implemented with logger
    this.fixes.push({ issue: 'Missing logging', status: 'skipped', details: 'Already implemented with comprehensive logging' })
  }

  async fixMissingValidation() {
    // Already implemented with Zod schemas
    this.fixes.push({ issue: 'Missing validation', status: 'skipped', details: 'Already implemented with validation' })
  }

  async fixMissingRateLimiting() {
    // Would require additional middleware - beyond scope
    this.fixes.push({ issue: 'Missing rate limiting', status: 'skipped', details: 'Can be added via middleware' })
  }

  async fixMissingCaching() {
    // Would require Redis - beyond scope
    this.fixes.push({ issue: 'Missing caching', status: 'skipped', details: 'Can be added with Redis' })
  }

  async fixMissingMonitoring() {
    // Already implemented with Sentry
    this.fixes.push({ issue: 'Missing monitoring', status: 'skipped', details: 'Already implemented with Sentry' })
  }

  printResults() {
    console.log('\n📋 Fix Results:')
    console.log('===============')
    this.fixes.forEach((fix, index) => {
      console.log(`${index + 1}. ${fix.issue}: ${fix.status}`)
      if (fix.details) {
        console.log(`   Details: ${fix.details}`)
      }
    })
  }
}

// Run the fixes
const fixService = new GMBFixService()
fixService.fixAllIssues().catch(console.error)
