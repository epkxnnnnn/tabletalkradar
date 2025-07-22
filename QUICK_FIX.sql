-- QUICK FIX FOR MIGRATION ERRORS
-- Run this step by step in Supabase SQL Editor

-- STEP 1: Fix agencies table structure
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'professional';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Add foreign key constraint for owner_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'agencies_owner_id_fkey'
    ) THEN
        ALTER TABLE agencies ADD CONSTRAINT agencies_owner_id_fkey 
        FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- STEP 2: Create your first agency (if you don't have one)
DO $$
BEGIN
    -- Check if user has an agency, if not create one
    IF NOT EXISTS (SELECT 1 FROM agencies WHERE owner_id = auth.uid()) THEN
        INSERT INTO agencies (name, subscription_plan, owner_id, status, settings)
        VALUES (
            'My Agency',
            'professional', 
            auth.uid(), 
            'active',
            jsonb_build_object('migrated', true, 'created', NOW())
        );
        RAISE NOTICE 'Created new agency for user';
    ELSE
        RAISE NOTICE 'User already has an agency';
    END IF;
END $$;

-- STEP 3: Create agency membership for the owner
INSERT INTO agency_memberships (agency_id, user_id, role, status, joined_at)
SELECT 
    a.id, 
    auth.uid(), 
    'owner', 
    'active', 
    NOW()
FROM agencies a
WHERE a.owner_id = auth.uid()
AND NOT EXISTS (
    SELECT 1 FROM agency_memberships 
    WHERE agency_id = a.id AND user_id = auth.uid()
);

-- STEP 4: Update clients to have agency_id if they don't
ALTER TABLE clients ADD COLUMN IF NOT EXISTS agency_id UUID;

UPDATE clients 
SET agency_id = (
    SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1
)
WHERE agency_id IS NULL;

-- STEP 5: Update audits to have agency_id if they don't  
ALTER TABLE audits ADD COLUMN IF NOT EXISTS agency_id UUID;

UPDATE audits 
SET agency_id = (
    SELECT c.agency_id FROM clients c WHERE c.id = audits.client_id LIMIT 1
)
WHERE agency_id IS NULL AND client_id IS NOT NULL;

-- If audit has no client, assign to user's agency
UPDATE audits 
SET agency_id = (
    SELECT id FROM agencies WHERE owner_id = auth.uid() LIMIT 1
)
WHERE agency_id IS NULL;

-- STEP 6: Enable RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- STEP 7: Create basic RLS policies
DROP POLICY IF EXISTS "Users can view their agencies" ON agencies;
CREATE POLICY "Users can view their agencies" ON agencies
    FOR ALL USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their memberships" ON agency_memberships;
CREATE POLICY "Users can manage their memberships" ON agency_memberships
    FOR ALL USING (
        user_id = auth.uid() OR 
        agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can manage their clients" ON clients;
CREATE POLICY "Users can manage their clients" ON clients
    FOR ALL USING (
        agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can manage their audits" ON audits;
CREATE POLICY "Users can manage their audits" ON audits
    FOR ALL USING (
        agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
    );

-- Final verification
DO $$
DECLARE
    agency_count INTEGER;
    membership_count INTEGER;
    client_count INTEGER;
    audit_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO agency_count FROM agencies WHERE owner_id = auth.uid();
    SELECT COUNT(*) INTO membership_count FROM agency_memberships WHERE user_id = auth.uid();
    SELECT COUNT(*) INTO client_count FROM clients WHERE agency_id IS NOT NULL;
    SELECT COUNT(*) INTO audit_count FROM audits WHERE agency_id IS NOT NULL;
    
    RAISE NOTICE 'Migration verification:';
    RAISE NOTICE 'Your agencies: %', agency_count;
    RAISE NOTICE 'Your memberships: %', membership_count;  
    RAISE NOTICE 'Clients with agency: %', client_count;
    RAISE NOTICE 'Audits with agency: %', audit_count;
    
    IF agency_count > 0 THEN
        RAISE NOTICE 'SUCCESS: You now have agency access!';
    ELSE
        RAISE WARNING 'No agency found - please check your authentication';
    END IF;
END $$;