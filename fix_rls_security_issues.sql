-- Fix RLS Security Issues in Supabase Database
-- This addresses all the security warnings from the database linter

-- ==============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ==============================================

-- Core tables that need RLS enabled
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_locations ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 2. CREATE COMPREHENSIVE RLS POLICIES
-- ==============================================

-- AGENCIES TABLE POLICIES
DROP POLICY IF EXISTS "user_agencies" ON agencies;
CREATE POLICY "user_agencies" ON agencies
    FOR ALL USING (
        owner_id = auth.uid() OR
        id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- AGENCY_MEMBERSHIPS TABLE POLICIES  
DROP POLICY IF EXISTS "user_memberships" ON agency_memberships;
CREATE POLICY "user_memberships" ON agency_memberships
    FOR ALL USING (
        user_id = auth.uid() OR
        agency_id IN (
            SELECT id FROM agencies WHERE owner_id = auth.uid()
        )
    );

-- CLIENT_ASSIGNMENTS TABLE POLICIES
CREATE POLICY "users_can_view_their_assignments" ON client_assignments
    FOR SELECT USING (
        user_id = auth.uid() OR
        client_id IN (
            SELECT c.id FROM clients c
            JOIN agency_memberships am ON c.agency_id = am.agency_id
            WHERE am.user_id = auth.uid() AND am.status = 'active'
        )
    );

CREATE POLICY "agency_owners_can_manage_assignments" ON client_assignments
    FOR ALL USING (
        client_id IN (
            SELECT c.id FROM clients c
            JOIN agencies a ON c.agency_id = a.id
            WHERE a.owner_id = auth.uid()
        )
    );

-- REPORTS TABLE POLICIES
CREATE POLICY "users_can_view_agency_reports" ON reports
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "users_can_create_agency_reports" ON reports
    FOR INSERT WITH CHECK (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- ACTION_ITEMS TABLE POLICIES
CREATE POLICY "users_can_view_agency_action_items" ON action_items
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "users_can_manage_agency_action_items" ON action_items
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- NOTIFICATIONS TABLE POLICIES
CREATE POLICY "users_can_view_their_notifications" ON notifications
    FOR SELECT USING (
        user_id = auth.uid() OR
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "users_can_manage_their_notifications" ON notifications
    FOR ALL USING (
        user_id = auth.uid()
    );

-- MARKET_INTELLIGENCE TABLE POLICIES
DROP POLICY IF EXISTS "agency_intelligence" ON market_intelligence;
CREATE POLICY "agency_intelligence" ON market_intelligence
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- PREDICTIVE_ANALYTICS TABLE POLICIES
DROP POLICY IF EXISTS "agency_analytics" ON predictive_analytics;
CREATE POLICY "agency_analytics" ON predictive_analytics
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- AUTOMATION_WORKFLOWS TABLE POLICIES
CREATE POLICY "users_can_view_agency_workflows" ON automation_workflows
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "users_can_manage_agency_workflows" ON automation_workflows
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- AUTOMATION_LOGS TABLE POLICIES
CREATE POLICY "users_can_view_agency_automation_logs" ON automation_logs
    FOR SELECT USING (
        workflow_id IN (
            SELECT id FROM automation_workflows 
            WHERE agency_id IN (
                SELECT agency_id FROM agency_memberships 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

-- CLIENT_COMMUNICATIONS TABLE POLICIES
CREATE POLICY "users_can_view_agency_communications" ON client_communications
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        ) OR
        client_id IN (
            SELECT c.id FROM clients c
            JOIN client_users cu ON c.id = cu.client_id
            WHERE cu.user_id = auth.uid() AND cu.status = 'active'
        )
    );

CREATE POLICY "users_can_create_agency_communications" ON client_communications
    FOR INSERT WITH CHECK (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- SOCIAL_MEDIA_POSTS TABLE POLICIES
CREATE POLICY "users_can_view_agency_social_posts" ON social_media_posts
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        ) OR
        client_id IN (
            SELECT c.id FROM clients c
            JOIN client_users cu ON c.id = cu.client_id
            WHERE cu.user_id = auth.uid() AND cu.status = 'active'
        )
    );

CREATE POLICY "users_can_manage_agency_social_posts" ON social_media_posts
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- SOCIAL_MEDIA_TEMPLATES TABLE POLICIES
CREATE POLICY "users_can_view_agency_templates" ON social_media_templates
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "users_can_manage_agency_templates" ON social_media_templates
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- REVIEWS TABLE POLICIES
CREATE POLICY "users_can_view_agency_reviews" ON reviews
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        ) OR
        client_id IN (
            SELECT c.id FROM clients c
            JOIN client_users cu ON c.id = cu.client_id
            WHERE cu.user_id = auth.uid() AND cu.status = 'active'
        )
    );

CREATE POLICY "users_can_manage_agency_reviews" ON reviews
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- CLIENT_USERS TABLE POLICIES
CREATE POLICY "users_can_view_client_users" ON client_users
    FOR SELECT USING (
        user_id = auth.uid() OR
        client_id IN (
            SELECT c.id FROM clients c
            JOIN agency_memberships am ON c.agency_id = am.agency_id
            WHERE am.user_id = auth.uid() AND am.status = 'active'
        )
    );

CREATE POLICY "agency_users_can_manage_client_users" ON client_users
    FOR ALL USING (
        client_id IN (
            SELECT c.id FROM clients c
            JOIN agency_memberships am ON c.agency_id = am.agency_id
            WHERE am.user_id = auth.uid() AND am.status = 'active'
        )
    );

-- CLIENT_DASHBOARD_WIDGETS TABLE POLICIES
CREATE POLICY "users_can_view_client_widgets" ON client_dashboard_widgets
    FOR SELECT USING (
        client_id IN (
            SELECT c.id FROM clients c
            JOIN client_users cu ON c.id = cu.client_id
            WHERE cu.user_id = auth.uid() AND cu.status = 'active'
        ) OR
        client_id IN (
            SELECT c.id FROM clients c
            JOIN agency_memberships am ON c.agency_id = am.agency_id
            WHERE am.user_id = auth.uid() AND am.status = 'active'
        )
    );

CREATE POLICY "agency_users_can_manage_client_widgets" ON client_dashboard_widgets
    FOR ALL USING (
        client_id IN (
            SELECT c.id FROM clients c
            JOIN agency_memberships am ON c.agency_id = am.agency_id
            WHERE am.user_id = auth.uid() AND am.status = 'active'
        )
    );

-- LOCATION_SEO_AUDITS TABLE POLICIES
CREATE POLICY "users_can_view_location_seo_audits" ON location_seo_audits
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        ) OR
        client_id IN (
            SELECT c.id FROM clients c
            JOIN client_users cu ON c.id = cu.client_id
            WHERE cu.user_id = auth.uid() AND cu.status = 'active'
        )
    );

