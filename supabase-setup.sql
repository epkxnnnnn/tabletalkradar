-- TableTalk Radar Database Setup for Supabase
-- Run this SQL in your Supabase SQL editor

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT,
  email TEXT,
  company_name TEXT,
  role TEXT,
  avatar_url TEXT,
  PRIMARY KEY (id)
);

-- Enable Row Level Security for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Clients table  
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_name TEXT NOT NULL,
  website TEXT,
  address TEXT,
  phone TEXT,
  category TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active'
);

-- Enable Row Level Security for clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own clients" ON clients
  FOR DELETE USING (auth.uid() = owner_id);

-- Audits table
CREATE TABLE IF NOT EXISTS audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  website TEXT,
  category TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  audit_data JSONB NOT NULL,
  status TEXT DEFAULT 'completed'
);

-- Enable Row Level Security for audits
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- Audits policies - More permissive for demo
CREATE POLICY "Anyone can view audits" ON audits
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert audits" ON audits
  FOR INSERT WITH CHECK (true);

-- For production, use these more secure policies instead:
-- CREATE POLICY "Users can view audits for their clients" ON audits
--   FOR SELECT USING (
--     client_id IN (
--       SELECT id FROM clients WHERE owner_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Users can insert audits for their clients" ON audits
--   FOR INSERT WITH CHECK (
--     client_id IN (
--       SELECT id FROM clients WHERE owner_id = auth.uid()
--     )
--   );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_owner_id ON clients(owner_id);
CREATE INDEX IF NOT EXISTS idx_audits_client_id ON audits(client_id);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audits_business_name ON audits(business_name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON audits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();