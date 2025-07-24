-- Remove duplicate clients, keeping the most recent version of each
-- Run this in your Supabase SQL Editor

-- First, let's see what we're removing
SELECT 
    business_name,
    location,
    COUNT(*) as duplicate_count,
    string_agg(id::text, ', ') as all_ids
FROM clients
GROUP BY business_name, location
HAVING COUNT(*) > 1;

-- Remove duplicates, keeping the most recent record for each business+location
WITH duplicates_to_remove AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY business_name, location 
               ORDER BY created_at DESC
           ) as rn
    FROM clients
)
DELETE FROM clients 
WHERE id IN (
    SELECT id 
    FROM duplicates_to_remove 
    WHERE rn > 1
);

-- Verify cleanup - should show 7 unique clients
SELECT 
    business_name,
    location,
    industry,
    business_type,
    health_score,
    created_at
FROM clients
ORDER BY business_name;

-- Final count
SELECT COUNT(*) as total_clients FROM clients;