# Complete Google Business Profile Setup for 7 Clients

## Quick Manual Setup (No Environment Required)

Since the interactive setup requires environment variables, here's a complete manual setup guide to link your 7 clients to Google Business Profile.

## Step 1: Environment Setup

Create `.env.local` file with your actual values:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Step 2: Create Client Locations

Run these SQL commands in your Supabase SQL Editor:

```sql
-- First, get your agency ID
SELECT id FROM agencies LIMIT 1;

-- Then create locations for your 7 clients
INSERT INTO client_locations (
  client_id,
  agency_id,
  location_name,
  business_name,
  address,
  city,
  state,
  zip_code,
  phone,
  website,
  is_primary_location,
  is_active,
  display_order
) VALUES 
  -- Replace 'your-agency-id' with actual agency ID from above query
  ('client-1-uuid', 'your-agency-id', 'Main Location', 'Business 1 Name', '123 Main St', 'City1', 'State1', '12345', '555-0001', 'https://business1.com', true, true, 1),
  ('client-2-uuid', 'your-agency-id', 'Main Location', 'Business 2 Name', '456 Oak Ave', 'City2', 'State2', '12346', '555-0002', 'https://business2.com', true, true, 2),
  ('client-3-uuid', 'your-agency-id', 'Main Location', 'Business 3 Name', '789 Pine Rd', 'City3', 'State3', '12347', '555-0003', 'https://business3.com', true, true, 3),
  ('client-4-uuid', 'your-agency-id', 'Main Location', 'Business 4 Name', '321 Elm St', 'City4', 'State4', '12348', '555-0004', 'https://business4.com', true, true, 4),
  ('client-5-uuid', 'your-agency-id', 'Main Location', 'Business 5 Name', '654 Maple Dr', 'City5', 'State5', '12349', '555-0005', 'https://business5.com', true, true, 5),
  ('client-6-uuid', 'your-agency-id', 'Main Location', 'Business 6 Name', '987 Cedar Ln', 'City6', 'State6', '12350', '555-0006', 'https://business6.com', true, true, 6),
  ('client-7-uuid', 'your-agency-id', 'Main Location', 'Business 7 Name', '147 Birch Ct', 'City7', 'State7', '12351', '555-0007', 'https://business7.com', true, true, 7);
```

## Step 3: Get Your Client IDs

```sql
-- Get your actual client IDs
SELECT id, business_name FROM clients ORDER BY business_name;
```

## Step 4: Link Each Client to Google Business

For each client, follow these steps:

### 4.1 Start OAuth Flow
Visit: `http://localhost:3000/api/v1/google-business/auth?client_id=CLIENT_ID`

### 4.2 After OAuth Completion
Update the client location with Google Account ID:

```sql
-- Replace with actual values from OAuth flow
UPDATE client_locations 
SET google_account_id = 'accounts/123456789/locations/987654321',
    google_business_profile_url = 'https://business.google.com/...',
    gbp_data_last_updated = NOW()
WHERE client_id = 'actual-client-id-1';

-- Repeat for all 7 clients
```

## Step 5: Manual Data Sync Script

Create `scripts/manual-gmb-sync.ts`:

```typescript
import { googleBusinessSyncService } from '../src/lib/google-business-sync'

async function syncAllClients() {
  console.log('🔄 Starting Google Business data sync...')
  
  try {
    const result = await googleBusinessSyncService.syncAllClients()
    console.log('✅ Sync completed:', result)
  } catch (error) {
    console.error('❌ Sync failed:', error)
  }
}

syncAllClients()
```

Run with:
```bash
npx tsx scripts/manual-gmb-sync.ts
```

## Step 6: Verify Setup

Check your data:

```sql
-- Verify client locations
SELECT 
  cl.business_name,
  cl.google_account_id,
  cl.google_rating,
  cl.google_review_count,
  cl.gbp_data_last_updated
FROM client_locations cl
JOIN clients c ON cl.client_id = c.id
ORDER BY cl.business_name;

-- Check reviews
SELECT 
  r.reviewer_name,
  r.rating,
  r.review_text,
  r.review_date,
  c.business_name
FROM reviews r
JOIN client_locations cl ON r.location_id = cl.id
JOIN clients c ON cl.client_id = c.id
WHERE r.platform = 'google'
ORDER BY r.review_date DESC;
```

## Step 7: Automated Daily Sync

Create a Supabase Edge Function for daily sync:

```bash
# Create scheduled sync function
mkdir -p supabase/functions/scheduled-gmb-sync
```

Create `supabase/functions/scheduled-gmb-sync/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  try {
    // Get all clients with Google Business integrations
    const { data: integrations } = await supabase
      .from('integrations')
      .select('client_id, provider_account_id, access_token')
      .eq('provider', 'google_business')
      .eq('is_connected', true)

    const results = []
    
    for (const integration of integrations || []) {
      try {
        // Get client locations
        const { data: locations } = await supabase
          .from('client_locations')
          .select('id, google_account_id')
          .eq('client_id', integration.client_id)

        for (const location of locations || []) {
          if (location.google_account_id) {
            // Here you would call your Google Business API
            // For now, we'll just update the sync timestamp
            await supabase
              .from('client_locations')
              .update({ gbp_data_last_updated: new Date().toISOString() })
              .eq('id', location.id)
            
            results.push({ clientId: integration.client_id, locationId: location.id, status: 'synced' })
          }
        }
      } catch (error) {
        results.push({ clientId: integration.client_id, error: error.message })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
```

## Step 8: Quick Test Commands

```bash
# Test database connection
npm run db:query "client_locations"

# Test sync (after environment setup)
npm run sync:gmb-data

# Check if clients exist
npm run db:query "clients"
```

## Troubleshooting

### Common Issues:

1. **"supabaseUrl is required"** - Set your environment variables
2. **"No clients found"** - Create clients first in the dashboard
3. **"No Google Business locations"** - Ensure Google Business Profile exists
4. **OAuth issues** - Check Google Cloud Console settings

### Quick Fix Commands:

```bash
# Check current setup
npx tsx -e "import { supabaseAdmin } from './src/lib/supabase-admin'; (supabaseAdmin() as any).from('clients').select('id, business_name').then(({data}) => console.log(data)).catch(console.error)"

# Check client locations
npx tsx -e "import { supabaseAdmin } from './src/lib/supabase-admin'; (supabaseAdmin() as any).from('client_locations').select('*, clients(business_name)').then(({data}) => console.log(data)).catch(console.error)"
```

## Next Steps

1. **Set up environment variables** (Step 1)
2. **Create client locations** (Step 2)
3. **Link each client** (Steps 4.1-4.2)
4. **Test the sync** (Step 5)
5. **Set up automated sync** (Step 7)

## Support

For immediate help:
1. Check the `GOOGLE_BUSINESS_SETUP.md` file
2. Verify your Supabase project URL and keys
3. Ensure Google Business Profile API is enabled in Google Cloud Console
4. Check the logs in your Supabase dashboard
