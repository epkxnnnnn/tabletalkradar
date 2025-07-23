import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const { refresh_token, account_id, client_id, client_secret, location_id, update_type, update_data, scheduled_time } = await req.json();
  if (!refresh_token || !account_id || !client_id || !client_secret || !location_id || !update_type || !update_data) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }
  // For demo: ignore scheduled_time, just execute immediately
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
  let gmbRes, gmbData;
  if (update_type === 'post') {
    gmbRes = await fetch(`https://mybusiness.googleapis.com/v4/accounts/${account_id}/locations/${location_id}/localPosts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update_data),
    });
    gmbData = await gmbRes.json();
  } else if (update_type === 'qna') {
    gmbRes = await fetch(`https://mybusiness.googleapis.com/v4/accounts/${account_id}/locations/${location_id}/questions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update_data),
    });
    gmbData = await gmbRes.json();
  } else {
    return new Response(JSON.stringify({ error: 'Unsupported update_type' }), { status: 400 });
  }
  if (!gmbRes.ok) {
    return new Response(JSON.stringify({ error: 'Failed to update GMB', details: gmbData }), { status: 400 });
  }
  return new Response(JSON.stringify({ result: gmbData }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}); 