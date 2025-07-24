-- Step 1: Create the basic tables first
-- Run this in your Supabase SQL Editor

-- Create client_users table for client access to their own dashboards
CREATE TABLE IF NOT EXISTS client_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Access control
    role VARCHAR(20) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'editor', 'viewer')),
    permissions JSONB DEFAULT '{}',
    
    -- Status and settings
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    dashboard_preferences JSONB DEFAULT '{}',
    
    -- Metadata
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure one user can only have one role per client
    UNIQUE(user_id, client_id)
);

-- Create client_dashboard_widgets table for customizable dashboards
CREATE TABLE IF NOT EXISTS client_dashboard_widgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    client_user_id UUID REFERENCES client_users(id) ON DELETE SET NULL,
    
    -- Widget configuration
    widget_type VARCHAR(50) NOT NULL,
    widget_title VARCHAR(200),
    widget_config JSONB DEFAULT '{}',
    
    -- Layout
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 1,
    height INTEGER DEFAULT 1,
    
    -- Status
    is_visible BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_users_user_id ON client_users(user_id);
CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_widgets_client_id ON client_dashboard_widgets(client_id);