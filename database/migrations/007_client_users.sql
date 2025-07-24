-- Create client user system for multi-tenant dashboard access
-- Run this in your Supabase SQL Editor

-- Create client_users table for client access to their own dashboards
CREATE TABLE IF NOT EXISTS client_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Access control
    role VARCHAR(20) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'editor', 'viewer')),
    permissions JSONB DEFAULT '{}', -- Custom permissions for this client
    
    -- Status and settings
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    dashboard_preferences JSONB DEFAULT '{}', -- Store dashboard customizations
    
    -- Metadata
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure one user can only have one role per client
    UNIQUE(user_id, client_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_users_user_id ON client_users(user_id);
CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_users_agency_id ON client_users(agency_id);
CREATE INDEX IF NOT EXISTS idx_client_users_role ON client_users(role);
CREATE INDEX IF NOT EXISTS idx_client_users_active ON client_users(is_active);

-- Create client_sessions table to track client dashboard usage
CREATE TABLE IF NOT EXISTS client_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Session data
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    session_end TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    features_used JSONB DEFAULT '[]', -- Track which features they use
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_client_sessions_client_user_id ON client_sessions(client_user_id);
CREATE INDEX IF NOT EXISTS idx_client_sessions_client_id ON client_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_sessions_start ON client_sessions(session_start);

-- Update social_media_posts table to include client_user tracking
ALTER TABLE social_media_posts 
ADD COLUMN IF NOT EXISTS created_by_client_user UUID REFERENCES client_users(id),
ADD COLUMN IF NOT EXISTS updated_by_client_user UUID REFERENCES client_users(id);

-- Update reviews table to include client_user tracking  
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS responded_by_client_user UUID REFERENCES client_users(id);

-- Create client_dashboard_widgets table for customizable dashboards
CREATE TABLE IF NOT EXISTS client_dashboard_widgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    client_user_id UUID REFERENCES client_users(id) ON DELETE SET NULL,
    
    -- Widget configuration
    widget_type VARCHAR(50) NOT NULL, -- calendar, social_posts, reviews, analytics, etc.
    widget_title VARCHAR(200),
    widget_config JSONB DEFAULT '{}', -- Widget-specific configuration
    
    -- Layout
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 1,
    height INTEGER DEFAULT 1,
    
    -- Status
    is_visible BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE, -- System default widgets
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_client_widgets_client_id ON client_dashboard_widgets(client_id);
CREATE INDEX IF NOT EXISTS idx_client_widgets_user_id ON client_dashboard_widgets(client_user_id);
CREATE INDEX IF NOT EXISTS idx_client_widgets_type ON client_dashboard_widgets(widget_type);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_client_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_client_users_updated_at ON client_users;
CREATE TRIGGER trigger_update_client_users_updated_at
    BEFORE UPDATE ON client_users
    FOR EACH ROW
    EXECUTE FUNCTION update_client_users_updated_at();

CREATE OR REPLACE FUNCTION update_client_widgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_client_widgets_updated_at ON client_dashboard_widgets;
CREATE TRIGGER trigger_update_client_widgets_updated_at
    BEFORE UPDATE ON client_dashboard_widgets
    FOR EACH ROW
    EXECUTE FUNCTION update_client_widgets_updated_at();

-- Row Level Security (RLS) policies for client access control

-- Enable RLS on client_users
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own client_user records
CREATE POLICY "Users can view own client access" ON client_users
    FOR SELECT USING (user_id = auth.uid());

-- Policy: Agency owners can see all client_users for their clients
CREATE POLICY "Agency owners can view client users" ON client_users
    FOR SELECT USING (
        agency_id IN (
            SELECT id FROM agencies 
            WHERE owner_id = auth.uid()
        )
    );

-- Enable RLS on social_media_posts with client access
CREATE POLICY "Client users can view own posts" ON social_media_posts
    FOR SELECT USING (
        client_id IN (
            SELECT client_id FROM client_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Client users can create own posts" ON social_media_posts
    FOR INSERT WITH CHECK (
        client_id IN (
            SELECT client_id FROM client_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Client users can update own posts" ON social_media_posts
    FOR UPDATE USING (
        client_id IN (
            SELECT client_id FROM client_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Enable RLS on reviews with client access
CREATE POLICY "Client users can view own reviews" ON reviews
    FOR SELECT USING (
        client_id IN (
            SELECT client_id FROM client_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Client users can respond to own reviews" ON reviews
    FOR UPDATE USING (
        client_id IN (
            SELECT client_id FROM client_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Enable RLS on client_dashboard_widgets
ALTER TABLE client_dashboard_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client users can manage own widgets" ON client_dashboard_widgets
    FOR ALL USING (
        client_id IN (
            SELECT client_id FROM client_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

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

-- Function to invite client user and create access
CREATE OR REPLACE FUNCTION invite_client_user(
    p_client_id UUID,
    p_email TEXT,
    p_role VARCHAR(20) DEFAULT 'owner',
    p_invited_by UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_client_user_id UUID;
    v_agency_id UUID;
BEGIN
    -- Get agency_id for the client
    SELECT agency_id INTO v_agency_id FROM clients WHERE id = p_client_id;
    
    -- Check if user exists in auth.users (they might need to sign up first)
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    
    IF v_user_id IS NOT NULL THEN
        -- Create client_user record
        INSERT INTO client_users (user_id, client_id, agency_id, role, invited_by)
        VALUES (v_user_id, p_client_id, v_agency_id, p_role, p_invited_by)
        RETURNING id INTO v_client_user_id;
        
        -- Create default widgets for this client
        PERFORM create_default_client_widgets(p_client_id);
        
        RETURN v_client_user_id;
    ELSE
        -- Return null if user doesn't exist (they need to sign up first)
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE client_users IS 'Multi-tenant access control for clients to access their own dashboards';
COMMENT ON TABLE client_sessions IS 'Track client dashboard usage and feature adoption';
COMMENT ON TABLE client_dashboard_widgets IS 'Customizable dashboard widgets for each client';
COMMENT ON COLUMN client_users.role IS 'Client access role: owner, manager, editor, viewer';
COMMENT ON COLUMN client_users.permissions IS 'JSON object with custom permissions';
COMMENT ON COLUMN client_users.dashboard_preferences IS 'JSON object with user dashboard customizations';

-- Insert sample client user for testing (assuming you have clients)
-- This creates a client dashboard access for the first client
INSERT INTO client_users (user_id, client_id, agency_id, role)
SELECT 
    a.owner_id as user_id,
    c.id as client_id,
    c.agency_id,
    'owner' as role
FROM agencies a
JOIN clients c ON c.agency_id = a.id
WHERE a.owner_id = auth.uid()
LIMIT 1;

-- Create default widgets for the test client (only if client exists)
DO $$
DECLARE
    v_client_id UUID;
BEGIN
    SELECT c.id INTO v_client_id 
    FROM agencies a
    JOIN clients c ON c.agency_id = a.id
    WHERE a.owner_id = auth.uid()
    LIMIT 1;
    
    IF v_client_id IS NOT NULL THEN
        PERFORM create_default_client_widgets(v_client_id);
    END IF;
END $$;

-- Verify setup
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

-- Show default widgets created
SELECT 
    cdw.widget_type,
    cdw.widget_title,
    cdw.position_x,
    cdw.position_y,
    c.business_name
FROM client_dashboard_widgets cdw
JOIN clients c ON cdw.client_id = c.id
JOIN client_users cu ON cu.client_id = c.id
WHERE cu.user_id = auth.uid()
ORDER BY cdw.position_y, cdw.position_x;