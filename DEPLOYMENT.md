# 🚀 TableTalk Deployment Guide

## Environment Variables Required for Production

The following environment variables need to be set in your Vercel deployment:

### 🔗 Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_SITE_URL=https://tabletalkradar.com
```

### 📱 Twilio Configuration
```
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

### 📧 Email Configuration  
```
EMAIL_PROVIDER=resend
RESEND=your-resend-api-key
EMAIL_FROM=your-sender-email@domain.com
```

### 🤖 AI Provider Keys
```
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
PERPLEXITY_API_KEY=your-perplexity-api-key
KIMI_API_KEY=your-kimi-api-key
GOOGLE_GEMINI_API_KEY=your-google-gemini-api-key
```

### 🔐 Google OAuth
```
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_API_KEY=your-google-api-key
NEXTAUTH_URL=https://tabletalkradar.com
```

### 🔑 Admin Configuration
```
ADMIN_UPDATE_TOKEN=your-admin-secret-token
```

## 📝 Setting Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project (tabletalkradar)
3. Go to Settings → Environment Variables
4. Add each variable with the values above
5. Set Environment to "Production, Preview, and Development"
6. Click "Save"

## 🔧 Manual Setup Commands

If you prefer to set them via Vercel CLI:

```bash
# Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Site
vercel env add NEXT_PUBLIC_SITE_URL production

# Twilio  
vercel env add TWILIO_ACCOUNT_SID production
vercel env add TWILIO_AUTH_TOKEN production
vercel env add TWILIO_PHONE_NUMBER production

# Email
vercel env add EMAIL_PROVIDER production
vercel env add RESEND production
vercel env add EMAIL_FROM production

# AI APIs
vercel env add OPENAI_API_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add PERPLEXITY_API_KEY production
vercel env add KIMI_API_KEY production
vercel env add GOOGLE_GEMINI_API_KEY production

# Google OAuth
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add GOOGLE_API_KEY production
vercel env add NEXTAUTH_URL production

# Admin
vercel env add ADMIN_UPDATE_TOKEN production
```

**Note:** Replace the placeholder values with your actual API keys and configuration values.

## ✅ After Setting Environment Variables

1. Redeploy your application on Vercel
2. The deployment should now succeed without environment variable errors
3. The dashboard will connect to your Supabase database
4. All features should be functional

## 🎯 Current Application Status

- ✅ **Build Process**: Fixed and working
- ✅ **Database Integration**: Connected to restaurants table  
- ✅ **CSP Configuration**: Updated to allow Google Analytics
- ✅ **Multiple Client Instances**: Fixed with singleton pattern
- 🔄 **Environment Variables**: Need to be set in Vercel (see above)

Your application is ready for production deployment! 🚀