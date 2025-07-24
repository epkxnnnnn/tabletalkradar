-- Google Business Profile Features Database Schema
-- Run this to add support for posting, review replies, and Q&A management

-- Table for Google My Business Posts
CREATE TABLE IF NOT EXISTS google_business_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id UUID REFERENCES client_locations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    google_post_id TEXT NOT NULL, -- Google's post identifier
    post_type TEXT NOT NULL CHECK (post_type IN ('EVENT', 'OFFER', 'CALL_TO_ACTION')),
    summary TEXT NOT NULL,
    post_data JSONB NOT NULL, -- Full post payload sent to Google
    google_response JSONB, -- Response from Google API
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'failed', 'deleted')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Review Reply Activities
CREATE TABLE IF NOT EXISTS review_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    location_id UUID REFERENCES client_locations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('reply_posted', 'reply_updated', 'reply_deleted')),
    activity_data JSONB, -- Reply text, Google response, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Table for Google Business Q&A Management
CREATE TABLE IF NOT EXISTS google_business_qna (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id UUID REFERENCES client_locations(id) ON DELETE CASCADE,
    google_question_id TEXT UNIQUE NOT NULL, -- Google's question identifier
    question_text TEXT NOT NULL,
    author JSONB, -- Question author info from Google
    total_answer_count INTEGER DEFAULT 0,
    question_data JSONB, -- Full question data from Google including answers
    is_answered BOOLEAN DEFAULT FALSE,
    our_answer_id TEXT, -- ID of our answer if we replied
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Q&A Activity Logging
CREATE TABLE IF NOT EXISTS qna_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id UUID REFERENCES client_locations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    google_question_id TEXT NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('answer_posted', 'answer_updated', 'answer_deleted', 'question_created')),
    activity_data JSONB, -- Answer text, Google response, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_google_business_posts_location_id ON google_business_posts(location_id);
CREATE INDEX IF NOT EXISTS idx_google_business_posts_created_at ON google_business_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_activities_review_id ON review_activities(review_id);
CREATE INDEX IF NOT EXISTS idx_review_activities_created_at ON review_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_google_business_qna_location_id ON google_business_qna(location_id);
CREATE INDEX IF NOT EXISTS idx_qna_activities_location_id ON qna_activities(location_id);

-- Add missing columns to client_locations if they don't exist
ALTER TABLE client_locations ADD COLUMN IF NOT EXISTS google_account_id TEXT;
ALTER TABLE client_locations ADD COLUMN IF NOT EXISTS google_business_profile_url TEXT;

-- Add RLS (Row Level Security) policies
ALTER TABLE google_business_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_business_qna ENABLE ROW LEVEL SECURITY;
ALTER TABLE qna_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for google_business_posts
CREATE POLICY "Users can view posts for their agency locations" ON google_business_posts
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can insert posts for their agency locations" ON google_business_posts
    FOR INSERT WITH CHECK (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- RLS Policies for review_activities
CREATE POLICY "Users can view review activities for their agency" ON review_activities
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can insert review activities for their agency" ON review_activities
    FOR INSERT WITH CHECK (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- RLS Policies for google_business_qna
CREATE POLICY "Users can view Q&A for their agency locations" ON google_business_qna
    FOR SELECT USING (
        location_id IN (
            SELECT cl.id FROM client_locations cl
            JOIN agency_memberships am ON cl.agency_id = am.agency_id
            WHERE am.user_id = auth.uid() AND am.status = 'active'
        )
    );

CREATE POLICY "Users can manage Q&A for their agency locations" ON google_business_qna
    FOR INSERT WITH CHECK (
        location_id IN (
            SELECT cl.id FROM client_locations cl
            JOIN agency_memberships am ON cl.agency_id = am.agency_id
            WHERE am.user_id = auth.uid() AND am.status = 'active'
        )
    );

-- RLS Policies for qna_activities
CREATE POLICY "Users can view Q&A activities for their agency" ON qna_activities
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can insert Q&A activities for their agency" ON qna_activities
    FOR INSERT WITH CHECK (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_google_business_posts_updated_at 
    BEFORE UPDATE ON google_business_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_business_qna_updated_at 
    BEFORE UPDATE ON google_business_qna 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some sample post templates for testing
INSERT INTO google_business_posts (
    location_id, 
    client_id, 
    agency_id, 
    google_post_id, 
    post_type, 
    summary, 
    post_data, 
    status
) 
SELECT 
    cl.id,
    cl.client_id,
    cl.agency_id,
    'sample_post_' || cl.id,
    'CALL_TO_ACTION',
    'Visit our location for excellent service and great deals!',
    jsonb_build_object(
        'languageCode', 'en',
        'summary', 'Visit our location for excellent service and great deals!',
        'callToAction', jsonb_build_object(
            'actionType', 'LEARN_MORE',
            'url', COALESCE(cl.website, 'https://example.com')
        )
    ),
    'draft'
FROM client_locations cl
WHERE cl.is_active = true
ON CONFLICT DO NOTHING;

-- Verify the setup
SELECT 'Google Business Features tables created successfully!' as status;

-- Show table counts
SELECT 
    'google_business_posts' as table_name, 
    COUNT(*) as record_count 
FROM google_business_posts
UNION ALL
SELECT 
    'review_activities', 
    COUNT(*) 
FROM review_activities
UNION ALL
SELECT 
    'google_business_qna', 
    COUNT(*) 
FROM google_business_qna
UNION ALL
SELECT 
    'qna_activities', 
    COUNT(*) 
FROM qna_activities;