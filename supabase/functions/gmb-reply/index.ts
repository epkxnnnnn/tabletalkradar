import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const { refresh_token, account_id, client_id, client_secret, location_id, review_id, reply_text } = await req.json();
  if (!refresh_token || !account_id || !client_id || !client_secret || !location_id || !review_id || !reply_text) {
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
  const replyRes = await fetch(`https://mybusiness.googleapis.com/v4/accounts/${account_id}/locations/${location_id}/reviews/${review_id}/reply`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment: reply_text }),
  });
  const replyData = await replyRes.json();
  if (!replyRes.ok) {
    return new Response(JSON.stringify({ error: 'Failed to post reply', details: replyData }), { status: 400 });
  }
  return new Response(JSON.stringify({ reply: replyData }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}); 