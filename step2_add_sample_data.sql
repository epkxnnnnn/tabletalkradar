-- Step 2: Add sample data and functions
-- Run this AFTER step 1

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
        INSERT INTO location_keywords (location_id, client_id, agency_id, keyword, keyword_type, priority, current_rank, search_volume) VALUES
        (p_location_id, v_client_id, v_agency_id, p_business_name, 'branded', 'critical', 1, 1200),
        (p_location_id, v_client_id, v_agency_id, p_business_name || ' ' || p_city, 'local', 'high', 2, 890),
        (p_location_id, v_client_id, v_agency_id, 'restaurants near me', 'primary', 'high', 8, 15000),
        (p_location_id, v_client_id, v_agency_id, 'best restaurants ' || p_city, 'local', 'high', 5, 3200),
        (p_location_id, v_client_id, v_agency_id, 'food delivery ' || p_city, 'secondary', 'medium', 12, 2100),
        (p_location_id, v_client_id, v_agency_id, p_industry || ' ' || p_city, 'local', 'medium', 6, 1800),
        (p_location_id, v_client_id, v_agency_id, 'restaurant reviews ' || p_city, 'long_tail', 'low', 15, 560);
    ELSE
        -- Generic business keywords
        INSERT INTO location_keywords (location_id, client_id, agency_id, keyword, keyword_type, priority, current_rank, search_volume) VALUES
        (p_location_id, v_client_id, v_agency_id, p_business_name, 'branded', 'critical', 1, 800),
        (p_location_id, v_client_id, v_agency_id, p_business_name || ' ' || p_city, 'local', 'high', 3, 450),
        (p_location_id, v_client_id, v_agency_id, p_industry || ' near me', 'primary', 'high', 9, 5200),
        (p_location_id, v_client_id, v_agency_id, 'best ' || p_industry || ' ' || p_city, 'local', 'medium', 7, 1200);
    END IF;
    
    RAISE NOTICE 'Added sample keywords for location: % in %', p_business_name, p_city;
END;
$$ LANGUAGE plpgsql;

-- Create primary locations for existing clients
DO $$
DECLARE
    client_record RECORD;
    new_location_id UUID;
BEGIN
    FOR client_record IN 
        SELECT c.id, c.business_name, c.industry, c.location, c.status, c.agency_id
        FROM clients c
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
            business_description,
            google_rating,
            google_review_count,
            local_seo_score,
            citation_score,
            review_score,
            visibility_score,
            optimization_score,
            is_primary_location,
            is_active,
            display_order
        ) VALUES (
            client_record.id,
            client_record.agency_id,
            'Main Location',
            client_record.business_name,
            COALESCE(client_record.location, client_record.business_name || ' Location'),
            COALESCE(client_record.location, 'Location not specified'),
            'Not specified',
            '00000',
            client_record.business_name || ' - ' || COALESCE(client_record.industry, 'Professional services'),
            4.2 + (RANDOM() * 0.8), -- Random rating between 4.2-5.0
            FLOOR(50 + RANDOM() * 200)::INTEGER, -- Random review count 50-250
            70 + (RANDOM() * 25), -- Random SEO score 70-95
            65 + (RANDOM() * 30), -- Citation score 65-95
            75 + (RANDOM() * 20), -- Review score 75-95
            60 + (RANDOM() * 35), -- Visibility score 60-95
            70 + (RANDOM() * 25), -- Optimization score 70-95
            true, -- Primary location
            true, -- Active
            1 -- Display order
        ) RETURNING id INTO new_location_id;
        
        -- Add sample keywords for this location
        PERFORM add_sample_keywords(
            new_location_id, 
            client_record.business_name, 
            COALESCE(client_record.location, 'Local Area'),
            COALESCE(client_record.industry, 'Business')
        );
        
        RAISE NOTICE 'Created primary location for client: % (ID: %)', client_record.business_name, new_location_id;
    END LOOP;
END $$;

-- Add additional locations for restaurant clients (to show multi-location functionality)
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
    business_description,
    google_rating,
    google_review_count,
    local_seo_score,
    citation_score,
    review_score,
    visibility_score,
    optimization_score,
    is_primary_location,
    is_active,
    display_order
)
SELECT 
    c.id as client_id,
    c.agency_id,
    'Downtown Location',
    c.business_name || ' - Downtown',
    '123 Main St, Downtown District',
    'Downtown',
    'CA',
    '90210',
    '(555) 123-4567',
    c.business_name || ' downtown location serving the city center with excellent food and service.',
    4.5,
    127,
    85.2,
    78.5,
    92.1,
    81.3,
    89.7,
    false, -- Not primary
    true,
    2
