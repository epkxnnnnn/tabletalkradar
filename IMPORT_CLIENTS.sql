-- IMPORT CLIENTS FROM CSV TO YOUR AGENCY
-- Run this in Supabase SQL Editor

-- First, let's get your agency ID
SELECT id as agency_id, name as agency_name FROM agencies WHERE owner_id = auth.uid();

-- Insert clients based on your CSV data
-- Replace the agency_id below with your actual agency ID from the query above

INSERT INTO clients (
    agency_id,
    business_name,
    phone,
    website,
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
    -- LullaBar Thai Fusion
    (
        (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1),
        'LullaBar Thai Fusion',
        '(702) 760-7888',
        'https://lullabarlv.com/',
        'Food & Beverage',
        'Thai Fusion Restaurant',
        'Las Vegas, NV',
        '3990 Schiff Dr, Las Vegas, NV 89103',
        'Local customers and tourists',
        'Las Vegas''s premier Thai-Japanese fusion restaurant offering authentic Thai flavors with traditional Japanese izakaya culture in the heart of Chinatown.',
        'standard',
        CURRENT_DATE,
        'monthly',
        'active',
        90,
        'mature',
        'monthly',
        '{"email_reports": true, "dashboard_access": true, "frequency": "weekly"}',
        '{"preferred_method": "email", "best_time": "business_hours"}',
        '{"categories": "Thai Fusion & Izakaya, Late-Night Dining, Cocktail Bar", "hours_of_operation": "Daily 6 PM - 4:00 AM", "csv_imported": true}',
        '["website", "social_media", "reviews", "seo", "local_listings"]',
        '["food_beverage", "thai_fusion"]',
        CURRENT_DATE + INTERVAL '30 days'
    ),
    -- Alisa Sushi & Thai Bistro
    (
        (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1),
        'Alisa Sushi & Thai Bistro',
        '(808)-359-7896',
        'https://alisasushithai.com/',
        'Food & Beverage',
        'Thai & Sushi Restaurant',
        'Lihue, HI',
        '3501 Rice St Ste 2012 2nd Floor, Lihue, HI 96766',
        'Local customers and tourists',
        'Authentic Thai food and fresh sushi restaurant located on the 2nd floor of Harbor Mall in Lihue, Kauai.',
        'standard',
        CURRENT_DATE,
        'monthly',
        'active',
        88,
        'mature',
        'monthly',
        '{"email_reports": true, "dashboard_access": true, "frequency": "weekly"}',
        '{"preferred_method": "email", "best_time": "business_hours"}',
        '{"categories": "Thai Restaurant, Sushi Restaurant, Asian Fusion, Catering", "hours_of_operation": "Monday-Sunday: 11:00AM-2:30PM, 3:30PM-9:30PM", "csv_imported": true}',
        '["website", "social_media", "reviews", "seo", "local_listings"]',
        '["food_beverage", "thai_sushi"]',
        CURRENT_DATE + INTERVAL '30 days'
    ),
    -- Koloa Thai Bistro
    (
        (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1),
        'Koloa Thai Bistro',
        '(808) 359-7878',
        'https://koloathai.com/',
        'Food & Beverage',
        'Thai Restaurant',
        'Koloa, HI',
        '5460 Koloa Rd, Koloa, HI 96756',
        'Local customers and tourists',
        'Thai-Sushi-Hibachi Grill fusion restaurant offering fresh vegetables from local farms and healthy dishes in Old Koloa Town area.',
        'standard',
        CURRENT_DATE,
        'monthly',
        'active',
        87,
        'mature',
        'monthly',
        '{"email_reports": true, "dashboard_access": true, "frequency": "weekly"}',
        '{"preferred_method": "email", "best_time": "business_hours"}',
        '{"categories": "Thai Restaurant, Sushi Restaurant, Hibachi Grill, Asian Fusion", "hours_of_operation": "Mon,Wed,Fri,Sat,Sun: 11:00AM-2:30PM / 3:30PM-9:00PM", "csv_imported": true}',
        '["website", "social_media", "reviews", "seo", "local_listings"]',
        '["food_beverage", "thai_hibachi"]',
        CURRENT_DATE + INTERVAL '30 days'
    ),
    -- Daikon Vegan Sushi
    (
        (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1),
        'Daikon Vegan Sushi',
        '(702) 749-3283',
        'https://daikonvegansushi.com/',
        'Food & Beverage',
        'Vegan Restaurant',
        'Las Vegas, NV',
        '7210 W Lake Mead Blvd #1, Las Vegas, NV 89128',
        'Vegan food enthusiasts and health-conscious diners',
        '100% vegan sushi restaurant offering fast, fresh & handmade meals with no harm to animals.',
        'premium',
        CURRENT_DATE,
        'monthly',
        'active',
        92,
        'growth',
        'monthly',
        '{"email_reports": true, "dashboard_access": true, "frequency": "weekly"}',
        '{"preferred_method": "email", "best_time": "business_hours"}',
        '{"categories": "Vegan Restaurant, Sushi Restaurant, Plant-Based Dining, Ramen", "hours_of_operation": "Monday - Saturday: 11 am - 10 pm; Sunday: 3 pm - 10 pm", "csv_imported": true}',
        '["website", "social_media", "reviews", "seo", "local_listings"]',
        '["food_beverage", "vegan_sushi"]',
        CURRENT_DATE + INTERVAL '30 days'
    ),
    -- Basil Vegan Thai & Sushi
    (
        (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1),
        'Basil Vegan Thai & Sushi',
        '(702) 357-3837',
        'https://basilveganthai.com/',
        'Food & Beverage',
        'Vegan Restaurant',
        'Las Vegas, NV',
        '500 E Windmill Ln #145, Las Vegas, NV 89123',
        'Vegan food lovers and health-conscious diners',
        'The best vegan Thai and sushi restaurant in Las Vegas, specializing in plant-based Thai dishes and innovative vegan sushi.',
        'premium',
        CURRENT_DATE,
        'monthly',
        'active',
        91,
        'growth',
        'monthly',
        '{"email_reports": true, "dashboard_access": true, "frequency": "weekly"}',
        '{"preferred_method": "email", "best_time": "business_hours"}',
        '{"categories": "Vegan Restaurant, Thai Restaurant, Sushi Restaurant, Plant-Based Dining", "hours_of_operation": "Mon-Sat: 12:00 PM – 10:00 PM; Sun: 3:00 PM – 10:00 PM", "csv_imported": true}',
        '["website", "social_media", "reviews", "seo", "local_listings"]',
        '["food_beverage", "vegan_thai"]',
        CURRENT_DATE + INTERVAL '30 days'
    ),
    -- Bright Facial Spa & Thai Massage
    (
        (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1),
        'Bright Facial Spa & Thai Massage',
        '(725) 696-4289',
        'https://www.brightspalv.com/',
        'Health & Wellness',
        'Spa & Wellness Center',
        'Las Vegas, NV',
        '6590 S Rainbow Blvd Suite 150, Las Vegas, NV 89118',
        'Wellness enthusiasts and spa clients',
        'Full-service luxury spa offering Thai massage, HydraFacial treatments, custom facials, microchanneling & microneedling.',
        'premium',
        CURRENT_DATE,
        'monthly',
        'active',
        89,
        'mature',
        'monthly',
        '{"email_reports": true, "dashboard_access": true, "frequency": "weekly"}',
        '{"preferred_method": "email", "best_time": "business_hours"}',
        '{"categories": "Spa, Thai Massage, Facial Treatments, Skin Care, Massage Therapy", "hours_of_operation": "Monday-Sunday: 10:00 AM - 9:00 PM", "csv_imported": true}',
        '["website", "social_media", "reviews", "seo", "local_listings"]',
        '["health_wellness", "spa_massage"]',
        CURRENT_DATE + INTERVAL '30 days'
    ),
    -- Chang Kao Thai Cuisine (inactive due to website issues)
    (
        (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1),
        'Chang Kao Thai Cuisine',
        '(702) 823-2838',
        'https://changkaothaicuisine.com/',
        'Food & Beverage',
        'Thai Restaurant',
        'Las Vegas, NV',
        '1221 E Sunset Rd UNIT B, Las Vegas, NV 89119',
        'Local Thai food enthusiasts',
        'Thai restaurant offering authentic Thai cuisine including pad Thai, tom yum, and traditional dishes.',
        'basic',
        CURRENT_DATE,
        'monthly',
        'inactive',
        45,
        'decline',
        'monthly',
        '{"email_reports": true, "dashboard_access": true, "frequency": "monthly"}',
        '{"preferred_method": "phone", "best_time": "business_hours"}',
        '{"categories": "Thai Restaurant, Asian Cuisine", "hours_of_operation": "Unable to determine", "csv_imported": true, "issues": "Website inaccessible"}',
        '["website", "social_media", "reviews", "seo", "local_listings"]',
        '["food_beverage", "thai_cuisine"]',
        CURRENT_DATE + INTERVAL '30 days'
    );

-- Verify import
SELECT 
    COUNT(*) as total_imported_clients,
    string_agg(business_name, ', ') as client_names
FROM clients 
WHERE custom_fields->>'csv_imported' = 'true'
AND agency_id = (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1);

-- Show client summary by status
SELECT 
    status,
    COUNT(*) as count,
    ROUND(AVG(health_score)) as avg_health_score
FROM clients 
WHERE agency_id = (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1)
GROUP BY status
ORDER BY count DESC;