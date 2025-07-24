-- Step 2: Add the functions and sample data
-- Run this AFTER step 1

-- Function to create default dashboard widgets for new clients
CREATE OR REPLACE FUNCTION create_default_client_widgets(p_client_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Check if client_id is valid and exists
    IF p_client_id IS NULL THEN
        RAISE EXCEPTION 'client_id cannot be null';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM clients WHERE id = p_client_id) THEN
        RAISE EXCEPTION 'Client with id % does not exist', p_client_id;
    END IF;
    
    -- Delete existing default widgets for this client (in case of re-run)
    DELETE FROM client_dashboard_widgets 
    WHERE client_id = p_client_id AND is_default = true;
    
    -- Insert default widgets for new client dashboard
    INSERT INTO client_dashboard_widgets (client_id, widget_type, widget_title, position_x, position_y, width, height, is_default, widget_config) VALUES
    (p_client_id, 'overview_stats', 'Business Overview', 0, 0, 2, 1, true, '{"show_reviews": true, "show_social": true}'),
    (p_client_id, 'social_calendar', 'Social Media Calendar', 0, 1, 2, 2, true, '{"view": "month", "show_platforms": ["facebook", "instagram"]}'),
    (p_client_id, 'recent_reviews', 'Recent Reviews', 2, 0, 1, 2, true, '{"limit": 5, "show_rating": true}'),
    (p_client_id, 'social_posts', 'Recent Posts', 2, 2, 1, 1, true, '{"limit": 3, "show_status": true}'),
    (p_client_id, 'quick_actions', 'Quick Actions', 0, 3, 3, 1, true, '{"actions": ["create_post", "respond_review", "view_analytics"]}');
    
    RAISE NOTICE 'Created % default widgets for client %', 5, p_client_id;
END;
$$ LANGUAGE plpgsql;

-- Create client_user records for existing clients (so agency owners can access client dashboards)
INSERT INTO client_users (user_id, client_id, agency_id, role)
SELECT 
    a.owner_id as user_id,
    c.id as client_id,
    c.agency_id,
    'owner' as role
FROM agencies a
JOIN clients c ON c.agency_id = a.id
WHERE a.owner_id = auth.uid()
ON CONFLICT (user_id, client_id) DO NOTHING;

-- Create default widgets for all existing clients
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
        BEGIN
            PERFORM create_default_client_widgets(client_record.client_id);
            RAISE NOTICE 'Created widgets for client: %', client_record.business_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to create widgets for client %: %', client_record.business_name, SQLERRM;
        END;
    END LOOP;
END $$;