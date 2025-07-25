# Google Business Profile Integration Setup Guide

This guide will help you link all 7 of your clients to Google Business Profile using the existing TableTalk Radar infrastructure.

## Overview

Your TableTalk Radar system already has:
- ✅ Google OAuth flow implemented
- ✅ Supabase Edge Functions for GMB operations
- ✅ Database schema for multi-location clients
- ✅ Integration storage system

## Quick Setup Steps

### 1. Environment Setup
Ensure your `.env` file has these variables:
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Run the Interactive Setup
```bash
npm run setup:gmb-clients
```

This will:
- List all your clients
- Create client locations
- Guide you through Google OAuth for each client
- Sync initial Google Business data

### 3. Manual Setup (Alternative)

If you prefer manual setup, follow these steps:

#### Step 1: Create Client Locations
```sql
-- Run in Supabase SQL Editor
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
  is_active
) VALUES 
  ('client-1-uuid', 'your-agency-id', 'Main Location', 'Business Name 1', '123 Main St', 'City', 'State', '12345', '555-0001', 'https://business1.com', true, true),
  ('client-2-uuid', 'your-agency-id', 'Main Location', 'Business Name 2', '456 Oak Ave', 'City', 'State', '12345', '555-0002', 'https://business2.com', true, true);
  -- Add 5 more clients...
```

#### Step 2: Initiate Google OAuth
Visit: `http://localhost:3000/api/v1/google-business/auth?client_id=CLIENT_ID`

#### Step 3: Link Google Account
After OAuth completion, update the client location:
```sql
UPDATE client_locations 
SET google_account_id = 'google-account-id-from-oauth',
    gbp_data_last_updated = NOW()
WHERE id = 'location-id';
```

### 4. Automated Data Sync

#### Daily Sync Script
Create a scheduled job to sync Google Business data:

```typescript
// Run this daily via cron or Supabase Edge Functions
import { googleBusinessSyncService } from './src/lib/google-business-sync'

async function dailySync() {
  const result = await googleBusinessSyncService.syncAllClients()
  console.log('Daily sync completed:', result)
}
```

#### Supabase Edge Function for Scheduled Sync
Create: `supabase/functions/scheduled-gmb-sync/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { googleBusinessSyncService } from "../../src/lib/google-business-sync.ts"

serve(async (req) => {
  const { data, error } = await googleBusinessSyncService.syncAllClients()
  
  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 })
  }
  
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

## Data Storage Structure

### Client Locations Table
- `client_locations`: Stores each business location
- Links to Google Business Profile via `google_account_id`
- Stores Google Business metrics (rating, review count, etc.)

### Reviews Table
- `reviews`: Stores all Google reviews
- Linked to locations via `location_id`
- Tracks response status and AI-generated responses

### Integrations Table
- `integrations`: Stores OAuth tokens and Google Business connections
- Links clients to their Google Business accounts

## Troubleshooting

### Common Issues

1. **"No access token found"**
   - Ensure OAuth flow completed successfully
   - Check `integrations` table for the client

2. **"No Google Business locations found"**
   - Verify Google Business Profile exists
   - Check Google Account ID is correct

3. **Database errors**
   - Ensure all migrations are run: `npm run db:migrate`
   - Check RLS policies allow access

### Verification Commands

```bash
# Check client locations
npm run db:query "SELECT * FROM client_locations WHERE client_id = 'your-client-id'"

# Check integrations
npm run db:query "SELECT * FROM integrations WHERE provider = 'google_business'"

# Check reviews
npm run db:query "SELECT * FROM reviews WHERE platform = 'google' ORDER BY review_date DESC"
```

## API Endpoints

- `GET /api/v1/google-business/auth?client_id=ID` - Start OAuth flow
- `GET /api/v1/google-business/auth/callback` - OAuth callback
- `POST /api/v1/google-business/sync` - Manual sync endpoint

## Next Steps

1. Run the setup script for all 7 clients
2. Set up daily automated sync
3. Configure review response automation
4. Set up Google Business insights tracking

## Support

For issues:
1. Check the logs in `logs/google-business-sync.log`
2. Verify environment variables
3. Ensure Google Business Profile API is enabled
4. Check Supabase RLS policies
