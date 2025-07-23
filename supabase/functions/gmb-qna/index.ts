import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const { refresh_token, account_id, client_id, client_secret, location_id } = await req.json();
  if (!refresh_token || !account_id || !client_id || !client_secret || !location_id) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }
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
  const qnaRes = await fetch(`https://mybusiness.googleapis.com/v4/accounts/${account_id}/locations/${location_id}/questions`, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });
  const qnaData = await qnaRes.json();
  if (!qnaRes.ok) {
    return new Response(JSON.stringify({ error: 'Failed to fetch Q&A', details: qnaData }), { status: 400 });
  }
  return new Response(JSON.stringify({ qna: qnaData }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}); 