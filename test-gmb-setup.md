# Testing Google My Business Setup

## 1. Environment Variables Required
Add these to your `.env.local` file:

```bash
# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-business/auth/callback

# AI API Keys (for content generation)
OPENAI_API_KEY=your_openai_key
PERPLEXITY_API_KEY=your_perplexity_key
KIMI_API_KEY=your_kimi_key
MOONSHOT_API_KEY=your_moonshot_key
```

## 2. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable these APIs:
   - Google My Business API
   - Google My Business Management API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/google-business/auth/callback`
5. Copy Client ID and Client Secret to `.env.local`

## 3. Testing Workflow

### Step 1: Access Dashboard
```
http://localhost:3000/dashboard
```
- Should see all 7 clients
- Should see "Google Business Manager" tab

### Step 2: Connect Google Account
1. Click "Google Business Manager" tab
2. Click "Connect Google" for a client
3. Should redirect to Google OAuth
4. After authorization, redirects back to dashboard
5. Client should show as "Connected"

### Step 3: Test GMB Functions
- **Reviews**: Fetch and reply to reviews
- **Posts**: Create new GMB posts
- **Q&A**: Answer customer questions

## 4. Verification Queries

```sql
-- Check if clients have Google tokens
SELECT 
  business_name,
  google_account_id,
  google_refresh_token IS NOT NULL as has_token,
  google_business_verified
FROM clients 
WHERE owner_id = 'bbc06d26-ac73-4b38-8363-1e1c9fdecb68';

-- Check client locations
SELECT 
  cl.business_name,
  cl.city,
  cl.state,
  c.google_account_id
FROM client_locations cl
JOIN clients c ON cl.client_id = c.id
WHERE c.owner_id = 'bbc06d26-ac73-4b38-8363-1e1c9fdecb68';
```

## 5. Common Issues & Solutions

### Issue: "Connect Google" not working
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in `.env.local`
- Verify redirect URI matches in Google Console

### Issue: Reviews not loading
- Ensure client has google_refresh_token
- Check Supabase Edge Function logs
- Verify GMB API is enabled in Google Console

### Issue: Can't see all clients
- Verify you're logged in as Super Admin (kphstk@gmail.com)
- Check that profile.role = 'superadmin' in profiles table