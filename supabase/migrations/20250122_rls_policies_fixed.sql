-- Fixed RLS Policies - Checks for existing policies before creating
-- Row Level Security policies for multi-tenant agency management

-- Enable RLS on all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_memberships ENABLE ROW LEVEL SECURITY; 
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has agency access
CREATE OR REPLACE FUNCTION user_has_agency_access(agency_uuid UUID, required_role TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM agency_memberships am 
        WHERE am.agency_id = agency_uuid 
        AND am.user_id = auth.uid()
        AND am.status = 'active'
        AND (required_role IS NULL OR am.role = required_role OR 
             (required_role = 'manager' AND am.role = 'owner') OR
             (required_role = 'analyst' AND am.role IN ('owner', 'manager')) OR
             (required_role = 'specialist' AND am.role IN ('owner', 'manager', 'analyst')))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies if they exist, then recreate
-- Agencies policies
DROP POLICY IF EXISTS "Users can view agencies they belong to" ON agencies;
DROP POLICY IF EXISTS "Users can create agencies" ON agencies;
DROP POLICY IF EXISTS "Agency owners can update their agency" ON agencies;
DROP POLICY IF EXISTS "Agency owners can delete their agency" ON agencies;

CREATE POLICY "Users can view agencies they belong to" ON agencies
    FOR SELECT USING (user_has_agency_access(id));

CREATE POLICY "Users can create agencies" ON agencies
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Agency owners can update their agency" ON agencies
    FOR UPDATE USING (user_has_agency_access(id, 'owner'));

CREATE POLICY "Agency owners can delete their agency" ON agencies
    FOR DELETE USING (user_has_agency_access(id, 'owner'));

-- Agency memberships policies
DROP POLICY IF EXISTS "Users can view memberships for their agencies" ON agency_memberships;
DROP POLICY IF EXISTS "Agency owners and managers can create memberships" ON agency_memberships;
DROP POLICY IF EXISTS "Agency owners and managers can update memberships" ON agency_memberships;
DROP POLICY IF EXISTS "Agency owners can delete memberships" ON agency_memberships;
DROP POLICY IF EXISTS "Users can update their own membership" ON agency_memberships;

CREATE POLICY "Users can view memberships for their agencies" ON agency_memberships
    FOR SELECT USING (user_has_agency_access(agency_id));

CREATE POLICY "Agency owners and managers can create memberships" ON agency_memberships
    FOR INSERT WITH CHECK (user_has_agency_access(agency_id, 'manager'));

CREATE POLICY "Agency owners and managers can update memberships" ON agency_memberships
    FOR UPDATE USING (user_has_agency_access(agency_id, 'manager'));

CREATE POLICY "Agency owners can delete memberships" ON agency_memberships
    FOR DELETE USING (user_has_agency_access(agency_id, 'owner'));

CREATE POLICY "Users can update their own membership" ON agency_memberships
    FOR UPDATE USING (user_id = auth.uid());

-- Clients policies  
DROP POLICY IF EXISTS "Agency members can view clients" ON clients;
DROP POLICY IF EXISTS "Agency managers can create clients" ON clients;
DROP POLICY IF EXISTS "Agency managers can update clients" ON clients;
DROP POLICY IF EXISTS "Agency owners can delete clients" ON clients;

CREATE POLICY "Agency members can view clients" ON clients
    FOR SELECT USING (user_has_agency_access(agency_id));

CREATE POLICY "Agency managers can create clients" ON clients
    FOR INSERT WITH CHECK (user_has_agency_access(agency_id, 'manager'));

CREATE POLICY "Agency managers can update clients" ON clients
    FOR UPDATE USING (user_has_agency_access(agency_id, 'manager'));

CREATE POLICY "Agency owners can delete clients" ON clients
    FOR DELETE USING (user_has_agency_access(agency_id, 'owner'));

-- Audits policies (if audits table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audits') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Agency members can view audits" ON audits;
        DROP POLICY IF EXISTS "Agency analysts can create audits" ON audits;
        DROP POLICY IF EXISTS "Agency analysts can update audits" ON audits;
        DROP POLICY IF EXISTS "Agency managers can delete audits" ON audits;
        
        -- Create new policies
        CREATE POLICY "Agency members can view audits" ON audits
            FOR SELECT USING (user_has_agency_access(agency_id));

        CREATE POLICY "Agency analysts can create audits" ON audits
            FOR INSERT WITH CHECK (user_has_agency_access(agency_id, 'analyst'));

        CREATE POLICY "Agency analysts can update audits" ON audits
            FOR UPDATE USING (user_has_agency_access(agency_id, 'analyst'));

        CREATE POLICY "Agency managers can delete audits" ON audits
            FOR DELETE USING (user_has_agency_access(agency_id, 'manager'));
    END IF;
END $$;

-- Market Intelligence policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'market_intelligence') THEN
        DROP POLICY IF EXISTS "Agency members can view intelligence" ON market_intelligence;
        DROP POLICY IF EXISTS "Agency analysts can create intelligence" ON market_intelligence;
        DROP POLICY IF EXISTS "Agency analysts can update intelligence" ON market_intelligence;
        DROP POLICY IF EXISTS "Agency managers can delete intelligence" ON market_intelligence;
        
        CREATE POLICY "Agency members can view intelligence" ON market_intelligence
            FOR SELECT USING (user_has_agency_access(agency_id));

        CREATE POLICY "Agency analysts can create intelligence" ON market_intelligence
            FOR INSERT WITH CHECK (user_has_agency_access(agency_id, 'analyst'));

        CREATE POLICY "Agency analysts can update intelligence" ON market_intelligence
            FOR UPDATE USING (user_has_agency_access(agency_id, 'analyst'));

        CREATE POLICY "Agency managers can delete intelligence" ON market_intelligence
            FOR DELETE USING (user_has_agency_access(agency_id, 'manager'));
    END IF;
END $$;

-- Predictive Analytics policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'predictive_analytics') THEN
        DROP POLICY IF EXISTS "Agency members can view predictions" ON predictive_analytics;
        DROP POLICY IF EXISTS "Agency analysts can create predictions" ON predictive_analytics;
        DROP POLICY IF EXISTS "Agency analysts can update predictions" ON predictive_analytics;
        DROP POLICY IF EXISTS "Agency managers can delete predictions" ON predictive_analytics;
        
        CREATE POLICY "Agency members can view predictions" ON predictive_analytics
            FOR SELECT USING (user_has_agency_access(agency_id));

        CREATE POLICY "Agency analysts can create predictions" ON predictive_analytics
            FOR INSERT WITH CHECK (user_has_agency_access(agency_id, 'analyst'));

        CREATE POLICY "Agency analysts can update predictions" ON predictive_analytics
            FOR UPDATE USING (user_has_agency_access(agency_id, 'analyst'));

        CREATE POLICY "Agency managers can delete predictions" ON predictive_analytics
            FOR DELETE USING (user_has_agency_access(agency_id, 'manager'));
    END IF;
