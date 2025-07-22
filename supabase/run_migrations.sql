-- Complete Migration Script - Run this in Supabase SQL Editor
-- This script safely handles existing tables and data

\echo 'Starting migration process...'

-- Step 1: Create core agency management tables
\echo 'Step 1: Creating agency management schema...'
\i 20250122_agency_management_fixed.sql

-- Step 2: Set up Row Level Security policies  
\echo 'Step 2: Setting up security policies...'
\i 20250122_rls_policies_fixed.sql

-- Step 3: Migrate existing data safely
\echo 'Step 3: Migrating existing data...'
\i 20250122_data_migration_safe.sql

-- Step 4: Create market intelligence table (if not exists)
\echo 'Step 4: Setting up market intelligence...'
CREATE TABLE IF NOT EXISTS market_intelligence (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    intelligence_type VARCHAR(50) NOT NULL CHECK (intelligence_type IN ('opportunity', 'risk', 'competitor', 'market_trend', 'customer_insight')),
    source VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    insights JSONB DEFAULT '{}',
    raw_data JSONB DEFAULT '{}',
    industry VARCHAR(100),
    location VARCHAR(200),
    time_period VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_market_intelligence_agency_id ON market_intelligence(agency_id);
CREATE INDEX IF NOT EXISTS idx_market_intelligence_type ON market_intelligence(intelligence_type);

-- Step 5: Create predictive analytics table (if not exists)
\echo 'Step 5: Setting up predictive analytics...'
CREATE TABLE IF NOT EXISTS predictive_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    forecast_type VARCHAR(50) NOT NULL,
    forecast_period VARCHAR(20) NOT NULL,
    predictions JSONB NOT NULL DEFAULT '{}',
    confidence_score DECIMAL(3,2) NOT NULL,
    historical_data_points INTEGER DEFAULT 0,
    intelligence_data_points INTEGER DEFAULT 0,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    model_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_predictive_analytics_agency_id ON predictive_analytics(agency_id);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_type ON predictive_analytics(forecast_type);

-- Step 6: Create task automation table (if not exists)
\echo 'Step 6: Setting up task automation...'
CREATE TABLE IF NOT EXISTS task_automation (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('critical', 'high_impact', 'strategic', 'long_term')),
    priority_score INTEGER NOT NULL CHECK (priority_score >= 0 AND priority_score <= 100),
    impact_score INTEGER NOT NULL CHECK (impact_score >= 1 AND impact_score <= 10),
    complexity VARCHAR(20) NOT NULL CHECK (complexity IN ('low', 'medium', 'high')),
    timeline VARCHAR(100) NOT NULL,
    resource_requirements TEXT NOT NULL,
    automation_possible BOOLEAN NOT NULL DEFAULT false,
    requires_human_decision BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'automated')),
    dependencies TEXT[] DEFAULT '{}',
    success_metrics TEXT[] DEFAULT '{}',
    due_date TIMESTAMP WITH TIME ZONE,
    assigned_to VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_automation_agency_id ON task_automation(agency_id);
CREATE INDEX IF NOT EXISTS idx_task_automation_status ON task_automation(status);

\echo 'Migration completed successfully!'
\echo 'Your agency management platform is now ready to use.'