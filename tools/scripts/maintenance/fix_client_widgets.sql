-- Fix client widgets creation
-- Run this after the main script if you get errors

-- First, let's see what clients exist
SELECT 
    c.id,
    c.business_name,
    a.name as agency_name,
    a.owner_id
FROM clients c
JOIN agencies a ON c.agency_id = a.id
WHERE a.owner_id = auth.uid();

-- Clean up any existing broken widgets
DELETE FROM client_dashboard_widgets WHERE client_id IS NULL;

-- Create widgets for all existing clients manually
DO $$
DECLARE
    client_record RECORD;
BEGIN
    FOR client_record IN 
        SELECT c.id as client_id, c.business_name
        FROM clients c
        JOIN agencies a ON c.agency_id = a.id
        WHERE a.owner_id = auth.uid()
    LOOP
        -- Delete existing default widgets for this client
        DELETE FROM client_dashboard_widgets 
        WHERE client_id = client_record.client_id AND is_default = true;
        
        -- Insert default widgets
        INSERT INTO client_dashboard_widgets (client_id, widget_type, widget_title, position_x, position_y, width, height, is_default, widget_config) VALUES
        (client_record.client_id, 'overview_stats', 'Business Overview', 0, 0, 2, 1, true, '{"show_reviews": true, "show_social": true}'),
        (client_record.client_id, 'social_calendar', 'Social Media Calendar', 0, 1, 2, 2, true, '{"view": "month", "show_platforms": ["facebook", "instagram"]}'),
        (client_record.client_id, 'recent_reviews', 'Recent Reviews', 2, 0, 1, 2, true, '{"limit": 5, "show_rating": true}'),
        (client_record.client_id, 'social_posts', 'Recent Posts', 2, 2, 1, 1, true, '{"limit": 3, "show_status": true}'),
        (client_record.client_id, 'quick_actions', 'Quick Actions', 0, 3, 3, 1, true, '{"actions": ["create_post", "respond_review", "view_analytics"]}');
        
        RAISE NOTICE 'Created widgets for client: %', client_record.business_name;
    END LOOP;
END $$;

-- Verify widgets were created
SELECT 
    c.business_name,
    cdw.widget_type,
    cdw.widget_title,
    cdw.position_x,
    cdw.position_y
FROM client_dashboard_widgets cdw
JOIN clients c ON cdw.client_id = c.id
JOIN agencies a ON c.agency_id = a.id
WHERE a.owner_id = auth.uid()
ORDER BY c.business_name, cdw.position_y, cdw.position_x;