END $$;

-- Task Automation policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_automation') THEN
        DROP POLICY IF EXISTS "Agency members can view tasks" ON task_automation;
        DROP POLICY IF EXISTS "Agency managers can create tasks" ON task_automation;
        DROP POLICY IF EXISTS "Team members can update task status" ON task_automation;
        DROP POLICY IF EXISTS "Agency managers can update tasks" ON task_automation;
        DROP POLICY IF EXISTS "Agency owners can delete tasks" ON task_automation;
        
        CREATE POLICY "Agency members can view tasks" ON task_automation
            FOR SELECT USING (user_has_agency_access(agency_id));

        CREATE POLICY "Agency managers can create tasks" ON task_automation
            FOR INSERT WITH CHECK (user_has_agency_access(agency_id, 'manager'));

        CREATE POLICY "Team members can update task status" ON task_automation
            FOR UPDATE USING (user_has_agency_access(agency_id, 'specialist'));

        CREATE POLICY "Agency managers can update tasks" ON task_automation
            FOR UPDATE USING (user_has_agency_access(agency_id, 'manager'));

        CREATE POLICY "Agency owners can delete tasks" ON task_automation
            FOR DELETE USING (user_has_agency_access(agency_id, 'owner'));
    END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON agencies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON agency_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO authenticated;

-- Grant permissions on existing tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audits') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON audits TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'market_intelligence') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON market_intelligence TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'predictive_analytics') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON predictive_analytics TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_automation') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON task_automation TO authenticated;
    END IF;
END $$;

-- Create helpful view for agency permissions
CREATE OR REPLACE VIEW user_agency_permissions AS
SELECT 
    am.user_id,
    am.agency_id,
    a.name as agency_name,
    am.role,
    am.status,
    am.permissions,
    CASE 
        WHEN am.role = 'owner' THEN jsonb_build_object(
            'can_edit_agency_settings', true,
            'can_manage_roles', true,
            'can_invite_members', true,
            'can_remove_members', true,
            'can_create_clients', true,
            'can_edit_clients', true,
            'can_delete_clients', true,
            'can_run_audits', true,
            'can_view_all_audits', true,
            'can_generate_reports', true,
            'can_access_ai_insights', true,
            'can_manage_automations', true,
            'can_export_data', true
        )
        WHEN am.role = 'manager' THEN jsonb_build_object(
            'can_edit_agency_settings', false,
            'can_manage_roles', true,
            'can_invite_members', true,
            'can_remove_members', false,
            'can_create_clients', true,
            'can_edit_clients', true,
            'can_delete_clients', false,
            'can_run_audits', true,
            'can_view_all_audits', true,
            'can_generate_reports', true,
            'can_access_ai_insights', true,
            'can_manage_automations', true,
            'can_export_data', true
        )
        WHEN am.role = 'analyst' THEN jsonb_build_object(
            'can_edit_agency_settings', false,
            'can_manage_roles', false,
            'can_invite_members', false,
            'can_remove_members', false,
            'can_create_clients', true,
            'can_edit_clients', true,
            'can_delete_clients', false,
            'can_run_audits', true,
            'can_view_all_audits', true,
            'can_generate_reports', true,
            'can_access_ai_insights', true,
            'can_manage_automations', false,
            'can_export_data', true
        )
        WHEN am.role = 'specialist' THEN jsonb_build_object(
            'can_edit_agency_settings', false,
            'can_manage_roles', false,
            'can_invite_members', false,
            'can_remove_members', false,
            'can_create_clients', false,
            'can_edit_clients', true,
            'can_delete_clients', false,
            'can_run_audits', true,
            'can_view_all_audits', false,
            'can_generate_reports', false,
            'can_access_ai_insights', false,
            'can_manage_automations', false,
            'can_export_data', false
        )
        ELSE jsonb_build_object(
            'can_edit_agency_settings', false,
            'can_manage_roles', false,
            'can_invite_members', false,
            'can_remove_members', false,
            'can_create_clients', false,
            'can_edit_clients', false,
            'can_delete_clients', false,
            'can_run_audits', false,
            'can_view_all_audits', false,
            'can_generate_reports', false,
            'can_access_ai_insights', false,
            'can_manage_automations', false,
            'can_export_data', false
        )
    END as default_permissions
FROM agency_memberships am
JOIN agencies a ON a.id = am.agency_id
WHERE am.status = 'active';

COMMENT ON VIEW user_agency_permissions IS 'Consolidated view of user permissions across agencies with role-based defaults';