-- Link the existing client_locations to the newly imported clients
-- This will update client_locations with the correct client_id based on matching business names

UPDATE client_locations 
SET client_id = clients.id
FROM clients
WHERE client_locations.business_name = clients.business_name
AND clients.owner_id = 'bbc06d26-ac73-4b38-8363-1e1c9fdecb68';

-- Verify the linkage
SELECT 
  cl.id as location_id,
  cl.business_name,
  cl.city,
  cl.state,
  c.id as client_id,
  c.owner_id,
  c.google_account_id
FROM client_locations cl
JOIN clients c ON cl.client_id = c.id
WHERE c.owner_id = 'bbc06d26-ac73-4b38-8363-1e1c9fdecb68'
ORDER BY cl.business_name;