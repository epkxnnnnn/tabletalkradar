-- Fix agency setup and ensure proper client connections
-- Run this in your Supabase SQL Editor

-- Step 1: Ensure you have an agency (replace with your actual user ID)
-- First get your user ID:
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Create an agency if you don't have one (replace USER_ID with your actual ID)
INSERT INTO agencies (
    name,
    industry,
    location,
    business_type,
    description,
    owner_id,
    subscription_plan,
    status
) 
SELECT 
    'My Agency',
    'Business Services', 
    'Las Vegas, NV',
    'Marketing Agency',
    'AI-powered business analysis and marketing agency',
    'YOUR_USER_ID_HERE'::uuid,
    'professional',
    'active'
WHERE NOT EXISTS (
    SELECT 1 FROM agencies WHERE owner_id = 'YOUR_USER_ID_HERE'::uuid
);

-- Step 2: Get your agency ID
SELECT id as agency_id, name FROM agencies WHERE owner_id = auth.uid();

-- Step 3: Update existing clients to be linked to your agency
-- (This will link any orphaned clients to your agency)
UPDATE clients 
SET agency_id = (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1)
WHERE agency_id IS NULL 
AND EXISTS (SELECT 1 FROM agencies WHERE owner_id = auth.uid());

-- Step 4: Add missing columns if they don't exist
ALTER TABLE clients ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_type VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS location VARCHAR(200);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS unique_selling_proposition TEXT;

-- Step 5: Update existing clients with sample data for AI analyzer
UPDATE clients SET 
    industry = COALESCE(industry, 'Food & Beverage'),
    business_type = COALESCE(business_type, 'Restaurant'),
    location = COALESCE(location, 'Las Vegas, NV'),
    target_audience = COALESCE(target_audience, 'Local customers and tourists'),
    unique_selling_proposition = COALESCE(unique_selling_proposition, 'Quality service and authentic flavors')
WHERE agency_id = (SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1);

-- Step 6: Verify the setup
SELECT 
    a.name as agency_name,
    COUNT(c.id) as client_count,
    COUNT(CASE WHEN c.industry IS NOT NULL THEN 1 END) as clients_with_industry
FROM agencies a
LEFT JOIN clients c ON a.id = c.agency_id
WHERE a.owner_id = auth.uid()
GROUP BY a.id, a.name;