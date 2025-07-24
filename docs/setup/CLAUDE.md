# TableTalk Radar - Google My Business Management Platform

## Project Overview
TableTalk Radar is a comprehensive Google My Business (GMB) management platform that helps agencies manage multiple client GMB accounts from a single dashboard. The platform uses Supabase Edge Functions to interact with Google APIs and provides AI-powered content generation for reviews, posts, and Q&A.

## Key Features
- **Multi-tenant Architecture**: Super Admin can manage all clients system-wide
- **Google My Business Integration**: Manage posts, reviews, Q&A through OAuth 2.0
- **AI Content Generation**: OpenAI for reviews/posts, Perplexity for research, Kimi/Moonshot for SEO
- **Dark Mode**: Consistent dark theme across all pages
- **Supabase Edge Functions**: 7 functions handling GMB operations

## Database Structure
1. **clients** table: Main client records with Google API credentials
   - Uses `owner_id` (not `user_id`) for ownership
   - Stores Google OAuth tokens and credentials
   
2. **client_locations** table: Multiple locations per client
   - References clients via `client_id`
   - Stores GMB-specific data (place_id, ratings, etc.)
   
3. **reviews** table: Customer reviews by location
   - References locations via `location_id`
   - Tracks response status and AI suggestions

## Current State (as of deployment)
- ✅ Database migration completed with all GMB tables
- ✅ 7 clients imported from CSV with Google Business IDs
- ✅ Client locations linked to client records
- ✅ Super Admin access fixed (checks `profile?.role === 'superadmin'`)
- ✅ Dark mode applied consistently
- ✅ All emojis removed from the interface

## Google OAuth Setup
Each client needs to connect their Google account:
1. Go to Agency Dashboard → Google Business Manager tab
2. Click "Connect Google" for each client
3. OAuth flow redirects to `/api/google-business/auth`
4. Tokens stored in clients table

## Supabase Edge Functions
Located in `supabase/functions/`:
- `gmb-reviews`: Fetch reviews from GMB
- `gmb-reply`: Reply to reviews
- `gmb-qna`: Manage Q&A
- `gmb-schedule`: Schedule posts
- `gmb-update-info`: Update business info
- `gmb-post-image`: Post with images
- `notifications-send`: Send notifications

## Important API Routes
- `/api/google-business/auth`: OAuth initiation
- `/api/google-business/auth/callback`: OAuth callback
- `/api/google-business/review-replies`: Reply to reviews (uses Edge Functions)
- `/api/google-business/qna`: Manage questions/answers

## Testing Commands
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run ESLint
npm run typecheck # Run TypeScript type checking
```

## Super Admin Access
Email: kphstk@gmail.com
User ID: bbc06d26-ac73-4b38-8363-1e1c9fdecb68

## Known Issues Resolved
- ✅ Fixed "supabaseUrl is required" build errors
- ✅ Fixed Super Admin not seeing all clients
- ✅ Fixed TypeScript implicit 'any' errors
- ✅ Fixed database table creation order
- ✅ Fixed client import with correct column names

## Next Steps for Implementation
1. Set up Google OAuth credentials in environment variables
2. Connect each client's Google account through OAuth
3. Test GMB functionality (reviews, posts, Q&A)
4. Configure AI API keys for content generation