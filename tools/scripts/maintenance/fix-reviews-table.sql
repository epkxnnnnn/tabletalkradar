-- Fix reviews table structure
-- Run this SQL in your Supabase SQL editor

-- First, check if reviews table has location_id column, if not add it
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    -- Add location_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'location_id') THEN
      ALTER TABLE reviews ADD COLUMN location_id UUID REFERENCES client_locations(id) ON DELETE CASCADE;
    END IF;
    
    -- Add client_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'client_id') THEN
      ALTER TABLE reviews ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
    
    -- Add other columns that might be missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'platform') THEN
      ALTER TABLE reviews ADD COLUMN platform TEXT DEFAULT 'google' CHECK (platform IN ('google', 'yelp', 'facebook'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'external_review_id') THEN
      ALTER TABLE reviews ADD COLUMN external_review_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'reviewer_name') THEN
      ALTER TABLE reviews ADD COLUMN reviewer_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'rating') THEN
      ALTER TABLE reviews ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'review_text') THEN
      ALTER TABLE reviews ADD COLUMN review_text TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'review_date') THEN
      ALTER TABLE reviews ADD COLUMN review_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'response_status') THEN
      ALTER TABLE reviews ADD COLUMN response_status TEXT DEFAULT 'pending' CHECK (response_status IN ('pending', 'responded', 'ignored'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'response_text') THEN
      ALTER TABLE reviews ADD COLUMN response_text TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'response_date') THEN
      ALTER TABLE reviews ADD COLUMN response_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'sentiment') THEN
      ALTER TABLE reviews ADD COLUMN sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'ai_suggested_reply') THEN
      ALTER TABLE reviews ADD COLUMN ai_suggested_reply TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'google_reply_data') THEN
      ALTER TABLE reviews ADD COLUMN google_reply_data JSONB;
    END IF;
    
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'reviews' 
                   AND constraint_type = 'UNIQUE' 
                   AND constraint_name LIKE '%external_review_id%platform%') THEN
      ALTER TABLE reviews ADD CONSTRAINT reviews_external_review_id_platform_key UNIQUE(external_review_id, platform);
    END IF;
    
  ELSE
    -- If reviews table doesn't exist, create it
    CREATE TABLE reviews (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      location_id UUID REFERENCES client_locations(id) ON DELETE CASCADE,
      client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
      platform TEXT DEFAULT 'google' CHECK (platform IN ('google', 'yelp', 'facebook')),
      external_review_id TEXT,
      reviewer_name TEXT,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      review_text TEXT,
      review_date TIMESTAMP WITH TIME ZONE,
      response_status TEXT DEFAULT 'pending' CHECK (response_status IN ('pending', 'responded', 'ignored')),
      response_text TEXT,
      response_date TIMESTAMP WITH TIME ZONE,
      sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
      ai_suggested_reply TEXT,
      google_reply_data JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(external_review_id, platform)
    );
  END IF;
END $$;

-- Now create the indexes safely
DO $$ 
BEGIN
  -- Index for reviews table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'location_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reviews_location_id') THEN
      CREATE INDEX idx_reviews_location_id ON reviews(location_id);
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'external_review_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reviews_external_id') THEN
      CREATE INDEX idx_reviews_external_id ON reviews(external_review_id);
    END IF;
  END IF;
END $$;

-- Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;