import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export async function GET(request: NextRequest) {
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

  // Get integration for user
  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('platform', 'google_my_business')
    .single();
  if (integrationError || !integration) {
    return NextResponse.json({ error: 'No Google My Business integration found' }, { status: 404 });
  }

  // Get refresh token (for now, stored in account_name)
  const refresh_token = integration.account_name;
  if (!refresh_token) {
    return NextResponse.json({ error: 'No refresh token found' }, { status: 400 });
  }

  // Exchange refresh token for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    return NextResponse.json({ error: 'Failed to refresh access token', details: tokenData }, { status: 400 });
  }

  // Call GMB API to fetch locations
  const gmbRes = await fetch('https://mybusinessbusinessinformation.googleapis.com/v1/accounts', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });
  const gmbData = await gmbRes.json();
  if (!gmbRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch GMB locations', details: gmbData }, { status: 400 });
  }

  return NextResponse.json({
    locations: gmbData,
  });
} 