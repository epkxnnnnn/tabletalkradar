-- TableTalk Radar Database Setup for Supabase (Safe Version)
-- This script checks for existing tables and only creates what's missing

-- First, let's drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;
DROP POLICY IF EXISTS "Anyone can view audits" ON audits;
DROP POLICY IF EXISTS "Anyone can insert audits" ON audits;

-- Create audits table (the main one we need for TableTalk Radar)
CREATE TABLE IF NOT EXISTS audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  client_id UUID, -- Removing the foreign key constraint for now
  business_name TEXT NOT NULL,
  website TEXT,
  category TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  audit_data JSONB NOT NULL,
  status TEXT DEFAULT 'completed'
);

-- Enable Row Level Security for audits
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for demo/testing
CREATE POLICY "Anyone can view audits" ON audits
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert audits" ON audits
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audits_business_name ON audits(business_name);

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for audits updated_at (if it doesn't exist)
DROP TRIGGER IF EXISTS update_audits_updated_at ON audits;
CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON audits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add policies for existing tables if they exist
DO $$
BEGIN
    -- Check if profiles table exists and add policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own profile" ON profiles
            FOR SELECT USING (auth.uid() = id);
        
        CREATE POLICY "Users can update own profile" ON profiles
            FOR UPDATE USING (auth.uid() = id);
    END IF;

    -- Check if clients table exists and add policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
        ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own clients" ON clients
            FOR SELECT USING (auth.uid() = owner_id);
        
        CREATE POLICY "Users can insert own clients" ON clients
            FOR INSERT WITH CHECK (auth.uid() = owner_id);
        
        CREATE POLICY "Users can update own clients" ON clients
            FOR UPDATE USING (auth.uid() = owner_id);
        
        CREATE POLICY "Users can delete own clients" ON clients
            FOR DELETE USING (auth.uid() = owner_id);
    END IF;
END $$;

-- Success message
SELECT 'TableTalk Radar database setup completed successfully!' as message;