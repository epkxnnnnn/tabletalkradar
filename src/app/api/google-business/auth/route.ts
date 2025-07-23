import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback';
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.email';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');
  
  if (!clientId) {
    return NextResponse.json({ 
      error: 'Missing client_id parameter. Please specify which client to connect.' 
    }, { status: 400 });
  }

  // Use client_id as state for security and tracking
  const state = clientId;
  const url =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(GOOGLE_SCOPE)}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${state}`;
  return NextResponse.redirect(url);
} 