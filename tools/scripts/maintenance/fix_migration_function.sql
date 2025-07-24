-- Fix the migration function to work with existing client table structure
-- Run this to replace the previous migration function

-- First, let's see what columns actually exist in the clients table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

-- Updated migration function that handles missing fields gracefully
CREATE OR REPLACE FUNCTION migrate_clients_to_locations()
RETURNS VOID AS $$
DECLARE
    client_record RECORD;
    location_id UUID;
BEGIN
    FOR client_record IN 
        SELECT c.*, a.id as agency_id
        FROM clients c
        JOIN agencies a ON c.agency_id = a.id
        WHERE NOT EXISTS (
            SELECT 1 FROM client_locations cl WHERE cl.client_id = c.id
        )
    LOOP
        -- Create primary location for existing client with safe field access
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
            email,
            website,
            business_description,
            is_primary_location,
            is_active,
            display_order
        ) VALUES (
            client_record.id,
            client_record.agency_id,
            'Main Location',
            client_record.business_name,
            COALESCE(client_record.location, 'Address not provided'),
            COALESCE(client_record.location, 'City not provided'),
            'State not provided',
            '00000',
            COALESCE(client_record.phone, NULL),
            COALESCE(client_record.email, NULL),
            COALESCE(client_record.website, NULL),
            COALESCE(client_record.unique_selling_proposition, client_record.business_name || ' - Professional business services'),
            true, -- Primary location
            true, -- Active
            1 -- Display order
        ) RETURNING id INTO location_id;
        
        -- Update social media posts to link to this location
        UPDATE social_media_posts 
        SET location_id = location_id 
        WHERE client_id = client_record.id AND location_id IS NULL;
        
        -- Update reviews to link to this location
        UPDATE reviews 
        SET location_id = location_id 
        WHERE client_id = client_record.id AND location_id IS NULL;
        
        RAISE NOTICE 'Created primary location for client: %', client_record.business_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Safe migration function that only uses fields we know exist
CREATE OR REPLACE FUNCTION safe_migrate_clients_to_locations()
RETURNS VOID AS $$
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
        -- Create primary location for existing client using only known fields
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
        
        -- Update existing social media posts to link to this location
        UPDATE social_media_posts 
        SET location_id = new_location_id 
        WHERE client_id = client_record.id AND location_id IS NULL;
        
        -- Update existing reviews to link to this location  
        UPDATE reviews 
        SET location_id = new_location_id 
        WHERE client_id = client_record.id AND location_id IS NULL;
        
        RAISE NOTICE 'Created primary location for client: % (ID: %)', client_record.business_name, new_location_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the safe migration
SELECT safe_migrate_clients_to_locations();

-- Create some sample multi-location data for testing
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
    '123 Main St, Downtown',
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
JOIN agencies a ON c.agency_id = a.id
WHERE a.owner_id = auth.uid()
AND c.industry ILIKE '%food%'
LIMIT 1;

-- Add another location for restaurant clients
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
JOIN agencies a ON c.agency_id = a.id
WHERE a.owner_id = auth.uid()
AND c.industry ILIKE '%food%'
LIMIT 1;

-- Verify the migration worked
SELECT 
    c.business_name,
    cl.location_name,
    cl.is_primary_location,
    cl.address,
    cl.local_seo_score,
    cl.google_rating,
    (SELECT COUNT(*) FROM location_keywords lk WHERE lk.location_id = cl.id) as keyword_count
FROM clients c
JOIN client_locations cl ON c.id = cl.client_id
JOIN agencies a ON c.agency_id = a.id
WHERE a.owner_id = auth.uid()
ORDER BY c.business_name, cl.display_order;