import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const { refresh_token, account_id, client_id, client_secret, location_id, image_base64, file_name } = await req.json();
  if (!refresh_token || !account_id || !client_id || !client_secret || !location_id || !image_base64 || !file_name) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }
  // Exchange refresh token for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id,
      client_secret,
      refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    return new Response(JSON.stringify({ error: 'Failed to refresh access token', details: tokenData }), { status: 400 });
  }
  // Post image to GMB
  const mediaRes = await fetch(`https://mybusiness.googleapis.com/v4/accounts/${account_id}/locations/${location_id}/media`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mediaFormat: 'PHOTO',
      sourceUrl: '', // Not used for base64
      dataRef: {
        uploadToken: '', // Not used for base64
      },
      description: file_name,
      mediaData: image_base64,
    }),
  });
  const mediaData = await mediaRes.json();
  if (!mediaRes.ok) {
    return new Response(JSON.stringify({ error: 'Failed to post image to GMB', details: mediaData }), { status: 400 });
  }
  return new Response(JSON.stringify({ result: mediaData }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}); 