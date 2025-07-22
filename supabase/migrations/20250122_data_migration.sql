-- Data Migration Script for Multi-Tenant Agency Management
-- This script migrates existing single-business data to the new multi-tenant structure

-- ============================================================================
-- 1. CREATE DEFAULT AGENCIES for existing business owners
-- ============================================================================

-- Create agencies for existing business owners and agency users
INSERT INTO agencies (name, slug, owner_id, subscription_plan, subscription_status)
SELECT 
    COALESCE(NULLIF(TRIM(p.company_name), ''), 'My Agency') as name,
    generate_agency_slug(COALESCE(NULLIF(TRIM(p.company_name), ''), p.full_name || '-agency', 'agency-' || SUBSTRING(p.id::text, 1, 8))) as slug,
    p.id as owner_id,
    CASE 
        WHEN p.role = 'superadmin' THEN 'enterprise'
        WHEN p.role = 'agency' THEN 'professional'
        ELSE 'starter'
    END as subscription_plan,
    'active' as subscription_status
FROM profiles p
WHERE p.role IN ('business_owner', 'agency', 'superadmin')
  AND NOT EXISTS (
    SELECT 1 FROM agencies a WHERE a.owner_id = p.id
  );

-- ============================================================================
-- 2. UPDATE PROFILES with current agency context
-- ============================================================================

-- Set current_agency_id for users to their owned agency
UPDATE profiles 
SET current_agency_id = (
    SELECT a.id 
    FROM agencies a 
    WHERE a.owner_id = profiles.id 
    LIMIT 1
),
agency_role = CASE 
    WHEN role = 'superadmin' THEN 'agency_owner'
    WHEN role = 'agency' THEN 'agency_owner'
    WHEN role = 'business_owner' THEN 'agency_owner'
    ELSE 'analyst'
END
WHERE role IN ('business_owner', 'agency', 'superadmin');

-- ============================================================================
-- 3. MIGRATE EXISTING CLIENTS to agencies
-- ============================================================================

-- Update clients to be associated with their owner's agency
UPDATE clients 
SET agency_id = (
    SELECT a.id 
    FROM agencies a 
    WHERE a.owner_id = clients.user_id
)
WHERE agency_id IS NULL 
  AND user_id IS NOT NULL;

-- Create client assignments for existing clients
INSERT INTO client_assignments (client_id, user_id, agency_id, role, assigned_by, assigned_at)
SELECT 
    c.id as client_id,
    c.user_id,
    c.agency_id,
    'primary' as role,
    c.user_id as assigned_by, -- Self-assigned initially
    c.created_at as assigned_at
FROM clients c
WHERE c.agency_id IS NOT NULL 
  AND c.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM client_assignments ca 
    WHERE ca.client_id = c.id AND ca.user_id = c.user_id
  );

-- ============================================================================
-- 4. MIGRATE EXISTING AUDITS to agency context
-- ============================================================================

-- Update audits to be associated with the client's agency
UPDATE audits 
SET agency_id = (
    SELECT c.agency_id 
    FROM clients c 
    WHERE c.id = audits.client_id
)
WHERE agency_id IS NULL 
  AND client_id IS NOT NULL;

-- For audits without client_id, associate with user's agency
UPDATE audits 
SET agency_id = (
    SELECT a.id 
    FROM agencies a 
    WHERE a.owner_id = audits.user_id
)
WHERE agency_id IS NULL 
  AND user_id IS NOT NULL;

-- ============================================================================
-- 5. MIGRATE EXISTING REPORTS to agency context
-- ============================================================================

-- Update reports to be associated with their audit's agency
UPDATE reports 
SET agency_id = (
    SELECT aud.agency_id 
    FROM audits aud 
    WHERE aud.id = reports.audit_id
)
WHERE agency_id IS NULL 
  AND audit_id IS NOT NULL;

-- For reports without audit_id, associate with user's agency
UPDATE reports 
SET agency_id = (
    SELECT a.id 
    FROM agencies a 
    WHERE a.owner_id = reports.user_id
)
WHERE agency_id IS NULL 
  AND user_id IS NOT NULL;

-- ============================================================================
-- 6. MIGRATE EXISTING ACTION ITEMS to agency context
-- ============================================================================

-- Update action items to be associated with their audit's agency
UPDATE action_items 
SET agency_id = (
    SELECT aud.agency_id 
    FROM audits aud 
    WHERE aud.id = action_items.audit_id
)
WHERE agency_id IS NULL 
  AND audit_id IS NOT NULL;

-- For action items without audit_id, associate with user's agency
UPDATE action_items 
SET agency_id = (
    SELECT a.id 
    FROM agencies a 
    WHERE a.owner_id = action_items.user_id
)
WHERE agency_id IS NULL 
  AND user_id IS NOT NULL;

-- ============================================================================
-- 7. MIGRATE EXISTING NOTIFICATIONS to agency context (if needed)
-- ============================================================================

-- Update notifications to be associated with user's agency
UPDATE notifications 
SET agency_id = (
    SELECT a.id 
    FROM agencies a 
    WHERE a.owner_id = notifications.user_id
)
WHERE agency_id IS NULL 
  AND user_id IS NOT NULL;

