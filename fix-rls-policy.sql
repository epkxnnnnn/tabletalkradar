-- Fix infinite recursion in agencies table RLS policy
-- This happens when a policy references itself indirectly

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their agencies" ON agencies;
DROP POLICY IF EXISTS "Users can view agencies they belong to" ON agencies;
DROP POLICY IF EXISTS "Agency owners can view agencies" ON agencies;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view their own agencies" ON agencies
    FOR SELECT 
    USING (owner_id = auth.uid());

CREATE POLICY "Users can update their own agencies" ON agencies
    FOR UPDATE 
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own agencies" ON agencies
    FOR DELETE 
    USING (owner_id = auth.uid());

CREATE POLICY "Users can create agencies" ON agencies
    FOR INSERT 
    WITH CHECK (owner_id = auth.uid());

-- Fix clients table policies to avoid recursion
DROP POLICY IF EXISTS "Users can view their clients" ON clients;
DROP POLICY IF EXISTS "Agency members can view clients" ON clients;

CREATE POLICY "Super admin can view all clients" ON clients
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'superadmin'
        )
    );

CREATE POLICY "Users can view their own clients" ON clients
    FOR SELECT 
    USING (
        owner_id = auth.uid() 
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'superadmin'
        )
    );

CREATE POLICY "Users can manage their own clients" ON clients
    FOR ALL
    USING (
        owner_id = auth.uid() 
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'superadmin'
        )
    );