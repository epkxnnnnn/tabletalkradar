-- Import clients into the clients table with correct column names
-- First, get your user ID
SELECT id FROM auth.users WHERE email = 'kphstk@gmail.com';

-- Once you have your user ID, update it in the INSERT statements below
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from the query above

-- Import all 7 clients
INSERT INTO clients (owner_id, business_name, website, phone, category, industry, business_type, google_account_id, status, is_agency)
VALUES 
  ('bbc06d26-ac73-4b38-8363-1e1c9fdecb68', 'LullaBar Thai Fusion', 'https://lullabarlv.com/', '(702) 760-7888', 'Thai Fusion Restaurant', 'food-beverage', 'restaurant', '05162981688351067589', 'active', false),
  ('bbc06d26-ac73-4b38-8363-1e1c9fdecb68', 'Alisa Sushi & Thai Bistro', 'https://alisasushithai.com/', '(808) 359-7896', 'Sushi & Thai Restaurant', 'food-beverage', 'restaurant', '13939946554744103274', 'active', false),
  ('bbc06d26-ac73-4b38-8363-1e1c9fdecb68', 'Koloa Thai Bistro', 'https://koloathai.com/', '(808) 359-7878', 'Thai Restaurant', 'food-beverage', 'restaurant', '01432254699959395236', 'active', false),
  ('bbc06d26-ac73-4b38-8363-1e1c9fdecb68', 'Daikon Vegan Sushi & More', 'https://daikonvegansushi.com/', '(702) 749-3283', 'Vegan Sushi Restaurant', 'food-beverage', 'restaurant', '17268413971148579646', 'active', false),
  ('bbc06d26-ac73-4b38-8363-1e1c9fdecb68', 'Basil Vegan Thai & Sushi', 'https://basilveganthai.com/', '(702) 357-3837', 'Vegan Thai & Sushi Restaurant', 'food-beverage', 'restaurant', '12704341248342351590', 'active', false),
  ('bbc06d26-ac73-4b38-8363-1e1c9fdecb68', 'Bright Facial Spa & Thai Massage', 'https://www.brightspalv.com/', '(725) 696-4289', 'Facial Spa & Massage', 'health-wellness', 'spa', '05826165322071156658', 'active', false),
  ('bbc06d26-ac73-4b38-8363-1e1c9fdecb68', 'Chang Kao Thai Cuisine', 'https://www.changkaothai.com/', '(941) 739-2217', 'Thai Restaurant', 'food-beverage', 'restaurant', '7603485187217417605', 'active', false)
ON CONFLICT DO NOTHING;

-- After importing, verify the clients were created
SELECT id, business_name, google_account_id FROM clients WHERE owner_id = 'bbc06d26-ac73-4b38-8363-1e1c9fdecb68E';