-- ============================================================================
-- 8. CREATE SAMPLE INTELLIGENCE DATA for existing clients
-- ============================================================================

-- Create sample market intelligence entries for migrated clients
INSERT INTO market_intelligence (
    agency_id,
    client_id,
    intelligence_type,
    source,
    title,
    description,
    insights,
    confidence_score,
    industry,
    location
)
SELECT 
    c.agency_id,
    c.id as client_id,
    'market_trend' as intelligence_type,
    'manual' as source,
    'Welcome to Intelligence Tracking' as title,
    'Your agency now has access to AI-powered market intelligence. This sample entry shows how competitor insights, market trends, and opportunities will appear here.' as description,
    jsonb_build_object(
        'sample', true,
        'features', jsonb_build_array(
            'Competitor monitoring',
            'Market trend analysis', 
            'Opportunity detection',
            'Risk assessment'
        ),
        'next_steps', jsonb_build_array(
            'Complete client business analysis',
            'Set up automated monitoring',
            'Configure alert preferences'
        )
    ) as insights,
    1.0 as confidence_score,
    c.industry,
    COALESCE(c.location, 'Not specified')
FROM clients c
WHERE c.agency_id IS NOT NULL
LIMIT 10; -- Limit to first 10 clients to avoid overwhelming

-- ============================================================================
-- 9. CREATE SAMPLE AUTOMATION WORKFLOWS
-- ============================================================================

-- Create sample automation workflows for agencies
INSERT INTO automation_workflows (
    agency_id,
    name,
    description,
    workflow_type,
    triggers,
    actions,
    conditions,
    is_active,
    created_by
)
SELECT 
    a.id as agency_id,
    'Client Performance Monitoring' as name,
    'Automatically monitors client performance metrics and sends alerts when significant changes are detected.' as description,
    'monitoring' as workflow_type,
    jsonb_build_object(
        'schedule', 'daily',
        'conditions', jsonb_build_array(
            'performance_change > 10%',
            'new_competitor_detected',
            'market_opportunity_identified'
        )
    ) as triggers,
    jsonb_build_object(
        'notifications', jsonb_build_array('email', 'dashboard'),
        'reports', jsonb_build_array('performance_summary'),
        'escalation', jsonb_build_object(
            'threshold', 'critical',
            'notify', jsonb_build_array('agency_owner', 'client_manager')
        )
    ) as actions,
    jsonb_build_object(
        'client_tier', jsonb_build_array('standard', 'premium', 'enterprise'),
        'business_hours', true
    ) as conditions,
    false as is_active, -- Start disabled, let users enable
    a.owner_id as created_by
FROM agencies a
WHERE NOT EXISTS (
    SELECT 1 FROM automation_workflows aw WHERE aw.agency_id = a.id
);

-- ============================================================================
-- 10. UPDATE STATISTICS and CLEANUP
-- ============================================================================

-- Update table statistics for better query performance
ANALYZE agencies;
ANALYZE agency_memberships;
ANALYZE client_assignments;
ANALYZE clients;
ANALYZE audits;
ANALYZE reports;
ANALYZE action_items;
ANALYZE market_intelligence;
ANALYZE predictive_analytics;
ANALYZE automation_workflows;
ANALYZE client_communications;

-- ============================================================================
-- 11. VERIFICATION QUERIES (for debugging)
-- ============================================================================

-- These queries can help verify the migration was successful

-- Count of agencies created
-- SELECT COUNT(*) as agencies_created FROM agencies;

-- Count of clients with agency associations
-- SELECT COUNT(*) as clients_with_agencies FROM clients WHERE agency_id IS NOT NULL;

-- Count of audits with agency associations  
-- SELECT COUNT(*) as audits_with_agencies FROM audits WHERE agency_id IS NOT NULL;

-- Count of agency memberships (should equal number of agencies for owners)
-- SELECT COUNT(*) as memberships_created FROM agency_memberships WHERE role = 'owner';

-- Agencies without any clients (might need attention)
-- SELECT a.name, a.id 
-- FROM agencies a 
-- LEFT JOIN clients c ON a.id = c.agency_id 
-- WHERE c.id IS NULL;

-- Users without agency associations (might need attention)  
-- SELECT p.full_name, p.email, p.role
-- FROM profiles p 
-- WHERE p.current_agency_id IS NULL 
--   AND p.role IN ('business_owner', 'agency');

-- ============================================================================
-- 12. POST-MIGRATION NOTIFICATIONS
-- ============================================================================

-- Insert migration completion notification for superadmins
INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    read
)
SELECT 
    p.id as user_id,
    'system' as type,
    'Multi-Tenant Migration Complete' as title,
    'Your system has been successfully upgraded to support multi-client agency management. Check your dashboard for new features.' as message,
    jsonb_build_object(
        'migration_date', NOW(),
        'new_features', jsonb_build_array(
            'Multi-client management',
            'Team collaboration',
            'Automated workflows',
            'Market intelligence',
            'Predictive analytics'
        )
    ) as data,
    false as read
FROM profiles p
WHERE p.role = 'superadmin';