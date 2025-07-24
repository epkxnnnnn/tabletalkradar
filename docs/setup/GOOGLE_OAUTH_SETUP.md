# Google OAuth & API Setup Guide

This guide shows how to configure Google OAuth and Google Places API for the TableTalk application.

## Google API Credentials Added

The following credentials have been added to your `.env.local` file:

```env
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## Supabase OAuth Configuration

To enable Google OAuth in your Supabase project:

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com/project/pwscfkrouagstuyakfjj
   - Navigate to Authentication > Settings > Auth Providers

2. **Configure Google Provider**
   - Enable the Google provider
   - Add your Google Client ID: `your_google_client_id_here`
   - Add your Google Client Secret: `your_google_client_secret_here`

3. **Set Redirect URLs**
   - For local development: `http://localhost:3000/auth/callback`
   - For production: `https://yourdomain.com/auth/callback`

4. **Authorized JavaScript Origins**
   - Add: `http://localhost:3000` (for development)
   - Add: `https://yourdomain.com` (for production)

## Google Console Configuration

The redirect URL you mentioned (`http://localhost:5678/rest/oauth2-credential/callback`) suggests you might be using n8n or another automation tool. Make sure to also add the Supabase callback URL to your Google Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth 2.0 Client
4. Add these to Authorized redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `https://pwscfkrouagstuyakfjj.supabase.co/auth/v1/callback`
   - `http://localhost:5678/rest/oauth2-credential/callback` (if using n8n)

## Features Implemented

### 1. Google OAuth Authentication
- ✅ Google sign-in button on login page
- ✅ Google sign-up button on registration page  
- ✅ Automatic profile creation for OAuth users
- ✅ OAuth callback handler at `/auth/callback`

### 2. Google Places API Integration
- ✅ Real-time Google review scraping
- ✅ Google My Business data fetching
- ✅ Business profile information sync
- ✅ Review sentiment analysis
- ✅ Automatic Google Place ID storage

### 3. Admin Tools
- ✅ Google Review Scraper component in Admin Panel
- ✅ Test individual locations or bulk scraping
- ✅ Real-time scraping results display

## API Endpoints Created

1. **`/api/reviews/google-scrape`** - Individual location scraping
2. **`/api/reviews/scrape`** - Bulk scraping (updated to use Google API)

## How to Test

1. **OAuth Testing:**
   - Go to `/auth/login`
   - Click "Google" button
   - Sign in with your Google account

2. **Review Scraping:**
   - Log in as super admin (kphstk@gmail.com)
   - Go to Dashboard > Admin Panel
   - Use the Google Review Scraper component
   - Select a location and click "Scrape Selected Location"

## Database Updates

The system now automatically updates:
- `google_place_id` - Google's unique place identifier
- `google_rating` - Current Google rating
- `google_review_count` - Total review count
- `google_listing_completeness` - Calculated completeness percentage
- Review records with proper sentiment analysis

## Rate Limits & Quotas

Google Places API has usage limits:
- **Text Search**: 1,000 requests per day (free tier)
- **Place Details**: 1,000 requests per day (free tier)
- **Reviews**: Limited to 5 most recent per location

For production use, consider upgrading to a paid Google Cloud plan for higher quotas.

## Advanced Features - Google My Business API

### Additional API Endpoints Created

1. **`/api/google-business/posts`** - Create Google My Business posts (events, offers, call-to-action)
2. **`/api/google-business/review-replies`** - Reply to customer reviews programmatically
3. **`/api/google-business/qna`** - Manage questions and answers on business profiles

### OAuth 2.0 Setup for Advanced Features

**Important:** The advanced features (posting, review replies, Q&A) require OAuth 2.0 authentication, not just API keys.

#### Step 1: Enable Additional APIs
In Google Cloud Console, enable these APIs:
- Google My Business API
- Google My Business Q&A API  
- Google My Business Account Management API
- Google My Business Business Information API
- Google My Business Business Calls API
- Google My Business Lodging API
- Google My Business Notifications API
- Google My Business Verifications API

#### Step 2: OAuth 2.0 Configuration
1. **Create Service Account:**
   - Go to IAM & Admin > Service Accounts
   - Create new service account for your application
   - Download JSON key file

2. **Configure OAuth Consent Screen:**
   - Set application name, logo, and privacy policy
   - Add authorized domains
   - Request verification if publishing publicly

3. **OAuth Scopes Required:**
   ```
   https://www.googleapis.com/auth/business.manage
   https://www.googleapis.com/auth/plus.business.manage
   ```

#### Step 3: Set Environment Variables
Add to your `.env.local`:
```env
GOOGLE_BUSINESS_ACCESS_TOKEN=your_oauth_access_token_here
```

**Note:** You'll need to implement OAuth 2.0 flow to get access tokens. Consider using Google's client libraries for proper token management and refresh.

### Database Schema

Run the SQL file to create required tables:
```bash
psql -d your_database -f create_google_business_features.sql
```

**Tables Created:**
- `google_business_posts` - Store created posts
- `review_activities` - Log review reply activities  
- `google_business_qna` - Store Q&A data
- `qna_activities` - Log Q&A activities

### Using the Features

1. **Google My Business Manager:**
   - Login as super admin (kphstk@gmail.com)
   - Go to Admin Panel → Google Business Manager
   - Select location and choose from:
     - **Create Posts**: Event posts, offers, call-to-action posts
     - **Reply to Reviews**: Respond to customer reviews
     - **Manage Q&A**: Answer customer questions

2. **Rate Limits:**
   - 300 requests per minute across all endpoints
   - 10 edits per minute per Google Business Profile
   - May require quota increase request for production use

## Troubleshooting

1. **OAuth Issues:**
   - Check redirect URLs match exactly
   - Ensure domain is authorized in Google Console
   - Verify client ID/secret are correct
   - Confirm OAuth scopes are properly configured

2. **API Issues:**
   - Check Google API key is active
   - Verify all required APIs are enabled in Google Console
   - Check API quotas haven't been exceeded
   - Ensure OAuth access token is valid and not expired

3. **Review Scraping:**
   - Google only returns 5 most recent reviews per API call
   - Some businesses may not have public reviews
   - API requires exact business name and location matching

4. **Advanced Features:**
   - **"OAuth 2.0 setup required"** - Need proper OAuth access token
   - **"Missing Google Place ID"** - Run Google Review Scraper first
   - **Rate limit exceeded** - Implement proper throttling or request quota increase
   - **"Business not verified"** - Google Business Profile must be verified to use posting/reply features