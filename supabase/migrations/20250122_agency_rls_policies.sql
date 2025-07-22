-- Row Level Security Policies for Multi-Tenant Agency Management
-- These policies ensure proper data isolation between agencies while maintaining security

-- ============================================================================
-- 1. ENABLE RLS on all tables
-- ============================================================================

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_communications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. HELPER FUNCTIONS for RLS
-- ============================================================================

-- Function to get user's current agency memberships
CREATE OR REPLACE FUNCTION get_user_agency_ids(user_uuid UUID DEFAULT auth.uid())
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT agency_id 
        FROM agency_memberships 
        WHERE user_id = user_uuid AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is agency owner
CREATE OR REPLACE FUNCTION is_agency_owner(agency_uuid UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM agencies 
        WHERE id = agency_uuid AND owner_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role in agency
CREATE OR REPLACE FUNCTION has_agency_role(agency_uuid UUID, required_role TEXT, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM agency_memberships
    WHERE agency_id = agency_uuid AND user_id = user_uuid AND status = 'active';
    
    -- Role hierarchy: owner > admin > manager > client_manager > analyst
    RETURN CASE 
        WHEN required_role = 'analyst' THEN user_role IN ('owner', 'admin', 'manager', 'client_manager', 'analyst')
        WHEN required_role = 'client_manager' THEN user_role IN ('owner', 'admin', 'manager', 'client_manager')
        WHEN required_role = 'manager' THEN user_role IN ('owner', 'admin', 'manager')
        WHEN required_role = 'admin' THEN user_role IN ('owner', 'admin')
        WHEN required_role = 'owner' THEN user_role = 'owner'
        ELSE FALSE
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access client
CREATE OR REPLACE FUNCTION can_access_client(client_uuid UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM clients c
        LEFT JOIN client_assignments ca ON c.id = ca.client_id
        WHERE c.id = client_uuid
        AND (
            -- User has agency membership for this client's agency
            c.agency_id = ANY(get_user_agency_ids(user_uuid))
            -- Or user is specifically assigned to this client
            OR (ca.user_id = user_uuid AND ca.agency_id = ANY(get_user_agency_ids(user_uuid)))
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. AGENCIES TABLE POLICIES
-- ============================================================================

-- Agencies: Users can view agencies they're members of
CREATE POLICY "Users can view their agency memberships" ON agencies
    FOR SELECT USING (
        id = ANY(get_user_agency_ids())
        OR owner_id = auth.uid()
    );

-- Agencies: Only owners can create agencies
CREATE POLICY "Users can create agencies" ON agencies
    FOR INSERT WITH CHECK (
        owner_id = auth.uid()
    );

-- Agencies: Only owners can update their agencies
CREATE POLICY "Owners can update their agencies" ON agencies
    FOR UPDATE USING (
        owner_id = auth.uid()
    ) WITH CHECK (
        owner_id = auth.uid()
    );

-- Agencies: Only owners can delete their agencies
CREATE POLICY "Owners can delete their agencies" ON agencies
    FOR DELETE USING (
        owner_id = auth.uid()
    );

-- ============================================================================
-- 4. AGENCY MEMBERSHIPS POLICIES
-- ============================================================================

-- Agency Memberships: Users can view memberships in their agencies
CREATE POLICY "Users can view agency memberships" ON agency_memberships
    FOR SELECT USING (
        agency_id = ANY(get_user_agency_ids())
        OR user_id = auth.uid()
    );

-- Agency Memberships: Owners and admins can create memberships
CREATE POLICY "Agency admins can create memberships" ON agency_memberships
    FOR INSERT WITH CHECK (
        has_agency_role(agency_id, 'admin')
    );

-- Agency Memberships: Owners and admins can update memberships
CREATE POLICY "Agency admins can update memberships" ON agency_memberships
    FOR UPDATE USING (
        has_agency_role(agency_id, 'admin')
    ) WITH CHECK (
        has_agency_role(agency_id, 'admin')
    );

-- Agency Memberships: Owners and admins can delete memberships
CREATE POLICY "Agency admins can delete memberships" ON agency_memberships
    FOR DELETE USING (
        has_agency_role(agency_id, 'admin')
        OR user_id = auth.uid() -- Users can remove themselves
    );

-- ============================================================================
-- 5. CLIENTS TABLE POLICIES (UPDATE EXISTING)
-- ============================================================================

-- Drop existing client policies
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;

-- New agency-based client policies
CREATE POLICY "Agency members can view agency clients" ON clients
    FOR SELECT USING (
        agency_id = ANY(get_user_agency_ids())
    );

CREATE POLICY "Agency managers can create clients" ON clients
    FOR INSERT WITH CHECK (
        agency_id = ANY(get_user_agency_ids())
        AND has_agency_role(agency_id, 'manager')
    );

CREATE POLICY "Agency managers can update clients" ON clients
    FOR UPDATE USING (
        agency_id = ANY(get_user_agency_ids())
        AND has_agency_role(agency_id, 'manager')
    ) WITH CHECK (
        agency_id = ANY(get_user_agency_ids())
        AND has_agency_role(agency_id, 'manager')
    );

CREATE POLICY "Agency managers can delete clients" ON clients
    FOR DELETE USING (
        agency_id = ANY(get_user_agency_ids())
        AND has_agency_role(agency_id, 'manager')
    );

-- ============================================================================
-- 6. CLIENT ASSIGNMENTS POLICIES
-- ============================================================================

CREATE POLICY "Agency members can view client assignments" ON client_assignments
    FOR SELECT USING (
        agency_id = ANY(get_user_agency_ids())
    );

CREATE POLICY "Agency managers can create client assignments" ON client_assignments
    FOR INSERT WITH CHECK (
        agency_id = ANY(get_user_agency_ids())
        AND has_agency_role(agency_id, 'manager')
    );

CREATE POLICY "Agency managers can update client assignments" ON client_assignments
    FOR UPDATE USING (
        agency_id = ANY(get_user_agency_ids())
        AND has_agency_role(agency_id, 'manager')
    ) WITH CHECK (
        agency_id = ANY(get_user_agency_ids())
        AND has_agency_role(agency_id, 'manager')
    );

CREATE POLICY "Agency managers can delete client assignments" ON client_assignments
    FOR DELETE USING (
        agency_id = ANY(get_user_agency_ids())
        AND has_agency_role(agency_id, 'manager')
    );

-- ============================================================================
-- 7. AUDITS TABLE POLICIES (UPDATE EXISTING)
-- ============================================================================

-- Drop existing audit policies
DROP POLICY IF EXISTS "Users can view own audits" ON audits;
DROP POLICY IF EXISTS "Users can insert own audits" ON audits;
DROP POLICY IF EXISTS "Users can update own audits" ON audits;
DROP POLICY IF EXISTS "Users can delete own audits" ON audits;

-- New agency-based audit policies
CREATE POLICY "Agency members can view agency audits" ON audits
    FOR SELECT USING (
        agency_id = ANY(get_user_agency_ids())
        OR can_access_client(client_id)
    );

CREATE POLICY "Agency members can create audits" ON audits
    FOR INSERT WITH CHECK (
        agency_id = ANY(get_user_agency_ids())
        AND (client_id IS NULL OR can_access_client(client_id))
    );

CREATE POLICY "Agency members can update audits" ON audits
    FOR UPDATE USING (
        agency_id = ANY(get_user_agency_ids())
        AND (client_id IS NULL OR can_access_client(client_id))
    ) WITH CHECK (
        agency_id = ANY(get_user_agency_ids())
        AND (client_id IS NULL OR can_access_client(client_id))
    );

CREATE POLICY "Agency managers can delete audits" ON audits
    FOR DELETE USING (
        agency_id = ANY(get_user_agency_ids())
        AND has_agency_role(agency_id, 'manager')
    );

-- ============================================================================
-- 8. REPORTS TABLE POLICIES (UPDATE EXISTING)
-- ============================================================================

-- Drop existing report policies
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON reports;
DROP POLICY IF EXISTS "Users can update own reports" ON reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON reports;

-- New agency-based report policies
CREATE POLICY "Agency members can view agency reports" ON reports
    FOR SELECT USING (
        agency_id = ANY(get_user_agency_ids())
    );

CREATE POLICY "Agency members can create reports" ON reports
    FOR INSERT WITH CHECK (
        agency_id = ANY(get_user_agency_ids())
    );

CREATE POLICY "Agency members can update reports" ON reports
    FOR UPDATE USING (
        agency_id = ANY(get_user_agency_ids())
    ) WITH CHECK (
        agency_id = ANY(get_user_agency_ids())
    );

CREATE POLICY "Agency managers can delete reports" ON reports
    FOR DELETE USING (
        agency_id = ANY(get_user_agency_ids())
        AND has_agency_role(agency_id, 'manager')
    );

-- ============================================================================
-- 9. ACTION ITEMS TABLE POLICIES (UPDATE EXISTING)
-- ============================================================================

-- Drop existing action item policies
DROP POLICY IF EXISTS "Users can view own action items" ON action_items;
DROP POLICY IF EXISTS "Users can insert own action items" ON action_items;
DROP POLICY IF EXISTS "Users can update own action items" ON action_items;
DROP POLICY IF EXISTS "Users can delete own action items" ON action_items;

-- New agency-based action item policies
CREATE POLICY "Agency members can view agency action items" ON action_items
    FOR SELECT USING (
        agency_id = ANY(get_user_agency_ids())
    );

CREATE POLICY "Agency members can create action items" ON action_items
    FOR INSERT WITH CHECK (
        agency_id = ANY(get_user_agency_ids())
    );

CREATE POLICY "Agency members can update action items" ON action_items
    FOR UPDATE USING (
        agency_id = ANY(get_user_agency_ids())
    ) WITH CHECK (
        agency_id = ANY(get_user_agency_ids())
    );

CREATE POLICY "Agency managers can delete action items" ON action_items
    FOR DELETE USING (
        agency_id = ANY(get_user_agency_ids())
        AND has_agency_role(agency_id, 'manager')
    );

-- ============================================================================
-- 10. INTELLIGENCE LAYER POLICIES
-- ============================================================================

-- Market Intelligence policies
CREATE POLICY "Agency members can view market intelligence" ON market_intelligence
    FOR SELECT USING (
        agency_id = ANY(get_user_agency_ids())
    );

CREATE POLICY "Agency analysts can create market intelligence" ON market_intelligence
    FOR INSERT WITH CHECK (
        agency_id = ANY(get_user_agency_ids())
        AND has_agency_role(agency_id, 'analyst')
    );

CREATE POLICY "Agency analysts can update market intelligence" ON market_intelligence
    FOR UPDATE USING (
        agency_id = ANY(get_user_agency_ids())
        AND has_agency_role(agency_id, 'analyst')
    ) WITH CHECK (
        agency_id = ANY(get_user_agency_ids())
    );

-- Predictive Analytics policies
CREATE POLICY "Agency members can view predictive analytics" ON predictive_analytics
    FOR SELECT USING (
        agency_id = ANY(get_user_agency_ids())
    );

CREATE POLICY "Agency analysts can create predictive analytics" ON predictive_analytics
    FOR INSERT WITH CHECK (
        agency_id = ANY(get_user_agency_ids())
        AND has_agency_role(agency_id, 'analyst')
    );

-- ============================================================================
-- 11. AUTOMATION LAYER POLICIES
-- ============================================================================

-- Automation Workflows policies
CREATE POLICY "Agency members can view workflows" ON automation_workflows
    FOR SELECT USING (
        agency_id = ANY(get_user_agency_ids())
    );

CREATE POLICY "Agency managers can manage workflows" ON automation_workflows
    FOR INSERT WITH CHECK (
        agency_id = ANY(get_user_agency_ids())
        AND has_agency_role(agency_id, 'manager')
    );

CREATE POLICY "Agency managers can update workflows" ON automation_workflows
    FOR UPDATE USING (
        agency_id = ANY(get_user_agency_ids())
        AND has_agency_role(agency_id, 'manager')
    ) WITH CHECK (
        agency_id = ANY(get_user_agency_ids())
    );

-- Automation Logs policies
CREATE POLICY "Agency members can view automation logs" ON automation_logs
    FOR SELECT USING (
        agency_id = ANY(get_user_agency_ids())
    );

CREATE POLICY "System can create automation logs" ON automation_logs
    FOR INSERT WITH CHECK (
        agency_id = ANY(get_user_agency_ids())
    );

-- ============================================================================
-- 12. COMMUNICATION LAYER POLICIES
-- ============================================================================

-- Client Communications policies
CREATE POLICY "Agency members can view client communications" ON client_communications
    FOR SELECT USING (
        agency_id = ANY(get_user_agency_ids())
    );

CREATE POLICY "Agency members can create client communications" ON client_communications
    FOR INSERT WITH CHECK (
        agency_id = ANY(get_user_agency_ids())
        AND has_agency_role(agency_id, 'client_manager')
    );

CREATE POLICY "Agency members can update client communications" ON client_communications
    FOR UPDATE USING (
        agency_id = ANY(get_user_agency_ids())
        AND (sent_by = auth.uid() OR has_agency_role(agency_id, 'admin'))
    ) WITH CHECK (
        agency_id = ANY(get_user_agency_ids())
    );

-- ============================================================================
-- 13. SUPERADMIN OVERRIDE POLICIES
-- ============================================================================

-- Superadmins can access everything (override all policies)
CREATE POLICY "Superadmin full access" ON agencies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    ) WITH CHECK (TRUE);

-- Apply superadmin override to all tables
DO $$
DECLARE
    table_name TEXT;
    table_names TEXT[] := ARRAY[
        'agency_memberships', 'client_assignments', 'clients', 
        'audits', 'reports', 'action_items', 'market_intelligence',
        'predictive_analytics', 'automation_workflows', 'automation_logs',
        'client_communications'
    ];
BEGIN
    FOREACH table_name IN ARRAY table_names LOOP
        EXECUTE format('
            CREATE POLICY "Superadmin full access %s" ON %I
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role = ''superadmin''
                )
            ) WITH CHECK (TRUE)
        ', table_name, table_name);
    END LOOP;
END $$;