-- Check your current data structure
-- Run this to see what's in your database

-- Check if client_locations table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'client_locations'
ORDER BY ordinal_position;

-- Check existing clients and their data
SELECT 
    c.id,
    c.business_name,
    c.agency_id,
    c.location,
    c.industry,
    c.status,
    CASE 
        WHEN c.agency_id IS NULL THEN 'MISSING AGENCY ID'
        ELSE 'OK'
    END as agency_status
FROM clients c
ORDER BY c.business_name;

-- Check if any locations already exist
SELECT COUNT(*) as existing_locations FROM client_locations;

-- Show agency information
SELECT 
    a.id,
    a.name,
    a.owner_id,
    (SELECT COUNT(*) FROM clients c WHERE c.agency_id = a.id) as client_count
FROM agencies a
WHERE a.owner_id = auth.uid();