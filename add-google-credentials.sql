-- Add Google API credentials to clients table
-- Run this SQL in your Supabase SQL editor to add the missing columns

ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_client_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_client_secret TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_account_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_connected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_business_verified BOOLEAN DEFAULT FALSE;

-- Add agency support columns if not exists
ALTER TABLE clients ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_agency BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));

-- Create client_locations table for multiple locations per client
CREATE TABLE IF NOT EXISTS client_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  phone TEXT,
  website TEXT,
  google_place_id TEXT,
  google_account_id TEXT,
  google_location_id TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  local_seo_score INTEGER DEFAULT 0,
  citation_score INTEGER DEFAULT 0,
  review_score INTEGER DEFAULT 0,
  visibility_score INTEGER DEFAULT 0,
  optimization_score INTEGER DEFAULT 0,
  google_rating DECIMAL(2, 1),
  google_review_count INTEGER DEFAULT 0,
  google_photo_count INTEGER DEFAULT 0,
  google_posts_count INTEGER DEFAULT 0,
  google_questions_answered INTEGER DEFAULT 0,
  google_listing_completeness INTEGER DEFAULT 0,
  seo_data_last_updated TIMESTAMP WITH TIME ZONE,
  gbp_data_last_updated TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create google_business_posts table
CREATE TABLE IF NOT EXISTS google_business_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location_id UUID REFERENCES client_locations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  google_post_id TEXT,
  post_type TEXT CHECK (post_type IN ('CALL_TO_ACTION', 'EVENT', 'OFFER')) DEFAULT 'CALL_TO_ACTION',
  summary TEXT NOT NULL,
  post_data JSONB,
  google_response JSONB,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create google_business_qna table
CREATE TABLE IF NOT EXISTS google_business_qna (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location_id UUID REFERENCES client_locations(id) ON DELETE CASCADE,
  google_question_id TEXT UNIQUE,
  question_text TEXT NOT NULL,
  author JSONB,
  total_answer_count INTEGER DEFAULT 0,
  question_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create qna_activities table
CREATE TABLE IF NOT EXISTS qna_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location_id UUID REFERENCES client_locations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  google_question_id TEXT,
  activity_type TEXT CHECK (activity_type IN ('answer_posted', 'answer_updated', 'answer_deleted')) DEFAULT 'answer_posted',
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create review_activities table
CREATE TABLE IF NOT EXISTS review_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  review_id UUID,
  location_id UUID REFERENCES client_locations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  activity_type TEXT CHECK (activity_type IN ('reply_posted', 'reply_updated', 'reply_deleted')) DEFAULT 'reply_posted',
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table if not exists
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location_id UUID REFERENCES client_locations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT DEFAULT 'google' CHECK (platform IN ('google', 'yelp', 'facebook')),
  external_review_id TEXT,
  reviewer_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_date TIMESTAMP WITH TIME ZONE,
  response_status TEXT DEFAULT 'pending' CHECK (response_status IN ('pending', 'responded', 'ignored')),
  response_text TEXT,
  response_date TIMESTAMP WITH TIME ZONE,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  ai_suggested_reply TEXT,
  google_reply_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(external_review_id, platform)
);

-- Create location_keywords table for ranking tracking
CREATE TABLE IF NOT EXISTS location_keywords (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location_id UUID REFERENCES client_locations(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  current_rank INTEGER,
  previous_rank INTEGER,
  rank_change INTEGER DEFAULT 0,
  best_rank INTEGER DEFAULT 999,
  worst_rank INTEGER DEFAULT 0,
  rank_history JSONB DEFAULT '[]'::jsonb,
  search_volume INTEGER,
  competition TEXT CHECK (competition IN ('low', 'medium', 'high')),
  is_tracking BOOLEAN DEFAULT TRUE,
  featured_snippet BOOLEAN DEFAULT FALSE,
  local_pack_position INTEGER,
  search_url TEXT,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(location_id, keyword)
);

-- Create location_seo_audits table
CREATE TABLE IF NOT EXISTS location_seo_audits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location_id UUID REFERENCES client_locations(id) ON DELETE CASCADE,
  audit_type TEXT DEFAULT 'full' CHECK (audit_type IN ('full', 'quick', 'keyword', 'gbp')),
  overall_score INTEGER,
  seo_scores JSONB,
  keyword_stats JSONB,
  issues_found TEXT[],
  recommendations TEXT[],
  improvements_made TEXT[],
  audit_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_google_account_id ON clients(google_account_id);
CREATE INDEX IF NOT EXISTS idx_client_locations_client_id ON client_locations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_locations_google_place_id ON client_locations(google_place_id);
CREATE INDEX IF NOT EXISTS idx_reviews_location_id ON reviews(location_id);
CREATE INDEX IF NOT EXISTS idx_reviews_external_id ON reviews(external_review_id);
CREATE INDEX IF NOT EXISTS idx_google_business_posts_location_id ON google_business_posts(location_id);
CREATE INDEX IF NOT EXISTS idx_location_keywords_location_id ON location_keywords(location_id);

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_business_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_business_qna ENABLE ROW LEVEL SECURITY;
ALTER TABLE qna_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_seo_audits ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for clients table
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;

CREATE POLICY "Users can view their own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'superadmin'
  ));

CREATE POLICY "Users can insert their own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" ON clients
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'superadmin'
  ));

-- Add RLS policies for client_locations
DROP POLICY IF EXISTS "Users can view their client locations" ON client_locations;
DROP POLICY IF EXISTS "Users can manage their client locations" ON client_locations;

CREATE POLICY "Users can view their client locations" ON client_locations
  FOR SELECT USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid() OR auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'superadmin'
    )
  ));

CREATE POLICY "Users can manage their client locations" ON client_locations
  FOR ALL USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid() OR auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'superadmin'
    )
  ));

-- Add policies for other tables (similar pattern)
DROP POLICY IF EXISTS "Users can view their client reviews" ON reviews;
DROP POLICY IF EXISTS "Users can manage their client reviews" ON reviews;

CREATE POLICY "Users can view their client reviews" ON reviews
  FOR SELECT USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid() OR auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'superadmin'
    )
  ));

CREATE POLICY "Users can manage their client reviews" ON reviews
  FOR ALL USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid() OR auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'superadmin'
    )
  ));