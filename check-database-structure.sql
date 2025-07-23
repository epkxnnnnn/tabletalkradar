-- Check your current database structure
-- Run these queries in Supabase SQL Editor to see what tables and columns you have

-- 1. Check if client_locations table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'client_locations'
ORDER BY 
    ordinal_position;

-- 2. Check if reviews table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'reviews'
ORDER BY 
    ordinal_position;

-- 3. Check existing data in client_locations
SELECT id, client_id, business_name, city, state FROM client_locations LIMIT 10;

-- 4. Check existing data in reviews
SELECT id, location_id, client_id, reviewer_name FROM reviews LIMIT 10;