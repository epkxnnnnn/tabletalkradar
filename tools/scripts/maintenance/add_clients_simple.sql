-- Add two new clients from Comprehensive Business Profiles Report
-- This version uses your existing table structure

INSERT INTO clients (
    agency_id,
    business_name,
    phone,
    website,
    category,
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
        'health_wellness',
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
        '{"email": "BrightSpaLV@gmail.com", "categories": "Spa, Thai Massage, Facial Treatments, HydraFacial", "hours": "Monday-Thursday: 10:00 AM - 9:00 PM", "rating": "4.9/5 stars (55+ reviews)", "social_media": "Instagram @brightfacialspalv, Facebook, TikTok", "tagline": "Be Bright. Be Beautiful.", "report_imported": true}',
        ARRAY['website', 'social_media', 'reviews', 'seo', 'local_listings', 'online_booking'],
        ARRAY['health_wellness', 'spa_massage', 'luxury_services'],
        CURRENT_DATE + INTERVAL '30 days'
    ),
    -- Chang Kao Thai Cuisine (Bradenton, FL)
    (
        (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1),
        'Chang Kao Thai Cuisine',
        '(941) 739-2217',
        'https://changkaothai.com/',
        'food_beverage',
        'Food & Beverage',
        'Thai Restaurant',
        'Bradenton, FL',
        '6233 14th St W, Bradenton, FL 34207',
        'Local Bradenton community, IMG Academy students and families, Thai cuisine enthusiasts',
        '#1 Thai Restaurant in Bradenton featuring authentic Bangkok-born Chef Meaw Oliver with decades of experience, traditional family recipes, and fresh daily preparation.',
        'premium',
        CURRENT_DATE,
        'monthly',
        'active',
        94,
        'mature',
        'monthly',
        '{"email_reports": true, "dashboard_access": true, "frequency": "weekly"}',
        '{"preferred_method": "email", "best_time": "business_hours", "contact_email": "info@changkaothai.com"}',
        '{"email": "info@changkaothai.com", "categories": "Thai Restaurant, Fine Dining, Authentic Thai Cuisine", "hours": "Mon-Thu: 11AM-2:45PM, 4:30-9:15PM; Fri: 11AM-2:45PM, 4:30-9:45PM; Sat: 12PM-2:45PM, 4:30-9:45PM; Sun: Closed", "established": "May 2019", "chef": "Chef Meaw Oliver (Bangkok-born)", "rating": "4.5/5 stars (127+ reviews)", "social_media": "Instagram @changkaothaicuisine, Facebook, YouTube", "recognition": "#1 Thai Restaurant in Bradenton", "report_imported": true}',
        ARRAY['website', 'social_media', 'reviews', 'seo', 'local_listings', 'online_ordering'],
        ARRAY['food_beverage', 'thai_cuisine', 'authentic_dining'],
        CURRENT_DATE + INTERVAL '30 days'
    );

-- Verify the new clients were added
SELECT 
    business_name,
    location,
    industry,
    business_type,
    health_score,
    status,
    custom_fields->>'email' as email
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