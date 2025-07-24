-- Step 3: Verify the setup worked
-- Run this to check everything was created correctly

-- Check if tables exist
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE tablename IN ('client_users', 'client_dashboard_widgets')
ORDER BY tablename;

-- Check client_users created
SELECT 
    cu.id,
    cu.role,
    c.business_name,
    a.name as agency_name,
    cu.is_active,
    cu.created_at
FROM client_users cu
JOIN clients c ON cu.client_id = c.id
JOIN agencies a ON cu.agency_id = a.id
WHERE cu.user_id = auth.uid();

-- Check widgets created  
SELECT 
    c.business_name,
    cdw.widget_type,
    cdw.widget_title,
    cdw.position_x,
    cdw.position_y,
    cdw.is_default
FROM client_dashboard_widgets cdw
JOIN clients c ON cdw.client_id = c.id
JOIN agencies a ON c.agency_id = a.id
WHERE a.owner_id = auth.uid()
ORDER BY c.business_name, cdw.position_y, cdw.position_x;

-- Count widgets per client
SELECT 
    c.business_name,
    COUNT(cdw.id) as widget_count
FROM clients c
JOIN agencies a ON c.agency_id = a.id
LEFT JOIN client_dashboard_widgets cdw ON cdw.client_id = c.id
WHERE a.owner_id = auth.uid()
GROUP BY c.id, c.business_name
ORDER BY c.business_name;