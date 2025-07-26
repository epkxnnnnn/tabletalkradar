# Deployment Environment Variables Setup

This document outlines the environment variables required for the build and deployment of the TabletalkRadar application.

## Required Environment Variables

### Supabase Configuration
These are required for the application to connect to the Supabase database and authentication system:

```
NEXT_PUBLIC_SUPABASE_URL=https://pwscfkrouagstuyakfjj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-app-domain.com
```

### Twilio Configuration
These are required for SMS functionality:

```
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

## Setup Instructions

### For Vercel Deployment:
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each of the above variables with their actual values
4. Make sure to set them for all environments (Production, Preview, Development)

### For Local Development:
Your `.env.local` file should contain the actual values for these variables.

### Build Process:
The application requires these environment variables to be available during the `next build` process because:
- API routes are statically analyzed during build
- Supabase client initialization happens at build time
- The build process validates that required services are accessible

## Security Note:
Never commit actual secret values to version control. Use your deployment platform's environment variable settings to provide the real values in production.