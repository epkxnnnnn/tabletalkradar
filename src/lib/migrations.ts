import { supabaseAdmin } from './supabase-admin'
import { logger } from './logger'

interface Migration {
  id: string
  name: string
  version: number
  up: () => Promise<void>
  down: () => Promise<void>
  description: string
}

class MigrationManager {
  private migrations: Migration[] = []
  private currentVersion = 0

  constructor() {
    this.initializeMigrations()
  }

  private initializeMigrations() {
    // Migration 1: Initial schema
    this.migrations.push({
      id: '001_initial_schema',
      name: 'Initial Schema',
      version: 1,
      description: 'Create initial database schema with profiles, clients, audits tables',
      up: async () => {
        await supabaseAdmin().rpc('exec_sql', {
          sql: `
            -- Enable UUID extension
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            
            -- Create profiles table
            CREATE TABLE IF NOT EXISTS profiles (
              id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
              full_name TEXT,
              email TEXT,
              company_name TEXT,
              role TEXT CHECK (role IN ('business_owner', 'agency', 'superadmin')) DEFAULT 'business_owner',
              avatar_url TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Create clients table
            CREATE TABLE IF NOT EXISTS clients (
              id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              business_name TEXT NOT NULL,
              website TEXT,
              category TEXT,
              contact_email TEXT,
              contact_phone TEXT,
              notes TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Create audits table
            CREATE TABLE IF NOT EXISTS audits (
              id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
              business_name TEXT NOT NULL,
              website TEXT,
              category TEXT,
              overall_score INTEGER,
              audit_data JSONB,
              status TEXT DEFAULT 'completed',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        })
      },
      down: async () => {
        await supabaseAdmin().rpc('exec_sql', {
          sql: `
            DROP TABLE IF EXISTS audits;
            DROP TABLE IF EXISTS clients;
            DROP TABLE IF EXISTS profiles;
          `
        })
      }
    })

    // Migration 2: Add action items and reports
    this.migrations.push({
      id: '002_action_items_reports',
      name: 'Action Items and Reports',
      version: 2,
      description: 'Add action_items, report_templates, and reports tables',
      up: async () => {
        await supabaseAdmin().rpc('exec_sql', {
          sql: `
            -- Create action_items table
            CREATE TABLE IF NOT EXISTS action_items (
              id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
              title TEXT NOT NULL,
              description TEXT,
              priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
              status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
              due_date TIMESTAMP WITH TIME ZONE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Create report_templates table
            CREATE TABLE IF NOT EXISTS report_templates (
              id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              name TEXT NOT NULL,
              description TEXT,
              sections TEXT[] DEFAULT ARRAY['executive_summary', 'audit_results', 'recommendations'],
              is_default BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Create reports table
            CREATE TABLE IF NOT EXISTS reports (
              id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
              template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
              business_name TEXT NOT NULL,
              status TEXT CHECK (status IN ('draft', 'generated', 'delivered')) DEFAULT 'draft',
              report_data JSONB,
              download_url TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        })
      },
      down: async () => {
        await supabaseAdmin().rpc('exec_sql', {
          sql: `
            DROP TABLE IF EXISTS reports;
            DROP TABLE IF EXISTS report_templates;
            DROP TABLE IF EXISTS action_items;
          `
        })
      }
    })

    // Migration 3: Add integrations and team management
    this.migrations.push({
      id: '003_integrations_team',
      name: 'Integrations and Team Management',
      version: 3,
      description: 'Add integrations, team_members, communications, and performance_metrics tables',
      up: async () => {
        await supabaseAdmin().rpc('exec_sql', {
          sql: `
            -- Create integrations table
            CREATE TABLE IF NOT EXISTS integrations (
              id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              platform TEXT NOT NULL,
              account_name TEXT NOT NULL,
              account_id TEXT NOT NULL,
              is_connected BOOLEAN DEFAULT FALSE,
              last_sync TIMESTAMP WITH TIME ZONE,
              permissions TEXT[] DEFAULT ARRAY['read'],
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Create team_members table
            CREATE TABLE IF NOT EXISTS team_members (
              id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              agency_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              full_name TEXT NOT NULL,
              email TEXT NOT NULL,
              role TEXT CHECK (role IN ('admin', 'manager', 'analyst', 'viewer')) DEFAULT 'analyst',
              permissions TEXT[] DEFAULT ARRAY['read'],
              is_active BOOLEAN DEFAULT TRUE,
              joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              last_active TIMESTAMP WITH TIME ZONE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Create communications table
            CREATE TABLE IF NOT EXISTS communications (
              id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
              team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
              agency_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
              type TEXT CHECK (type IN ('email', 'call', 'meeting', 'note')) NOT NULL,
              subject TEXT NOT NULL,
              content TEXT,
              status TEXT CHECK (status IN ('sent', 'scheduled', 'draft')) DEFAULT 'draft',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Create performance_metrics table
            CREATE TABLE IF NOT EXISTS performance_metrics (
              id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
              team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
              agency_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              metric_type TEXT CHECK (metric_type IN ('audits_completed', 'clients_managed', 'reports_generated', 'response_time')) NOT NULL,
              value INTEGER NOT NULL,
              target INTEGER,
              period TEXT CHECK (period IN ('daily', 'weekly', 'monthly')) DEFAULT 'monthly',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        })
      },
      down: async () => {
        await supabaseAdmin().rpc('exec_sql', {
          sql: `
            DROP TABLE IF EXISTS performance_metrics;
            DROP TABLE IF EXISTS communications;
            DROP TABLE IF EXISTS team_members;
            DROP TABLE IF EXISTS integrations;
          `
        })
      }
    })
  }

  async getCurrentVersion(): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin()
        .from('schema_migrations')
        .select('version')
        .order('version', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data?.version || 0
    } catch (error) {
      // If schema_migrations table doesn't exist, create it
      await this.createMigrationsTable()
      return 0
    }
  }

  private async createMigrationsTable(): Promise<void> {
    await supabaseAdmin().rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          version INTEGER NOT NULL UNIQUE,
          name TEXT NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
  }

  async migrate(targetVersion?: number): Promise<void> {
    const currentVersion = await this.getCurrentVersion()
    const target = targetVersion || Math.max(...this.migrations.map(m => m.version))

    logger.info(`Starting migration from version ${currentVersion} to ${target}`)

    if (target > currentVersion) {
      // Migrate up
      for (const migration of this.migrations) {
        if (migration.version > currentVersion && migration.version <= target) {
          await this.runMigration(migration, 'up')
        }
      }
    } else if (target < currentVersion) {
      // Migrate down
      const reverseMigrations = [...this.migrations].reverse()
      for (const migration of reverseMigrations) {
        if (migration.version <= currentVersion && migration.version > target) {
          await this.runMigration(migration, 'down')
        }
      }
    }

    logger.info(`Migration completed. Current version: ${await this.getCurrentVersion()}`)
  }

  private async runMigration(migration: Migration, direction: 'up' | 'down'): Promise<void> {
    logger.info(`Running migration ${migration.id} (${direction})`)
    
    try {
      if (direction === 'up') {
        await migration.up()
        await this.recordMigration(migration)
      } else {
        await migration.down()
        await this.removeMigration(migration)
      }
      
      logger.info(`Migration ${migration.id} completed successfully`)
    } catch (error) {
      logger.error(`Migration ${migration.id} failed`, { error })
      throw error
    }
  }

  private async recordMigration(migration: Migration): Promise<void> {
    await supabaseAdmin()
      .from('schema_migrations')
      .insert({
        version: migration.version,
        name: migration.name
      })
  }

  private async removeMigration(migration: Migration): Promise<void> {
    await supabaseAdmin()
      .from('schema_migrations')
      .delete()
      .eq('version', migration.version)
  }

  async getMigrationStatus(): Promise<{ current: number; pending: Migration[]; completed: Migration[] }> {
    const currentVersion = await this.getCurrentVersion()
    const completed = this.migrations.filter(m => m.version <= currentVersion)
    const pending = this.migrations.filter(m => m.version > currentVersion)

    return {
      current: currentVersion,
      pending,
      completed
    }
  }
}

export const migrationManager = new MigrationManager() 