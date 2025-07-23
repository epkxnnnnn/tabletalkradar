-- After importing clients, link the existing client_locations to the new client records
-- This query will update client_locations with the correct client_id based on matching business names

UPDATE client_locations 
SET client_id = clients.id
FROM clients
WHERE client_locations.business_name = clients.business_name
AND client_locations.client_id IS NULL;

-- Verify the linkage
SELECT 
  cl.id as location_id,
  cl.business_name,
  cl.city,
  cl.state,
  c.id as client_id,
  c.user_id,
  c.google_account_id
FROM client_locations cl
LEFT JOIN clients c ON cl.client_id = c.id
ORDER BY cl.business_name;