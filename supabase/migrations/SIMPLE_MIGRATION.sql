-- SIMPLE STEP-BY-STEP MIGRATION
-- Copy and paste each section one at a time

-- STEP 1: First, let's check what exists and fix the agencies table
DO $$
BEGIN
    -- Add missing columns to agencies table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'status') THEN
        ALTER TABLE agencies ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'subscription_plan') THEN
        ALTER TABLE agencies ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'professional';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'owner_id') THEN
        ALTER TABLE agencies ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    END IF;
    
    RAISE NOTICE 'Step 1 completed: Agency table columns verified/added';
END $$;