FROM clients c
WHERE c.industry ILIKE '%food%'
AND EXISTS (SELECT 1 FROM agencies a WHERE a.id = c.agency_id AND a.owner_id = auth.uid())
LIMIT 1;

-- Add a third location
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
    business_description,
    google_rating,
    google_review_count,
    local_seo_score,
    citation_score,
    review_score,
    visibility_score,
    optimization_score,
    is_primary_location,
    is_active,
    display_order
)
SELECT 
    c.id as client_id,
    c.agency_id,
    'Airport Location',
    c.business_name || ' - Airport',
    '456 Airport Blvd, Terminal A',
    'Airport District',
    'CA',
    '90211',
    '(555) 123-4568',
    c.business_name || ' airport location providing quick service for travelers and airport staff.',
    4.2,
    89,
    79.8,
    82.1,
    75.6,
    88.2,
    77.4,
    false, -- Not primary
    true,
    3
FROM clients c
WHERE c.industry ILIKE '%food%'
AND EXISTS (SELECT 1 FROM agencies a WHERE a.id = c.agency_id AND a.owner_id = auth.uid())
LIMIT 1;

-- Add keywords for the new locations
DO $$
DECLARE
    location_record RECORD;
BEGIN
    FOR location_record IN 
        SELECT cl.id, cl.business_name, cl.city, c.industry
        FROM client_locations cl
        JOIN clients c ON cl.client_id = c.id
        WHERE cl.location_name IN ('Downtown Location', 'Airport Location')
        AND NOT EXISTS (SELECT 1 FROM location_keywords lk WHERE lk.location_id = cl.id)
    LOOP
        PERFORM add_sample_keywords(
            location_record.id,
            location_record.business_name,
            location_record.city,
            location_record.industry
        );
    END LOOP;
END $$;

-- Create some sample SEO audit history
INSERT INTO location_seo_audits (
    location_id,
    client_id,
    agency_id,
    audit_date,
    audit_type,
    local_seo_score,
    citation_score,
    review_score,
    visibility_score,
    optimization_score,
    google_rating,
    google_review_count,
    total_keywords_tracked,
    keywords_ranking_top_3,
    keywords_ranking_top_10,
    average_keyword_rank,
    issues_found,
    recommendations,
    created_by
)
SELECT 
    cl.id as location_id,
    cl.client_id,
    cl.agency_id,
    CURRENT_DATE - INTERVAL '7 days' as audit_date,
    'weekly' as audit_type,
    cl.local_seo_score - 5, -- Previous week was slightly lower
    cl.citation_score - 3,
    cl.review_score - 2,
    cl.visibility_score - 4,
    cl.optimization_score - 1,
    cl.google_rating,
    cl.google_review_count - 5, -- Had fewer reviews last week
    (SELECT COUNT(*) FROM location_keywords lk WHERE lk.location_id = cl.id),
    (SELECT COUNT(*) FROM location_keywords lk WHERE lk.location_id = cl.id AND lk.current_rank <= 3),
    (SELECT COUNT(*) FROM location_keywords lk WHERE lk.location_id = cl.id AND lk.current_rank <= 10),
    (SELECT AVG(lk.current_rank) FROM location_keywords lk WHERE lk.location_id = cl.id AND lk.current_rank IS NOT NULL),
    '["Missing business hours", "Incomplete photo gallery"]'::jsonb,
    '["Add complete business hours", "Upload more high-quality photos", "Respond to recent reviews"]'::jsonb,
    (SELECT owner_id FROM agencies WHERE id = cl.agency_id)
FROM client_locations cl
WHERE cl.is_active = true;

-- Verify the setup
SELECT 
    c.business_name as client_name,
    cl.location_name,
    cl.city,
    cl.is_primary_location,
    cl.local_seo_score,
    cl.google_rating,
    (SELECT COUNT(*) FROM location_keywords lk WHERE lk.location_id = cl.id) as keyword_count,
    (SELECT COUNT(*) FROM location_seo_audits sa WHERE sa.location_id = cl.id) as audit_count
FROM clients c
JOIN client_locations cl ON c.id = cl.client_id
JOIN agencies a ON c.agency_id = a.id
WHERE a.owner_id = auth.uid()
ORDER BY c.business_name, cl.display_order;