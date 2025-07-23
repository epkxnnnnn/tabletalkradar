import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback';
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.email';

export async function GET(request: NextRequest) {
  const state = Math.random().toString(36).substring(2, 15); // You may want to store this for CSRF protection
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