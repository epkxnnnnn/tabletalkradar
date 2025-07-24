-- Simple migration to add locations for existing clients
-- This script checks for and handles NULL values properly

-- First, let's check what data we have
SELECT 
    c.id,
    c.business_name,
    c.agency_id,
    c.location,
    c.industry,
    a.name as agency_name
FROM clients c
LEFT JOIN agencies a ON c.agency_id = a.id
WHERE c.agency_id IS NOT NULL
ORDER BY c.business_name;

-- Create the add keywords function if it doesn't exist
CREATE OR REPLACE FUNCTION add_sample_keywords(p_location_id UUID, p_business_name TEXT, p_city TEXT, p_industry TEXT)
RETURNS VOID AS $$
DECLARE
    v_client_id UUID;
    v_agency_id UUID;
BEGIN
    -- Get client and agency IDs
    SELECT client_id, agency_id INTO v_client_id, v_agency_id 
    FROM client_locations WHERE id = p_location_id;
    
    -- Only proceed if we have valid IDs
    IF v_client_id IS NOT NULL AND v_agency_id IS NOT NULL THEN
        -- Add basic keywords
        INSERT INTO location_keywords (location_id, client_id, agency_id, keyword, keyword_type, priority) 
        VALUES
        (p_location_id, v_client_id, v_agency_id, p_business_name, 'branded', 'critical'),
        (p_location_id, v_client_id, v_agency_id, p_business_name || ' ' || p_city, 'local', 'high')
        ON CONFLICT (location_id, keyword) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Simple migration that only processes clients with valid agency_id
DO $$
DECLARE
    client_record RECORD;
    new_location_id UUID;
BEGIN
    FOR client_record IN 
        SELECT 
            c.id,
            c.business_name,
            c.agency_id,
            c.location,
            c.industry
        FROM clients c
        WHERE c.agency_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM client_locations cl WHERE cl.client_id = c.id
        )
    LOOP
        -- Create primary location with safe defaults
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
            is_primary_location,
            is_active,
            display_order
        ) VALUES (
            client_record.id,
            client_record.agency_id,
            'Main Location',
            client_record.business_name,
            COALESCE(client_record.location, client_record.business_name || ' Location'),
            COALESCE(NULLIF(TRIM(client_record.location), ''), 'City not specified'),
            'State',
            '00000',
            client_record.business_name || ' - ' || COALESCE(client_record.industry, 'Business'),
            4.5,
            100,
            85.0,
            true,
            true,
            1
        ) RETURNING id INTO new_location_id;
        
        RAISE NOTICE 'Created location for: % (Location ID: %)', client_record.business_name, new_location_id;
        
        -- Add basic keywords
        PERFORM add_sample_keywords(
            new_location_id,
            client_record.business_name,
            COALESCE(client_record.location, 'Local'),
            COALESCE(client_record.industry, 'Business')
        );
    END LOOP;
END $$;

-- Verify what we created
SELECT 
    c.business_name,
    cl.location_name,
    cl.address,
    cl.city,
    cl.google_rating,
    cl.local_seo_score,
    (SELECT COUNT(*) FROM location_keywords lk WHERE lk.location_id = cl.id) as keywords
FROM client_locations cl
JOIN clients c ON cl.client_id = c.id
ORDER BY c.business_name;