-- Add two new clients from Comprehensive Business Profiles Report
-- Run this in your Supabase SQL Editor

-- First ensure required columns exist
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS unique_selling_proposition TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS service_tier VARCHAR(50) DEFAULT 'standard';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_since DATE DEFAULT CURRENT_DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS health_score INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS growth_stage VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS audit_frequency VARCHAR(20) DEFAULT 'monthly';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS reporting_preferences JSONB DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS communication_preferences JSONB DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS audit_categories TEXT[];
ALTER TABLE clients ADD COLUMN IF NOT EXISTS priority_areas TEXT[];
ALTER TABLE clients ADD COLUMN IF NOT EXISTS next_audit_due TIMESTAMP WITH TIME ZONE;

INSERT INTO clients (
    agency_id,
    business_name,
    phone,
    website,
    email,
    industry,
    business_type,
    location,
    address,
    target_audience,
    unique_selling_proposition,
    service_tier,
    client_since,
    billing_cycle,
    status,
    health_score,
    growth_stage,
    audit_frequency,
    reporting_preferences,
    communication_preferences,
    custom_fields,
    audit_categories,
    priority_areas,
    next_audit_due
) VALUES 
    -- Bright Facial Spa & Thai Massage (Las Vegas)
    (
        (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1),
        'Bright Facial Spa & Thai Massage',
        '(725) 696-4289',
        'https://www.brightspalv.com/',
        'BrightSpaLV@gmail.com',
        'Health & Wellness',
        'Spa & Wellness Center',
        'Las Vegas, NV',
        '6590 S Rainbow Blvd Suite 150, Las Vegas, NV 89118',
        'Las Vegas locals and tourists seeking luxury spa treatments',
        'Full-service luxury spa offering Thai massage, HydraFacial treatments, custom facials, microchanneling & microneedling with "Be Bright. Be Beautiful." philosophy.',
        'premium',
        CURRENT_DATE,
        'monthly',
        'active',
        92,
        'mature',
        'monthly',
        '{"email_reports": true, "dashboard_access": true, "frequency": "weekly"}',
        '{"preferred_method": "email", "best_time": "business_hours", "contact_email": "BrightSpaLV@gmail.com"}',
        '{"categories": "Spa, Thai Massage, Facial Treatments, HydraFacial, Microchanneling, Microneedling", "hours_of_operation": "Monday-Thursday: 10:00 AM - 9:00 PM", "rating": "4.9/5 stars (55+ reviews)", "platforms": "Instagram @brightfacialspalv, Facebook, TikTok, Yelp, ClassPass, Fresha, Groupon", "tagline": "Be Bright. Be Beautiful.", "report_imported": true}',
        '["website", "social_media", "reviews", "seo", "local_listings", "online_booking"]',
        '["health_wellness", "spa_massage", "luxury_services"]',
        CURRENT_DATE + INTERVAL '30 days'
    ),
    -- Chang Kao Thai Cuisine (Bradenton, FL)
    (
        (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1),
        'Chang Kao Thai Cuisine',
        '(941) 739-2217',
        'https://changkaothai.com/',
        'info@changkaothai.com',
        'Food & Beverage',
        'Thai Restaurant',
        'Bradenton, FL',
        '6233 14th St W, Bradenton, FL 34207',
        'Local Bradenton community, IMG Academy students and families, Thai cuisine enthusiasts',
        '#1 Thai Restaurant in Bradenton featuring authentic Bangkok-born Chef Meaw Oliver with decades of experience, traditional family recipes, and fresh daily preparation. Chang Kao means "white elephant" in Thai.',
        'premium',
        CURRENT_DATE,
        'monthly',
        'active',
        94,
        'mature',
        'monthly',
        '{"email_reports": true, "dashboard_access": true, "frequency": "weekly"}',
        '{"preferred_method": "email", "best_time": "business_hours", "contact_email": "info@changkaothai.com"}',
        '{"categories": "Thai Restaurant, Fine Dining, Authentic Thai Cuisine, Takeout, Delivery", "hours_of_operation": "Mon-Thu: 11AM-2:45PM, 4:30-9:15PM; Fri: 11AM-2:45PM, 4:30-9:45PM; Sat: 12PM-2:45PM, 4:30-9:45PM; Sun: Closed", "established": "May 2019", "chef": "Chef Meaw Oliver (Bangkok-born)", "rating": "4.5/5 stars (127+ reviews)", "platforms": "Instagram @changkaothaicuisine, Facebook, YouTube, UberEats, Grubhub, DoorDash", "recognition": "#1 Thai Restaurant in Bradenton", "report_imported": true}',
        '["website", "social_media", "reviews", "seo", "local_listings", "online_ordering"]',
        '["food_beverage", "thai_cuisine", "authentic_dining"]',
        CURRENT_DATE + INTERVAL '30 days'
    );

-- Verify the new clients were added
SELECT 
    business_name,
    location,
    industry,
    business_type,
    health_score,
    status
FROM clients 
WHERE custom_fields->>'report_imported' = 'true'
AND agency_id = (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1)
ORDER BY created_at DESC;

-- Show updated client count
SELECT 
    COUNT(*) as total_clients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_clients,
    COUNT(CASE WHEN custom_fields->>'report_imported' = 'true' THEN 1 END) as report_clients
FROM clients 
WHERE agency_id = (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1);