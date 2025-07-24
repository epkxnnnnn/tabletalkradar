-- Ensure Super Admin profile exists and is configured correctly
-- Run this in Supabase SQL Editor

-- First, check if profile exists
SELECT id, email, role FROM profiles WHERE id = 'bbc06d26-ac73-4b38-8363-1e1c9fdecb68';

-- If profile doesn't exist, create it (replace with your actual user data)
INSERT INTO profiles (id, full_name, email, company_name, role, industry, business_type)
VALUES (
  'bbc06d26-ac73-4b38-8363-1e1c9fdecb68',
  'Super Admin',
  'kphstk@gmail.com', 
  'TableTalk Radar',
  'superadmin',
  'technology',
  'software'
) ON CONFLICT (id) DO UPDATE SET
  role = 'superadmin',
  email = 'kphstk@gmail.com',
  full_name = 'Super Admin',
  company_name = 'TableTalk Radar',
  updated_at = NOW();

-- Verify the profile is correct
SELECT id, email, role, full_name FROM profiles WHERE id = 'bbc06d26-ac73-4b38-8363-1e1c9fdecb68';