# TableTalk Radar - Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### 1. Prerequisites
- GitHub account
- Vercel account
- All API keys ready (see `.env.example`)

### 2. Fork & Deploy
1. Fork this repository to your GitHub account
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your forked GitHub repository
5. Configure environment variables (see section below)
6. Deploy!

### 3. Environment Variables for Vercel

In your Vercel project dashboard, go to **Settings > Environment Variables** and add:

#### AI API Keys
```
PERPLEXITY_API_KEY=pplx-your-key-here
KIMI_API_KEY=sk-your-kimi-key-here
ANTHROPIC_API_KEY=sk-ant-your-claude-key-here
OPENAI_API_KEY=sk-proj-your-openai-key-here
GOOGLE_GEMINI_API_KEY=AIzaSy-your-gemini-key-here
```

#### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Communication APIs
```
RESEND_API_KEY=re_your-resend-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

#### App Configuration
```
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=https://your-app.vercel.app
NODE_ENV=production
```

### 4. Domain Setup (Optional)
1. In Vercel dashboard, go to **Settings > Domains**
2. Add your custom domain
3. Update `NEXTAUTH_URL` environment variable with your domain
4. Update `RESEND_FROM_EMAIL` with your domain email

### 5. Database Setup
Before your first deployment, set up your Supabase database:

#### Create Tables
Run this SQL in your Supabase SQL editor:

```sql
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT,
  email TEXT,
  company_name TEXT,
  role TEXT,
  avatar_url TEXT,
  PRIMARY KEY (id)
);

-- Row Level Security for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Clients table  
CREATE TABLE clients (
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

-- Row Level Security for clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own clients" ON clients
  FOR ALL USING (auth.uid() = owner_id);

-- Audits table
CREATE TABLE audits (
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

-- Row Level Security for audits
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audits for their clients" ON audits
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert audits" ON audits
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_clients_owner_id ON clients(owner_id);
CREATE INDEX idx_audits_client_id ON audits(client_id);
CREATE INDEX idx_audits_created_at ON audits(created_at DESC);
```

### 6. API Keys Setup Guide

#### Perplexity AI
1. Go to [perplexity.ai](https://www.perplexity.ai/)
2. Sign up and get your API key
3. Add to environment variables

#### Kimi (Moonshot)
1. Go to [platform.moonshot.cn](https://platform.moonshot.cn/)
2. Register and get API key
3. Add to environment variables

#### Anthropic (Claude)
1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Get your API key
3. Add to environment variables

#### OpenAI
1. Go to [platform.openai.com](https://platform.openai.com/)
2. Generate API key
3. Add to environment variables

#### Google Gemini
1. Go to [ai.google.dev](https://ai.google.dev/)
2. Get your API key
3. Add to environment variables

#### Resend (Email)
1. Go to [resend.com](https://resend.com/)
2. Sign up and verify your domain
3. Get API key and configure sender email

#### Twilio (SMS)
1. Go to [twilio.com](https://www.twilio.com/)
2. Sign up and get phone number
3. Get Account SID and Auth Token

### 7. Monitoring & Analytics

The app includes:
- **Vercel Analytics** for traffic monitoring
- **Speed Insights** for performance tracking
- **Error monitoring** via Next.js built-in error boundaries

### 8. Custom Configuration

#### Brand Customization
Update these files for your brand:
- `src/app/globals.css` - Brand colors
- `tailwind.config.js` - Design system
- `src/app/layout.tsx` - Meta tags and branding

#### Email Templates
Customize email templates in:
- `src/app/api/communications/send-audit-complete/route.ts`

### 9. Testing Your Deployment

1. Visit your deployed URL
2. Fill out the audit form
3. Test with a real business website
4. Check email notifications
5. Verify database records in Supabase

### 10. Troubleshooting

#### Common Issues:

**Build Fails**
- Check all environment variables are set
- Verify API keys are valid
- Check for TypeScript errors

**API Errors**
- Verify API keys in Vercel environment variables
- Check API rate limits
- Monitor Vercel function logs

**Database Errors**
- Verify Supabase connection
- Check Row Level Security policies
- Ensure tables are created

**Email/SMS Not Sending**
- Verify Resend domain setup
- Check Twilio phone number verification
- Monitor API quotas

### 11. Performance Optimization

The app is optimized for Vercel with:
- ✅ Static generation where possible
- ✅ API route caching
- ✅ Image optimization
- ✅ Font optimization
- ✅ Bundle analysis

### 12. Support & Maintenance

- Monitor Vercel dashboard for errors
- Check API usage and costs
- Regular database backups via Supabase
- Update dependencies monthly

---

🎉 **Your TableTalk Radar is now live!**

Share your deployment URL and start analyzing restaurants with the power of 5-AI analysis!