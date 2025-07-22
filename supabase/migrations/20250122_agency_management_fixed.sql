-- Fixed Agency Management Schema - Checks for existing tables
-- Multi-tenant agency management system with enhanced features

-- Create agencies table (if not exists)
CREATE TABLE IF NOT EXISTS agencies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    description TEXT,
    logo_url TEXT,
    website VARCHAR(200),
    industry VARCHAR(100),
    location VARCHAR(200),
    
    -- Contact Information
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    
    -- Business Information
    business_type VARCHAR(100),
    target_market TEXT,
    founded_year INTEGER,
    team_size VARCHAR(50),
    
    -- Subscription and Plan Management
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'professional', 'enterprise', 'custom')),
    subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended', 'cancelled')),
    plan_limits JSONB DEFAULT '{}',
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
    
    -- Feature Flags and Settings
    settings JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',
    integrations JSONB DEFAULT '{}',
    
    -- Ownership and Management
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create agency_memberships table (if not exists)
CREATE TABLE IF NOT EXISTS agency_memberships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Role and Permissions
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'manager', 'analyst', 'specialist', 'viewer')),
    permissions JSONB DEFAULT '{}',
    
    -- Membership Details
    title VARCHAR(100),
    department VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive', 'suspended')),
    
    -- Invitation Management
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE,
    
    -- Access Control
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    access_level VARCHAR(20) DEFAULT 'standard' CHECK (access_level IN ('basic', 'standard', 'advanced', 'full')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Unique constraint: one membership per user per agency
    UNIQUE(agency_id, user_id)
);

-- Create enhanced clients table (if not exists)
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Basic Information
    business_name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(200),
    
    -- Business Details
    industry VARCHAR(100),
    business_type VARCHAR(100),
    location VARCHAR(200),
    address TEXT,
    
    -- Business Characteristics
    founded_year INTEGER,
    employee_count VARCHAR(50),
    annual_revenue VARCHAR(50),
    target_audience TEXT,
    unique_selling_proposition TEXT,
    
    -- Service and Relationship Management
    service_tier VARCHAR(50) DEFAULT 'standard' CHECK (service_tier IN ('basic', 'standard', 'premium', 'enterprise')),
    account_manager UUID REFERENCES auth.users(id),
    client_since DATE DEFAULT CURRENT_DATE,
    contract_value DECIMAL(12,2),
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'annual')),
    
    -- Status and Health
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('prospect', 'active', 'inactive', 'churned', 'paused')),
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    satisfaction_score DECIMAL(3,2) CHECK (satisfaction_score >= 0 AND satisfaction_score <= 5),
    
    -- Business Intelligence
    competitors TEXT[],
    market_position VARCHAR(100),
    growth_stage VARCHAR(50) CHECK (growth_stage IN ('startup', 'growth', 'mature', 'decline')),
    
    -- Configuration and Preferences
    audit_frequency VARCHAR(20) DEFAULT 'monthly' CHECK (audit_frequency IN ('weekly', 'bi-weekly', 'monthly', 'quarterly')),
    reporting_preferences JSONB DEFAULT '{}',
    communication_preferences JSONB DEFAULT '{}',
    
    -- Integration and External Data
    external_ids JSONB DEFAULT '{}',
    integrations JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    
    -- Audit Configuration
    audit_categories TEXT[] DEFAULT ARRAY['website', 'social_media', 'reviews', 'seo', 'competitors'],
    priority_areas TEXT[] DEFAULT '{}',
    
    -- Timestamps and Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_audit_at TIMESTAMP WITH TIME ZONE,
    next_audit_due TIMESTAMP WITH TIME ZONE
);

-- Add foreign key to existing audits table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'audits_agency_id_fkey'
    ) THEN
        ALTER TABLE audits ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update existing audits table to reference clients properly
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'audits_client_id_fkey' AND table_name = 'audits'
    ) THEN
        -- Drop existing constraint if it exists with different name
        ALTER TABLE audits DROP CONSTRAINT IF EXISTS audits_client_id_fkey;
        -- Add proper foreign key
        ALTER TABLE audits ADD CONSTRAINT audits_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_agencies_owner_id ON agencies(owner_id);
