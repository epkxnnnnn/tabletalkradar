-- Multi-Tenant Agency Management System Migration
-- This migration transforms the existing single-business system into a multi-tenant agency platform

-- ============================================================================
-- 1. AGENCIES TABLE - Core tenant isolation
-- ============================================================================

CREATE TABLE agencies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subscription Management
  subscription_plan TEXT DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'professional', 'enterprise', 'custom')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'suspended', 'trial')),
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
  
  -- Agency Limits
  max_team_members INTEGER DEFAULT 3,
  max_clients INTEGER DEFAULT 10,
  max_monthly_audits INTEGER DEFAULT 50,
  
  -- Agency Settings
  settings JSONB DEFAULT '{}',
  branding JSONB DEFAULT '{}', -- For white-label customization
  
  -- Contact Information
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  address JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. AGENCY MEMBERSHIPS - Team management with roles
-- ============================================================================

CREATE TABLE agency_memberships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role-based access control
  role TEXT DEFAULT 'analyst' CHECK (role IN ('owner', 'admin', 'manager', 'analyst', 'client_manager')),
  permissions JSONB DEFAULT '{}',
  
  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id),
  invitation_token TEXT,
  invitation_expires_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'suspended', 'removed')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(agency_id, user_id)
);

-- ============================================================================
-- 3. CLIENT ASSIGNMENTS - Assign clients to team members
-- ============================================================================

CREATE TABLE client_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Assignment details
  role TEXT DEFAULT 'assigned' CHECK (role IN ('primary', 'assigned', 'observer')),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(client_id, user_id)
);

-- ============================================================================
-- 4. UPGRADE EXISTING TABLES - Add agency context
-- ============================================================================

-- Add agency_id to existing tables for tenant isolation
ALTER TABLE clients ADD COLUMN agency_id UUID REFERENCES agencies(id);
ALTER TABLE clients ADD COLUMN client_tier TEXT DEFAULT 'standard' CHECK (client_tier IN ('basic', 'standard', 'premium', 'enterprise'));

ALTER TABLE audits ADD COLUMN agency_id UUID REFERENCES agencies(id);
ALTER TABLE reports ADD COLUMN agency_id UUID REFERENCES agencies(id);
ALTER TABLE action_items ADD COLUMN agency_id UUID REFERENCES agencies(id);
ALTER TABLE notifications ADD COLUMN agency_id UUID REFERENCES agencies(id);

-- Update profiles table for enhanced roles
ALTER TABLE profiles 
  ADD COLUMN current_agency_id UUID REFERENCES agencies(id),
  ADD COLUMN agency_role TEXT DEFAULT 'business_owner';

-- Update existing role constraint to include new agency roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('business_owner', 'agency', 'superadmin', 'agency_owner', 'agency_admin', 'client_manager', 'analyst'));

-- ============================================================================
-- 5. INTELLIGENCE LAYER TABLES - For AI-powered insights
-- ============================================================================

CREATE TABLE market_intelligence (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Intelligence type and source
  intelligence_type TEXT NOT NULL CHECK (intelligence_type IN ('competitor', 'market_trend', 'opportunity', 'risk', 'customer_insight')),
  source TEXT NOT NULL CHECK (source IN ('perplexity', 'claude', 'openai', 'gemini', 'kimi', 'manual')),
  confidence_score DECIMAL(3,2) DEFAULT 0.85, -- AI confidence in the intelligence
  
  -- Intelligence data
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  insights JSONB NOT NULL,
  raw_data JSONB,
  
  -- Context
  industry TEXT,
  location TEXT,
  time_period TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Some intelligence has expiry
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Indexing for performance
  created_at_date DATE GENERATED ALWAYS AS (DATE(created_at)) STORED
);

CREATE TABLE predictive_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Prediction details
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('revenue', 'risk', 'opportunity', 'customer_behavior', 'market_change')),
  prediction_data JSONB NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  
  -- Time context
  prediction_date DATE NOT NULL,
  prediction_period TEXT NOT NULL, -- 'week', 'month', 'quarter'
  
  -- Validation
  actual_outcome JSONB,
  accuracy_score DECIMAL(3,2),
  validated_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  model_version TEXT DEFAULT '1.0'
);

-- ============================================================================
-- 6. AUTOMATION LAYER TABLES - Task and workflow automation
-- ============================================================================

