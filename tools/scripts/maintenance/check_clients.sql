-- Check current client data and structure
SELECT 
    COUNT(*) as total_clients,
    COUNT(CASE WHEN agency_id IS NOT NULL THEN 1 END) as clients_with_agency,
    COUNT(CASE WHEN industry IS NOT NULL THEN 1 END) as clients_with_industry,
    COUNT(CASE WHEN business_type IS NOT NULL THEN 1 END) as clients_with_business_type,
    COUNT(CASE WHEN location IS NOT NULL THEN 1 END) as clients_with_location
FROM clients;

-- Check if agencies table exists and has data
SELECT 
    COUNT(*) as total_agencies,
    string_agg(name, ', ') as agency_names
FROM agencies;

-- Show sample client data to understand structure
SELECT 
    business_name,
    industry,
    business_type,
    location,
    status,
    agency_id,
    CASE WHEN agency_id IS NOT NULL THEN 'has agency' ELSE 'no agency' END as agency_status
FROM clients 
LIMIT 5;

-- Check for any connection issues
SELECT 
    c.business_name,
    c.agency_id,
    a.name as agency_name,
    c.industry,
    c.business_type,
    c.location
FROM clients c
LEFT JOIN agencies a ON c.agency_id = a.id
WHERE c.agency_id IS NULL OR a.id IS NULL
LIMIT 10;