CREATE INDEX IF NOT EXISTS idx_agencies_slug ON agencies(slug);
CREATE INDEX IF NOT EXISTS idx_agencies_status ON agencies(status);
CREATE INDEX IF NOT EXISTS idx_agencies_subscription_plan ON agencies(subscription_plan);

CREATE INDEX IF NOT EXISTS idx_agency_memberships_agency_id ON agency_memberships(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_memberships_user_id ON agency_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_memberships_role ON agency_memberships(role);
CREATE INDEX IF NOT EXISTS idx_agency_memberships_status ON agency_memberships(status);

CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_industry ON clients(industry);
CREATE INDEX IF NOT EXISTS idx_clients_service_tier ON clients(service_tier);
CREATE INDEX IF NOT EXISTS idx_clients_account_manager ON clients(account_manager);
CREATE INDEX IF NOT EXISTS idx_clients_next_audit_due ON clients(next_audit_due);

CREATE INDEX IF NOT EXISTS idx_audits_agency_id ON audits(agency_id);

-- Create or replace trigger functions
CREATE OR REPLACE FUNCTION generate_agency_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL THEN
        NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
        -- Ensure uniqueness
        WHILE EXISTS (SELECT 1 FROM agencies WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
            NEW.slug := NEW.slug || '-' || EXTRACT(epoch FROM NOW())::integer;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_agency_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_membership_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_client_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers (drop existing first to avoid conflicts)
DROP TRIGGER IF EXISTS trigger_generate_agency_slug ON agencies;
CREATE TRIGGER trigger_generate_agency_slug
    BEFORE INSERT OR UPDATE ON agencies
    FOR EACH ROW
    EXECUTE FUNCTION generate_agency_slug();

DROP TRIGGER IF EXISTS trigger_update_agency_updated_at ON agencies;
CREATE TRIGGER trigger_update_agency_updated_at
    BEFORE UPDATE ON agencies
    FOR EACH ROW
    EXECUTE FUNCTION update_agency_updated_at();

DROP TRIGGER IF EXISTS trigger_update_membership_updated_at ON agency_memberships;
CREATE TRIGGER trigger_update_membership_updated_at
    BEFORE UPDATE ON agency_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_membership_updated_at();

DROP TRIGGER IF EXISTS trigger_update_client_updated_at ON clients;
CREATE TRIGGER trigger_update_client_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_client_updated_at();

-- Add helpful comments
COMMENT ON TABLE agencies IS 'Multi-tenant agencies with comprehensive business information and subscription management';
COMMENT ON TABLE agency_memberships IS 'User memberships in agencies with role-based permissions and access control';
COMMENT ON TABLE clients IS 'Enhanced client management with business intelligence and audit scheduling';

COMMENT ON COLUMN agencies.subscription_plan IS 'Subscription tier: starter, professional, enterprise, custom';
COMMENT ON COLUMN agencies.plan_limits IS 'JSON object defining limits: {"clients": 10, "audits_per_month": 50, "team_members": 3}';
COMMENT ON COLUMN agencies.features IS 'JSON object of enabled features: {"ai_insights": true, "automation": false}';

COMMENT ON COLUMN agency_memberships.role IS 'User role: owner (full access), manager (manage clients/team), analyst (create reports), specialist (limited access), viewer (read-only)';
COMMENT ON COLUMN agency_memberships.permissions IS 'JSON object of specific permissions overrides';
COMMENT ON COLUMN agency_memberships.access_level IS 'Access level within role: basic, standard, advanced, full';

COMMENT ON COLUMN clients.service_tier IS 'Service level: basic, standard, premium, enterprise';
COMMENT ON COLUMN clients.health_score IS 'Client health score from 0-100 based on engagement, satisfaction, and business metrics';
COMMENT ON COLUMN clients.audit_categories IS 'Array of audit focus areas for this client';