CREATE TABLE automation_workflows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id), -- NULL for agency-wide workflows
  
  -- Workflow details
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('review_management', 'social_media', 'seo', 'reporting', 'monitoring')),
  
  -- Configuration
  triggers JSONB NOT NULL, -- What triggers this workflow
  actions JSONB NOT NULL, -- What actions to take
  conditions JSONB, -- Conditions that must be met
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  
  -- Statistics
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE automation_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workflow_id UUID REFERENCES automation_workflows(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  
  -- Execution details
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Results
  actions_taken JSONB,
  results JSONB,
  error_message TEXT,
  
  -- Context
  triggered_by TEXT, -- What triggered this run
  execution_time_ms INTEGER
);

-- ============================================================================
-- 7. COMMUNICATION LAYER TABLES - Enhanced client communication
-- ============================================================================

CREATE TABLE client_communications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Communication details
  communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'sms', 'call', 'meeting', 'report', 'alert')),
  subject TEXT,
  content TEXT NOT NULL,
  
  -- Recipients and sender
  sent_by UUID REFERENCES auth.users(id),
  recipients JSONB NOT NULL, -- Array of recipients
  
  -- Status tracking
  status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'scheduled', 'sent', 'delivered', 'read', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  template_used TEXT,
  auto_generated BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- 8. INDEXES for Performance
-- ============================================================================

-- Agency and membership indexes
CREATE INDEX idx_agencies_owner ON agencies(owner_id);
CREATE INDEX idx_agency_memberships_agency ON agency_memberships(agency_id);
CREATE INDEX idx_agency_memberships_user ON agency_memberships(user_id);
CREATE INDEX idx_agency_memberships_status ON agency_memberships(status);

-- Client and assignment indexes
CREATE INDEX idx_clients_agency ON clients(agency_id);
CREATE INDEX idx_client_assignments_client ON client_assignments(client_id);
CREATE INDEX idx_client_assignments_user ON client_assignments(user_id);
CREATE INDEX idx_client_assignments_agency ON client_assignments(agency_id);

-- Intelligence layer indexes
CREATE INDEX idx_market_intelligence_agency ON market_intelligence(agency_id);
CREATE INDEX idx_market_intelligence_client ON market_intelligence(client_id);
CREATE INDEX idx_market_intelligence_type ON market_intelligence(intelligence_type);
CREATE INDEX idx_market_intelligence_date ON market_intelligence(created_at_date);

CREATE INDEX idx_predictive_analytics_agency ON predictive_analytics(agency_id);
CREATE INDEX idx_predictive_analytics_client ON predictive_analytics(client_id);
CREATE INDEX idx_predictive_analytics_type ON predictive_analytics(prediction_type);
CREATE INDEX idx_predictive_analytics_date ON predictive_analytics(prediction_date);

-- Automation indexes
CREATE INDEX idx_automation_workflows_agency ON automation_workflows(agency_id);
CREATE INDEX idx_automation_workflows_client ON automation_workflows(client_id);
CREATE INDEX idx_automation_workflows_active ON automation_workflows(is_active);
CREATE INDEX idx_automation_logs_workflow ON automation_logs(workflow_id);
CREATE INDEX idx_automation_logs_status ON automation_logs(status);

-- Communication indexes
CREATE INDEX idx_client_communications_agency ON client_communications(agency_id);
CREATE INDEX idx_client_communications_client ON client_communications(client_id);
CREATE INDEX idx_client_communications_type ON client_communications(communication_type);
CREATE INDEX idx_client_communications_status ON client_communications(status);

-- ============================================================================
-- 9. FUNCTIONS for Agency Operations
-- ============================================================================

-- Function to create a slug from agency name
CREATE OR REPLACE FUNCTION generate_agency_slug(agency_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Generate base slug from name
    base_slug := LOWER(REGEXP_REPLACE(agency_name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := TRIM(base_slug, '-');
    
    -- Ensure uniqueness
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM agencies WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter::TEXT;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create agency membership for owner
CREATE OR REPLACE FUNCTION create_agency_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO agency_memberships (
        agency_id,
        user_id,
        role,
        status,
        joined_at
    ) VALUES (
        NEW.id,
        NEW.owner_id,
        'owner',
        'active',
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create owner membership
CREATE TRIGGER trigger_create_agency_owner_membership
    AFTER INSERT ON agencies
    FOR EACH ROW
    EXECUTE FUNCTION create_agency_owner_membership();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER update_agencies_updated_at
    BEFORE UPDATE ON agencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agency_memberships_updated_at
    BEFORE UPDATE ON agency_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_workflows_updated_at
    BEFORE UPDATE ON automation_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();