-- Set your user role to superadmin
-- Run this in Supabase SQL Editor

-- Update your profile to have superadmin role
UPDATE profiles 
SET 
  role = 'superadmin',
  updated_at = NOW()
WHERE id = 'bbc06d26-ac73-4b38-8363-1e1c9fdecb68';

-- Verify it worked
SELECT id, email, role, full_name FROM profiles WHERE id = 'bbc06d26-ac73-4b38-8363-1e1c9fdecb68';