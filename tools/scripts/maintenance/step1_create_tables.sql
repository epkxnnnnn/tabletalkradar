-- Step 1: Create the multi-location tables
-- Run this first in your Supabase SQL Editor

-- Create locations table for multi-location clients
CREATE TABLE IF NOT EXISTS client_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Location basic info
    location_name VARCHAR(200) NOT NULL,
    business_name VARCHAR(200) NOT NULL,
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
    business_hours JSONB,
    business_categories TEXT[],
    price_level INTEGER CHECK (price_level >= 1 AND price_level <= 4),
    
    -- Google Business Profile metrics
    google_rating DECIMAL(2,1) CHECK (google_rating >= 0 AND google_rating <= 5),
    google_review_count INTEGER DEFAULT 0,
    google_photo_count INTEGER DEFAULT 0,
    google_posts_count INTEGER DEFAULT 0,
    google_questions_answered INTEGER DEFAULT 0,
    google_listing_completeness DECIMAL(5,2) DEFAULT 0,
    
    -- Local SEO scores
    local_seo_score DECIMAL(5,2) DEFAULT 0,
    citation_score DECIMAL(5,2) DEFAULT 0,
    review_score DECIMAL(5,2) DEFAULT 0,
    visibility_score DECIMAL(5,2) DEFAULT 0,
    optimization_score DECIMAL(5,2) DEFAULT 0,
    
    -- Competition analysis
    local_competition_level VARCHAR(20) DEFAULT 'medium' CHECK (local_competition_level IN ('low', 'medium', 'high', 'very_high')),
    market_position INTEGER,
    competitor_count INTEGER DEFAULT 0,
    
    -- Status and settings
    is_primary_location BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    
    -- Data freshness tracking
    gbp_data_last_updated TIMESTAMP WITH TIME ZONE,
    seo_data_last_updated TIMESTAMP WITH TIME ZONE,
    last_scraped_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create keyword tracking table
CREATE TABLE IF NOT EXISTS location_keywords (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    location_id UUID NOT NULL REFERENCES client_locations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Keyword data
    keyword VARCHAR(200) NOT NULL,
    keyword_type VARCHAR(50) DEFAULT 'primary' CHECK (keyword_type IN ('primary', 'secondary', 'branded', 'local', 'long_tail')),
    search_volume INTEGER DEFAULT 0,
    competition_level VARCHAR(20) DEFAULT 'medium' CHECK (competition_level IN ('low', 'medium', 'high')),
    
    -- Ranking data
    current_rank INTEGER,
    previous_rank INTEGER,
    best_rank INTEGER,
    worst_rank INTEGER,
    rank_change INTEGER,
    
    -- Search result data
    search_url VARCHAR(500),
    featured_snippet BOOLEAN DEFAULT FALSE,
    local_pack_position INTEGER,
    
    -- Tracking settings
    is_tracking BOOLEAN DEFAULT TRUE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Data freshness
    last_checked_at TIMESTAMP WITH TIME ZONE,
    rank_history JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    UNIQUE(location_id, keyword)
);

-- Create SEO audit history table
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
    
    -- Issues and recommendations
    issues_found JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    improvements_made TEXT,
    
    -- Performance metrics
    total_keywords_tracked INTEGER DEFAULT 0,
    keywords_ranking_top_3 INTEGER DEFAULT 0,
    keywords_ranking_top_10 INTEGER DEFAULT 0,
    average_keyword_rank DECIMAL(5,2),
    
    -- Notes
    internal_notes TEXT,
    data_sources JSONB DEFAULT '{}',
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_locations_client_id ON client_locations(client_id);
CREATE INDEX IF NOT EXISTS idx_locations_agency_id ON client_locations(agency_id);
CREATE INDEX IF NOT EXISTS idx_keywords_location_id ON location_keywords(location_id);
CREATE INDEX IF NOT EXISTS idx_keywords_client_id ON location_keywords(client_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_location_id ON location_seo_audits(location_id);

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('client_locations', 'location_keywords', 'location_seo_audits')
ORDER BY table_name;