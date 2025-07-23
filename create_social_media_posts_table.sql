-- Create social media posts table for content calendar management
-- Run this in your Supabase SQL Editor

-- Create social media posts table
CREATE TABLE IF NOT EXISTS social_media_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Post content
    content TEXT NOT NULL,
    image_url VARCHAR(500),
    video_url VARCHAR(500),
    link_url VARCHAR(500),
    hashtags TEXT[], -- Array of hashtags
    
    -- Scheduling information
    platforms VARCHAR(50)[] NOT NULL, -- Array: facebook, instagram, twitter, linkedin, tiktok
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    publish_immediately BOOLEAN DEFAULT FALSE,
    
    -- Post status and metadata
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'cancelled')),
    post_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video', 'carousel', 'story')),
    
    -- Campaign and categorization
    campaign_name VARCHAR(200),
    category VARCHAR(100), -- promotional, educational, entertainment, behind_scenes, etc.
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- AI and automation
    ai_generated BOOLEAN DEFAULT FALSE,
    auto_hashtags BOOLEAN DEFAULT FALSE,
    auto_schedule BOOLEAN DEFAULT FALSE,
    
    -- Publishing results
    published_at TIMESTAMP WITH TIME ZONE,
    platform_post_ids JSONB, -- Store platform-specific post IDs
    engagement_metrics JSONB, -- Store likes, shares, comments, etc.
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_posts_agency_id ON social_media_posts(agency_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_client_id ON social_media_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled_date ON social_media_posts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_media_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_platforms ON social_media_posts USING gin(platforms);
CREATE INDEX IF NOT EXISTS idx_social_posts_campaign ON social_media_posts(campaign_name);
CREATE INDEX IF NOT EXISTS idx_social_posts_category ON social_media_posts(category);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_social_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_social_posts_updated_at ON social_media_posts;
CREATE TRIGGER trigger_update_social_posts_updated_at
    BEFORE UPDATE ON social_media_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_social_posts_updated_at();

-- Add helpful comments
COMMENT ON TABLE social_media_posts IS 'Social media content calendar and scheduling system';
COMMENT ON COLUMN social_media_posts.platforms IS 'Array of social media platforms to post to';
COMMENT ON COLUMN social_media_posts.status IS 'Post status: draft, scheduled, published, failed, cancelled';
COMMENT ON COLUMN social_media_posts.post_type IS 'Type of post: text, image, video, carousel, story';
COMMENT ON COLUMN social_media_posts.platform_post_ids IS 'JSON object storing platform-specific post IDs';
COMMENT ON COLUMN social_media_posts.engagement_metrics IS 'JSON object storing engagement data per platform';

-- Create content templates table for reusable content
CREATE TABLE IF NOT EXISTS social_media_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    
    name VARCHAR(200) NOT NULL,
    description TEXT,
    content_template TEXT NOT NULL,
    default_hashtags TEXT[],
    default_platforms VARCHAR(50)[],
    category VARCHAR(100),
    
    -- Template metadata
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_social_templates_agency_id ON social_media_templates(agency_id);
CREATE INDEX IF NOT EXISTS idx_social_templates_category ON social_media_templates(category);

-- Insert some sample data for testing
INSERT INTO social_media_posts (
    agency_id,
    client_id,
    content,
    platforms,
    scheduled_date,
    status,
    post_type,
    category,
    hashtags,
    created_by
) 
SELECT 
    a.id as agency_id,
    c.id as client_id,
    'Excited to share our delicious new menu items! Come try our signature dishes and experience the difference. 🍽️✨' as content,
    ARRAY['facebook', 'instagram'] as platforms,
    NOW() + INTERVAL '2 days' as scheduled_date,
    'scheduled' as status,
    'text' as post_type,
    'promotional' as category,
    ARRAY['#foodie', '#restaurant', '#delicious', '#newmenu'] as hashtags,
    a.owner_id as created_by
FROM agencies a
CROSS JOIN clients c
WHERE a.owner_id = auth.uid()
AND c.agency_id = a.id
AND c.industry ILIKE '%food%'
LIMIT 1;

INSERT INTO social_media_posts (
    agency_id,
    client_id,
    content,
    platforms,
    scheduled_date,
    status,
    post_type,
    category,
    hashtags,
    created_by
) 
SELECT 
    a.id as agency_id,
    c.id as client_id,
    'Behind the scenes: Our talented team preparing fresh ingredients every morning. Quality is our priority! 👨‍🍳🥕' as content,
    ARRAY['instagram', 'facebook', 'twitter'] as platforms,
    NOW() + INTERVAL '3 days' as scheduled_date,
    'draft' as status,
    'image' as post_type,
    'behind_scenes' as category,
    ARRAY['#behindthescenes', '#fresh', '#quality', '#team'] as hashtags,
    a.owner_id as created_by
FROM agencies a
CROSS JOIN clients c
WHERE a.owner_id = auth.uid()
AND c.agency_id = a.id
LIMIT 1;

-- Insert sample templates
INSERT INTO social_media_templates (
    agency_id,
    name,
    description,
    content_template,
    default_hashtags,
    default_platforms,
    category
)
SELECT 
    a.id as agency_id,
    'Daily Special Promotion' as name,
    'Template for promoting daily specials' as description,
    'Today''s special: [DISH_NAME] - [DESCRIPTION]. Available all day while supplies last! 🍽️' as content_template,
    ARRAY['#dailyspecial', '#limited', '#fresh'] as default_hashtags,
    ARRAY['facebook', 'instagram'] as default_platforms,
    'promotional' as category
FROM agencies a
WHERE a.owner_id = auth.uid()
LIMIT 1;

INSERT INTO social_media_templates (
    agency_id,
    name,
    description,
    content_template,
    default_hashtags,
    default_platforms,
    category
)
SELECT 
    a.id as agency_id,
    'Customer Appreciation' as name,
    'Template for thanking customers' as description,
    'Thank you to all our amazing customers! Your support means the world to us. ❤️ [CUSTOM_MESSAGE]' as content_template,
    ARRAY['#thankyou', '#customers', '#grateful'] as default_hashtags,
    ARRAY['facebook', 'instagram', 'twitter'] as default_platforms,
    'engagement' as category
FROM agencies a
WHERE a.owner_id = auth.uid()
LIMIT 1;

-- Verify the setup
SELECT 
    COUNT(*) as total_posts,
    COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_posts,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_posts
FROM social_media_posts 
WHERE agency_id = (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1);

-- Show sample posts
SELECT 
    c.business_name,
    smp.content,
    smp.platforms,
    smp.scheduled_date,
    smp.status,
    smp.category
FROM social_media_posts smp
JOIN clients c ON smp.client_id = c.id
WHERE smp.agency_id = (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1)
ORDER BY smp.scheduled_date ASC;