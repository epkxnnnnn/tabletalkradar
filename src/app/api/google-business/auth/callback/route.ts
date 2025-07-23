import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    return NextResponse.json({ error: 'Failed to exchange code', details: tokenData }, { status: 400 });
  }

  // Get authenticated user
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        }
      },
    }
  );
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's Google account info
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
  });
  const profileData = await profileRes.json();

  // Get the client_id from query params or session storage
  const { searchParams: urlParams } = new URL(request.url);
  const clientId = urlParams.get('client_id') || state; // Use state to pass client_id

  if (!clientId) {
    return NextResponse.json({ 
      error: 'Missing client_id. Please specify which client to connect Google account to.',
      redirect: '/dashboard?tab=gmb&error=missing_client_id'
    }, { status: 400 });
  }

  // Update the specific client with Google credentials
  const { error: clientUpdateError } = await supabase
    .from('clients')
    .update({
      google_client_id: GOOGLE_CLIENT_ID,
      google_client_secret: GOOGLE_CLIENT_SECRET,
      google_refresh_token: tokenData.refresh_token,
      google_access_token: tokenData.access_token,
      google_account_id: profileData.id,
      google_token_expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
      google_connected_at: new Date().toISOString(),
      google_business_verified: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', clientId)
    .eq('user_id', user.id); // Ensure user owns this client

  if (clientUpdateError) {
    return NextResponse.json({ 
      error: 'Failed to update client with Google credentials', 
      details: clientUpdateError 
    }, { status: 500 });
  }

  // Redirect back to dashboard with success message
  return NextResponse.redirect(new URL('/dashboard?tab=gmb&success=google_connected', request.url));
} 