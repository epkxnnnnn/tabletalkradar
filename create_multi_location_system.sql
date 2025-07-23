-- Enhanced multi-location client system with Google Business Profile data
-- Run this in your Supabase SQL Editor

-- Create locations table for multi-location clients
CREATE TABLE IF NOT EXISTS client_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Location basic info
    location_name VARCHAR(200) NOT NULL, -- e.g., "Downtown Location", "Airport Branch"
    business_name VARCHAR(200) NOT NULL, -- Can be different from main client name
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) DEFAULT 'US',
    phone VARCHAR(50),
    email VARCHAR(200),
    website VARCHAR(500),
    
    -- Google Business Profile data
    google_place_id VARCHAR(200) UNIQUE,
    google_business_profile_url VARCHAR(500),
    google_my_business_id VARCHAR(200),
    business_description TEXT,
    business_hours JSONB, -- Store opening hours
    business_categories TEXT[], -- Primary and secondary categories
    price_level INTEGER CHECK (price_level >= 1 AND price_level <= 4), -- Google's 1-4 scale
    
    -- Google Business Profile metrics (updated weekly by you)
    google_rating DECIMAL(2,1) CHECK (google_rating >= 0 AND google_rating <= 5),
    google_review_count INTEGER DEFAULT 0,
    google_photo_count INTEGER DEFAULT 0,
    google_posts_count INTEGER DEFAULT 0,
    google_questions_answered INTEGER DEFAULT 0,
    google_listing_completeness DECIMAL(5,2) DEFAULT 0, -- Percentage 0-100
    
    -- Local SEO scores (your proprietary scoring, updated weekly)
    local_seo_score DECIMAL(5,2) DEFAULT 0, -- Overall score 0-100
    citation_score DECIMAL(5,2) DEFAULT 0, -- Citation consistency score
    review_score DECIMAL(5,2) DEFAULT 0, -- Review quality/quantity score
    visibility_score DECIMAL(5,2) DEFAULT 0, -- Local search visibility
    optimization_score DECIMAL(5,2) DEFAULT 0, -- On-page optimization
    
    -- Competition analysis (updated weekly)
    local_competition_level VARCHAR(20) DEFAULT 'medium' CHECK (local_competition_level IN ('low', 'medium', 'high', 'very_high')),
    market_position INTEGER, -- Ranking among local competitors (1 = best)
    competitor_count INTEGER DEFAULT 0,
    
    -- Status and settings
    is_primary_location BOOLEAN DEFAULT FALSE, -- Main location for the client
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    
    -- Data freshness tracking (hidden from clients)
    gbp_data_last_updated TIMESTAMP WITH TIME ZONE,
    seo_data_last_updated TIMESTAMP WITH TIME ZONE,
    last_scraped_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_locations_client_id ON client_locations(client_id);
CREATE INDEX IF NOT EXISTS idx_locations_agency_id ON client_locations(agency_id);
CREATE INDEX IF NOT EXISTS idx_locations_google_place_id ON client_locations(google_place_id);
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON client_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_locations_is_primary ON client_locations(is_primary_location);

-- Create keyword tracking table
CREATE TABLE IF NOT EXISTS location_keywords (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    location_id UUID NOT NULL REFERENCES client_locations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Keyword data
    keyword VARCHAR(200) NOT NULL,
    keyword_type VARCHAR(50) DEFAULT 'primary' CHECK (keyword_type IN ('primary', 'secondary', 'branded', 'local', 'long_tail')),
    search_volume INTEGER DEFAULT 0, -- Monthly search volume
    competition_level VARCHAR(20) DEFAULT 'medium' CHECK (competition_level IN ('low', 'medium', 'high')),
    
    -- Ranking data (updated weekly)
    current_rank INTEGER,
    previous_rank INTEGER,
    best_rank INTEGER,
    worst_rank INTEGER,
    rank_change INTEGER, -- Difference from last week
    
    -- Search result data
    search_url VARCHAR(500), -- URL that's ranking
    featured_snippet BOOLEAN DEFAULT FALSE,
    local_pack_position INTEGER, -- Position in local 3-pack (1-3)
    
    -- Tracking settings
    is_tracking BOOLEAN DEFAULT TRUE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Data freshness
    last_checked_at TIMESTAMP WITH TIME ZONE,
    rank_history JSONB DEFAULT '[]', -- Store historical ranking data
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Unique constraint to prevent duplicate keywords per location
    UNIQUE(location_id, keyword)
);

