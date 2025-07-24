-- Create reviews table for review management system
-- Run this in your Supabase SQL Editor

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Review source information
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('google', 'yelp')),
    reviewer_name VARCHAR(200) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    review_date DATE NOT NULL,
    review_url VARCHAR(500),
    
    -- Response management
    response_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (response_status IN ('pending', 'ai_generated', 'responded', 'ignored')),
    ai_response TEXT,
    manual_response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Unique constraint to prevent duplicate reviews
    UNIQUE(client_id, platform, reviewer_name, review_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_agency_id ON reviews(agency_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_platform ON reviews(platform);
CREATE INDEX IF NOT EXISTS idx_reviews_response_status ON reviews(response_status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_review_date ON reviews(review_date);
CREATE INDEX IF NOT EXISTS idx_reviews_scraped_at ON reviews(scraped_at);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_reviews_updated_at ON reviews;
CREATE TRIGGER trigger_update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- Add helpful comments
COMMENT ON TABLE reviews IS 'Customer reviews from Google and Yelp with AI-assisted response management';
COMMENT ON COLUMN reviews.platform IS 'Review platform: google or yelp';
COMMENT ON COLUMN reviews.response_status IS 'Response status: pending, ai_generated, responded, or ignored';
COMMENT ON COLUMN reviews.ai_response IS 'AI-generated response suggestion';
COMMENT ON COLUMN reviews.manual_response IS 'Final response submitted by user';
COMMENT ON COLUMN reviews.scraped_at IS 'When the review was scraped from the platform';

-- Insert some sample data for testing
INSERT INTO reviews (
    agency_id,
    client_id,
    platform,
    reviewer_name,
    rating,
    review_text,
    review_date,
    response_status
) 
SELECT 
    a.id as agency_id,
    c.id as client_id,
    'google' as platform,
    'John Smith' as reviewer_name,
    5 as rating,
    'Excellent service and amazing food! The staff was very friendly and the atmosphere was perfect. Highly recommend!' as review_text,
    CURRENT_DATE - INTERVAL '2 days' as review_date,
    'pending' as response_status
FROM agencies a
CROSS JOIN clients c
WHERE a.owner_id = auth.uid()
AND c.agency_id = a.id
LIMIT 1;

INSERT INTO reviews (
    agency_id,
    client_id,
    platform,
    reviewer_name,
    rating,
    review_text,
    review_date,
    response_status
) 
SELECT 
    a.id as agency_id,
    c.id as client_id,
    'yelp' as platform,
    'Sarah Johnson' as reviewer_name,
    4 as rating,
    'Good food and quick service. The place was clean and the staff was helpful. Will come back again.' as review_text,
    CURRENT_DATE - INTERVAL '1 day' as review_date,
    'pending' as response_status
FROM agencies a
CROSS JOIN clients c
WHERE a.owner_id = auth.uid()
AND c.agency_id = a.id
LIMIT 1;

INSERT INTO reviews (
    agency_id,
    client_id,
    platform,
    reviewer_name,
    rating,
    review_text,
    review_date,
    response_status
) 
SELECT 
    a.id as agency_id,
    c.id as client_id,
    'google' as platform,
    'Mike Chen' as reviewer_name,
    2 as rating,
    'Food was cold when it arrived and the service was slow. Not what I expected based on other reviews.' as review_text,
    CURRENT_DATE - INTERVAL '3 days' as review_date,
    'pending' as response_status
FROM agencies a
CROSS JOIN clients c
WHERE a.owner_id = auth.uid()
AND c.agency_id = a.id
LIMIT 1;

-- Verify the setup
SELECT 
    COUNT(*) as total_reviews,
    COUNT(CASE WHEN response_status = 'pending' THEN 1 END) as pending_responses,
    AVG(rating) as average_rating
FROM reviews 
WHERE agency_id = (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1);

-- Show sample reviews
SELECT 
    c.business_name,
    r.platform,
    r.reviewer_name,
    r.rating,
    r.review_text,
    r.response_status,
    r.review_date
FROM reviews r
JOIN clients c ON r.client_id = c.id
WHERE r.agency_id = (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1)
ORDER BY r.review_date DESC;