-- Safe Data Migration Script
-- Migrates existing data to new multi-tenant structure

-- Step 1: Create a default agency for existing users (if not already exists)
INSERT INTO agencies (
    name,
    description,
    subscription_plan,
    owner_id,
    status,
    settings
)
SELECT 
    COALESCE(
        (SELECT business_name FROM profiles WHERE id = auth.users.id LIMIT 1),
        'My Agency'
    ) as name,
    'Migrated from single-tenant setup' as description,
    'professional' as subscription_plan,
    auth.users.id as owner_id,
    'active' as status,
    jsonb_build_object(
        'migrated_from_single_tenant', true,
        'migration_date', NOW()
    ) as settings
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM agencies WHERE owner_id = auth.users.id
)
AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.users.id
);

-- Step 2: Create agency memberships for agency owners (if not already exists)
INSERT INTO agency_memberships (
    agency_id,
    user_id,
    role,
    status,
    joined_at
)
SELECT 
    a.id as agency_id,
    a.owner_id as user_id,
    'owner' as role,
    'active' as status,
    NOW() as joined_at
FROM agencies a
WHERE NOT EXISTS (
    SELECT 1 FROM agency_memberships 
    WHERE agency_id = a.id AND user_id = a.owner_id
);

-- Step 3: Migrate existing client data (if clients table doesn't have agency_id populated)
-- First, add agency_id to clients if it doesn't exist
ALTER TABLE clients ADD COLUMN IF NOT EXISTS agency_id UUID;

-- Update clients to belong to the user's agency (for clients without agency_id)
UPDATE clients 
SET agency_id = (
    SELECT a.id 
    FROM agencies a 
    WHERE a.owner_id = clients.user_id
    LIMIT 1
)
WHERE agency_id IS NULL 
AND user_id IS NOT NULL
AND EXISTS (
    SELECT 1 FROM agencies WHERE owner_id = clients.user_id
);

-- For orphaned clients (no user_id or user doesn't have agency), assign to first agency
UPDATE clients 
SET agency_id = (
    SELECT id FROM agencies ORDER BY created_at ASC LIMIT 1
)
WHERE agency_id IS NULL
AND EXISTS (SELECT 1 FROM agencies);

-- Remove user_id column from clients if it exists (no longer needed)
-- ALTER TABLE clients DROP COLUMN IF EXISTS user_id;

-- Step 4: Update existing audits to have agency_id (if not already set)
UPDATE audits 
SET agency_id = (
    SELECT c.agency_id 
    FROM clients c 
    WHERE c.id = audits.client_id
    LIMIT 1
)
WHERE agency_id IS NULL 
AND client_id IS NOT NULL
AND EXISTS (
    SELECT 1 FROM clients WHERE id = audits.client_id AND agency_id IS NOT NULL
);

-- For audits without client_id, assign to first agency
UPDATE audits 
SET agency_id = (
    SELECT id FROM agencies ORDER BY created_at ASC LIMIT 1
)
WHERE agency_id IS NULL
AND EXISTS (SELECT 1 FROM agencies);

-- Step 5: Create default client entries for existing audits that don't have clients
INSERT INTO clients (
    agency_id,
    business_name,
    status,
    service_tier,
    audit_frequency
)
SELECT DISTINCT
    a.agency_id,
    'Migrated Client - ' || a.id::text,
    'active',
    'standard',
    'monthly'
FROM audits a
WHERE a.client_id IS NULL
AND a.agency_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.agency_id = a.agency_id 
    AND c.business_name = 'Migrated Client - ' || a.id::text
);

-- Update audits to reference the migrated clients
UPDATE audits 
SET client_id = (
    SELECT c.id 
    FROM clients c 
    WHERE c.agency_id = audits.agency_id 
    AND c.business_name = 'Migrated Client - ' || audits.id::text
    LIMIT 1
)
WHERE client_id IS NULL 
AND agency_id IS NOT NULL;

-- Step 6: Verify data integrity
-- Count records to verify migration
DO $$
DECLARE
    agency_count INTEGER;
    membership_count INTEGER;
    client_count INTEGER;
    audit_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO agency_count FROM agencies;
    SELECT COUNT(*) INTO membership_count FROM agency_memberships;
    SELECT COUNT(*) INTO client_count FROM clients WHERE agency_id IS NOT NULL;
    SELECT COUNT(*) INTO audit_count FROM audits WHERE agency_id IS NOT NULL;
    
    RAISE NOTICE 'Migration completed successfully:';
    RAISE NOTICE 'Agencies: %', agency_count;
    RAISE NOTICE 'Memberships: %', membership_count;
    RAISE NOTICE 'Clients with agency: %', client_count;
    RAISE NOTICE 'Audits with agency: %', audit_count;
    
    -- Check for any orphaned records
    IF EXISTS (SELECT 1 FROM clients WHERE agency_id IS NULL) THEN
        RAISE WARNING 'Some clients still do not have agency_id assigned';
    END IF;
    
    IF EXISTS (SELECT 1 FROM audits WHERE agency_id IS NULL) THEN
        RAISE WARNING 'Some audits still do not have agency_id assigned';
    END IF;
END $$;

-- Step 7: Update client health scores and next audit dates
UPDATE clients 
SET 
    health_score = CASE 
        WHEN EXISTS (
            SELECT 1 FROM audits 
            WHERE client_id = clients.id 
            AND created_at > NOW() - INTERVAL '30 days'
        ) THEN 85
        ELSE 65
    END,
    next_audit_due = CASE 
        WHEN audit_frequency = 'weekly' THEN NOW() + INTERVAL '7 days'
        WHEN audit_frequency = 'bi-weekly' THEN NOW() + INTERVAL '14 days'
        WHEN audit_frequency = 'quarterly' THEN NOW() + INTERVAL '3 months'
        ELSE NOW() + INTERVAL '1 month'
    END,
    last_audit_at = (
        SELECT MAX(created_at) 
        FROM audits 
        WHERE client_id = clients.id
    )
WHERE health_score IS NULL;

-- Step 8: Create sample data for testing (only if no real data exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM clients WHERE business_name != 'Migrated Client - ' || id::text LIMIT 1) THEN
        -- Create a sample client for each agency
        INSERT INTO clients (
            agency_id,
            business_name,
            contact_name,
            email,
            industry,
            business_type,
            location,
            status,
            service_tier,
            audit_frequency,
            health_score
        )
        SELECT 
            a.id,
            'Sample Restaurant',
            'John Smith',
            'john@samplerestaurant.com',
            'Food & Beverage',
            'Restaurant',
            'New York, NY',
            'active',
            'standard',
            'monthly',
            78
        FROM agencies a
        WHERE NOT EXISTS (
            SELECT 1 FROM clients 
            WHERE agency_id = a.id 
            AND business_name NOT LIKE 'Migrated Client -%'
        );
        
        RAISE NOTICE 'Sample clients created for agencies without real client data';
    END IF;
END $$;