-- Create indexes for keyword tracking
CREATE INDEX IF NOT EXISTS idx_keywords_location_id ON location_keywords(location_id);
CREATE INDEX IF NOT EXISTS idx_keywords_client_id ON location_keywords(client_id);
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON location_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_keywords_tracking ON location_keywords(is_tracking);
CREATE INDEX IF NOT EXISTS idx_keywords_rank ON location_keywords(current_rank);

-- Create SEO audit history table (for tracking weekly updates)
CREATE TABLE IF NOT EXISTS location_seo_audits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    location_id UUID NOT NULL REFERENCES client_locations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Audit data snapshot
    audit_date DATE NOT NULL,
    audit_type VARCHAR(50) DEFAULT 'weekly' CHECK (audit_type IN ('weekly', 'monthly', 'quarterly', 'manual')),
    
    -- Scores at time of audit
    local_seo_score DECIMAL(5,2) DEFAULT 0,
    citation_score DECIMAL(5,2) DEFAULT 0,
    review_score DECIMAL(5,2) DEFAULT 0,
    visibility_score DECIMAL(5,2) DEFAULT 0,
    optimization_score DECIMAL(5,2) DEFAULT 0,
    
    -- Google Business Profile metrics
    google_rating DECIMAL(2,1),
    google_review_count INTEGER,
    google_listing_completeness DECIMAL(5,2),
    
    -- Issues and recommendations (shown to clients)
    issues_found JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    improvements_made TEXT,
    
    -- Performance metrics
    total_keywords_tracked INTEGER DEFAULT 0,
    keywords_ranking_top_3 INTEGER DEFAULT 0,
    keywords_ranking_top_10 INTEGER DEFAULT 0,
    average_keyword_rank DECIMAL(5,2),
    
    -- Notes (internal, hidden from clients)
    internal_notes TEXT,
    data_sources JSONB DEFAULT '{}', -- Track where data came from
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id), -- Agency user who ran the audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for SEO audits
CREATE INDEX IF NOT EXISTS idx_seo_audits_location_id ON location_seo_audits(location_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_client_id ON location_seo_audits(client_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_date ON location_seo_audits(audit_date);
CREATE INDEX IF NOT EXISTS idx_seo_audits_type ON location_seo_audits(audit_type);

-- Update existing tables to support multi-location

-- Add location_id to social_media_posts
ALTER TABLE social_media_posts 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES client_locations(id) ON DELETE SET NULL;

-- Add location_id to reviews
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES client_locations(id) ON DELETE SET NULL;

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_locations_updated_at ON client_locations;
CREATE TRIGGER trigger_update_locations_updated_at
    BEFORE UPDATE ON client_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_locations_updated_at();

CREATE OR REPLACE FUNCTION update_keywords_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_keywords_updated_at ON location_keywords;
CREATE TRIGGER trigger_update_keywords_updated_at
    BEFORE UPDATE ON location_keywords
    FOR EACH ROW
    EXECUTE FUNCTION update_keywords_updated_at();

-- Row Level Security for multi-location system

-- Enable RLS on new tables
ALTER TABLE client_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_seo_audits ENABLE ROW LEVEL SECURITY;

-- Policies for client_locations
CREATE POLICY "Client users can view own locations" ON client_locations
    FOR SELECT USING (
        client_id IN (
            SELECT client_id FROM client_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Agency owners can manage all locations in their agency" ON client_locations
    FOR ALL USING (
        agency_id IN (
            SELECT id FROM agencies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policies for location_keywords
CREATE POLICY "Client users can view own location keywords" ON location_keywords
    FOR SELECT USING (
        client_id IN (
            SELECT client_id FROM client_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Agency owners can manage all keywords" ON location_keywords
    FOR ALL USING (
        agency_id IN (
            SELECT id FROM agencies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policies for location_seo_audits (read-only for clients)
CREATE POLICY "Client users can view own location audits" ON location_seo_audits
    FOR SELECT USING (
        client_id IN (
            SELECT client_id FROM client_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Agency owners can manage all audits" ON location_seo_audits
    FOR ALL USING (
        agency_id IN (
            SELECT id FROM agencies 
            WHERE owner_id = auth.uid()
        )
    );

-- Function to create default location for existing single-location clients
CREATE OR REPLACE FUNCTION migrate_clients_to_locations()
RETURNS VOID AS $$
DECLARE
    client_record RECORD;
    location_id UUID;
BEGIN
    FOR client_record IN 
        SELECT c.*, a.id as agency_id
        FROM clients c
        JOIN agencies a ON c.agency_id = a.id
        WHERE NOT EXISTS (
            SELECT 1 FROM client_locations cl WHERE cl.client_id = c.id
        )
    LOOP
        -- Create primary location for existing client
        INSERT INTO client_locations (
            client_id,
            agency_id,
            location_name,
            business_name,
            address,
            city,
            state,
            zip_code,
            phone,
            email,
            website,
            business_description,
            is_primary_location,
            is_active,
            display_order
        ) VALUES (
            client_record.id,
            client_record.agency_id,
            'Main Location',
            client_record.business_name,
            COALESCE(client_record.location, 'Address not provided'),
            COALESCE(client_record.location, 'City not provided'),
            'State not provided',
            '00000',
            client_record.phone,
            client_record.email,
            client_record.website,
            COALESCE(client_record.unique_selling_proposition, 'Business description not provided'),
            true, -- Primary location
            true, -- Active
            1 -- Display order
        ) RETURNING id INTO location_id;
        
        -- Update social media posts to link to this location
        UPDATE social_media_posts 
        SET location_id = location_id 
        WHERE client_id = client_record.id AND location_id IS NULL;
        
        -- Update reviews to link to this location
        UPDATE reviews 
        SET location_id = location_id 
        WHERE client_id = client_record.id AND location_id IS NULL;
        
        RAISE NOTICE 'Created primary location for client: %', client_record.business_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to add sample keywords for a location
CREATE OR REPLACE FUNCTION add_sample_keywords(p_location_id UUID, p_business_name TEXT, p_city TEXT, p_industry TEXT)
RETURNS VOID AS $$
DECLARE
    v_client_id UUID;
    v_agency_id UUID;
BEGIN
    -- Get client and agency IDs
    SELECT client_id, agency_id INTO v_client_id, v_agency_id 
    FROM client_locations WHERE id = p_location_id;
    
    -- Add industry-specific keywords
    IF p_industry ILIKE '%restaurant%' OR p_industry ILIKE '%food%' THEN
        INSERT INTO location_keywords (location_id, client_id, agency_id, keyword, keyword_type, priority) VALUES
        (p_location_id, v_client_id, v_agency_id, p_business_name, 'branded', 'critical'),
        (p_location_id, v_client_id, v_agency_id, p_business_name || ' ' || p_city, 'local', 'high'),
        (p_location_id, v_client_id, v_agency_id, 'restaurants near me', 'primary', 'high'),
        (p_location_id, v_client_id, v_agency_id, 'best restaurants ' || p_city, 'local', 'high'),
        (p_location_id, v_client_id, v_agency_id, 'food delivery ' || p_city, 'secondary', 'medium'),
        (p_location_id, v_client_id, v_agency_id, p_industry || ' ' || p_city, 'local', 'medium'),
        (p_location_id, v_client_id, v_agency_id, 'restaurant reviews ' || p_city, 'long_tail', 'low');
    ELSE
        -- Generic business keywords
        INSERT INTO location_keywords (location_id, client_id, agency_id, keyword, keyword_type, priority) VALUES
        (p_location_id, v_client_id, v_agency_id, p_business_name, 'branded', 'critical'),
        (p_location_id, v_client_id, v_agency_id, p_business_name || ' ' || p_city, 'local', 'high'),
        (p_location_id, v_client_id, v_agency_id, p_industry || ' near me', 'primary', 'high'),
        (p_location_id, v_client_id, v_agency_id, 'best ' || p_industry || ' ' || p_city, 'local', 'medium');
    END IF;
    
    RAISE NOTICE 'Added sample keywords for location: % in %', p_business_name, p_city;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE client_locations IS 'Multi-location support for restaurant groups and businesses with multiple locations';
COMMENT ON TABLE location_keywords IS 'SEO keyword tracking for each business location';
COMMENT ON TABLE location_seo_audits IS 'Weekly SEO audit history and performance tracking';
COMMENT ON COLUMN client_locations.gbp_data_last_updated IS 'Last time Google Business Profile data was updated (hidden from clients)';
COMMENT ON COLUMN client_locations.seo_data_last_updated IS 'Last time SEO scores were updated (hidden from clients)';
COMMENT ON COLUMN location_seo_audits.internal_notes IS 'Internal notes not visible to clients';

-- Migrate existing clients to have locations
SELECT migrate_clients_to_locations();

-- Verify the migration
SELECT 
    c.business_name,
    cl.location_name,
    cl.is_primary_location,
    cl.address
FROM clients c
JOIN client_locations cl ON c.id = cl.client_id
JOIN agencies a ON c.agency_id = a.id
WHERE a.owner_id = auth.uid()
ORDER BY c.business_name, cl.display_order;