CREATE POLICY "agency_users_can_manage_location_seo_audits" ON location_seo_audits
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- LOCATION_KEYWORDS TABLE POLICIES
CREATE POLICY "users_can_view_location_keywords" ON location_keywords
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        ) OR
        client_id IN (
            SELECT c.id FROM clients c
            JOIN client_users cu ON c.id = cu.client_id
            WHERE cu.user_id = auth.uid() AND cu.status = 'active'
        )
    );

CREATE POLICY "agency_users_can_manage_location_keywords" ON location_keywords
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- CLIENT_LOCATIONS TABLE POLICIES
CREATE POLICY "users_can_view_client_locations" ON client_locations
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        ) OR
        client_id IN (
            SELECT c.id FROM clients c
            JOIN client_users cu ON c.id = cu.client_id
            WHERE cu.user_id = auth.uid() AND cu.status = 'active'
        )
    );

CREATE POLICY "agency_users_can_manage_client_locations" ON client_locations
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM agency_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- ==============================================
-- 3. FIX SECURITY DEFINER VIEWS (if they exist)
-- ==============================================

-- Drop and recreate views without SECURITY DEFINER if they exist
DROP VIEW IF EXISTS customer_ticket_counts;
DROP VIEW IF EXISTS winner_details;

-- Create safe versions if the tables exist
DO $$
BEGIN
    -- Only create if the underlying tables exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tickets') THEN
        CREATE VIEW customer_ticket_counts AS
        SELECT 
            customer_id,
            COUNT(*) as ticket_count,
            COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
            COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets
        FROM tickets
        GROUP BY customer_id;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'winners') THEN
        CREATE VIEW winner_details AS
        SELECT 
            w.*,
            u.full_name,
            u.email
        FROM winners w
        LEFT JOIN profiles u ON w.user_id = u.id;
    END IF;
END $$;

-- ==============================================
-- 4. VERIFY RLS IS PROPERLY CONFIGURED
-- ==============================================

-- Check that RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ Enabled'
        ELSE '❌ Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'agencies', 'agency_memberships', 'client_assignments', 'reports', 'action_items',
        'notifications', 'market_intelligence', 'predictive_analytics', 'automation_workflows',
        'automation_logs', 'client_communications', 'social_media_posts', 'social_media_templates',
        'reviews', 'client_users', 'client_dashboard_widgets', 'location_seo_audits',
        'location_keywords', 'client_locations'
    )
ORDER BY tablename;

-- ==============================================
-- 5. GRANT APPROPRIATE PERMISSIONS
-- ==============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant SELECT, INSERT, UPDATE, DELETE on tables to authenticated users
-- RLS policies will control what they can actually access
DO $$
DECLARE
    table_name text;
    table_list text[] := ARRAY[
        'agencies', 'agency_memberships', 'client_assignments', 'reports', 'action_items',
        'notifications', 'market_intelligence', 'predictive_analytics', 'automation_workflows',
        'automation_logs', 'client_communications', 'social_media_posts', 'social_media_templates',
        'reviews', 'client_users', 'client_dashboard_widgets', 'location_seo_audits',
        'location_keywords', 'client_locations'
    ];
BEGIN
    FOREACH table_name IN ARRAY table_list
    LOOP
        -- Check if table exists before granting permissions
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
            EXECUTE format('GRANT SELECT ON public.%I TO anon', table_name);
        END IF;
    END LOOP;
END $$;

-- ==============================================
-- 6. FINAL SECURITY VERIFICATION
-- ==============================================

SELECT 'RLS Security Fix Complete!' as status;

-- Show tables that still need attention (should be empty after this script)
SELECT 
    'Tables still missing RLS:' as warning,
    string_agg(tablename, ', ') as table_names
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = false
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
    AND tablename NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns');

-- Show policy count per table
SELECT 
    schemaname,
    tablename,
    COUNT(policyname) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;