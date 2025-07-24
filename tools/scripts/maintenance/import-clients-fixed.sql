-- Import clients into the clients table (using owner_id instead of user_id)
-- First, get your user ID
SELECT id FROM auth.users WHERE email = 'kphstk@gmail.com';

-- Once you have your user ID, update it in the INSERT statements below
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from the query above

-- Import all 7 clients
INSERT INTO clients (owner_id, business_name, contact_email, contact_phone, website, industry, business_type, category, notes, google_account_id, status, is_agency)
VALUES 
  ('YOUR_USER_ID_HERE', 'LullaBar Thai Fusion', 'lullabar@updates.reppro.io', '(702) 760-7888', 'https://lullabarlv.com/', 'food-beverage', 'restaurant', 'Thai Fusion Restaurant', 'Code: lullabar, Google Biz ID: 05162981688351067589', '05162981688351067589', 'active', false),
  ('YOUR_USER_ID_HERE', 'Alisa Sushi & Thai Bistro', 'alisa@updates.reppro.io', '(808) 359-7896', 'https://alisasushithai.com/', 'food-beverage', 'restaurant', 'Sushi & Thai Restaurant', 'Code: alisa_sushi, Google Biz ID: 13939946554744103274', '13939946554744103274', 'active', false),
  ('YOUR_USER_ID_HERE', 'Koloa Thai Bistro', 'koloa@updates.reppro.io', '(808) 359-7878', 'https://koloathai.com/', 'food-beverage', 'restaurant', 'Thai Restaurant', 'Code: koloa_thai, Google Biz ID: 01432254699959395236', '01432254699959395236', 'active', false),
  ('YOUR_USER_ID_HERE', 'Daikon Vegan Sushi & More', 'daikon@updates.reppro.io', '(702) 749-3283', 'https://daikonvegansushi.com/', 'food-beverage', 'restaurant', 'Vegan Sushi Restaurant', 'Code: daikon_vegan, Google Biz ID: 17268413971148579646', '17268413971148579646', 'active', false),
  ('YOUR_USER_ID_HERE', 'Basil Vegan Thai & Sushi', 'basil@updates.reppro.io', '(702) 357-3837', 'https://basilveganthai.com/', 'food-beverage', 'restaurant', 'Vegan Thai & Sushi Restaurant', 'Code: basil_vegan, Google Biz ID: 12704341248342351590', '12704341248342351590', 'active', false),
  ('YOUR_USER_ID_HERE', 'Bright Facial Spa & Thai Massage', 'brightspa@updates.reppro.io', '(725) 696-4289', 'https://www.brightspalv.com/', 'health-wellness', 'spa', 'Facial Spa & Massage', 'Code: bright_spa, Google Biz ID: 05826165322071156658', '05826165322071156658', 'active', false),
  ('YOUR_USER_ID_HERE', 'Chang Kao Thai Cuisine', 'changkao@updates.reppro.io', '(941) 739-2217', 'https://www.changkaothai.com/', 'food-beverage', 'restaurant', 'Thai Restaurant', 'Code: changkao, Google Biz ID: 7603485187217417605', '7603485187217417605', 'active', false)
ON CONFLICT DO NOTHING;

-- After importing, verify the clients were created
SELECT id, business_name, google_account_id FROM clients WHERE owner_id = 'YOUR_USER_ID_HERE';