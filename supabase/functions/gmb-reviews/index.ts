import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

async function getOpenAISuggestion(reviewText: string, businessName: string) {
  if (!OPENAI_API_KEY) return null;
  const prompt = `You are a helpful business owner for ${businessName}. Write a professional, friendly, and concise reply to this Google review: "${reviewText}"`;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 120,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const { refresh_token, account_id, client_id, client_secret, business_name } = await req.json();
  if (!refresh_token || !account_id || !client_id || !client_secret) {
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

  // Fetch locations from GMB API
  const locationsRes = await fetch(`https://mybusiness.googleapis.com/v4/accounts/${account_id}/locations`, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });
  const locationsData = await locationsRes.json();
  if (!locationsRes.ok) {
    return new Response(JSON.stringify({ error: 'Failed to fetch GMB locations', details: locationsData }), { status: 400 });
  }

  // Fetch reviews for each location and suggest replies
  const reviewsByLocation = {};
  if (locationsData.locations && Array.isArray(locationsData.locations)) {
    for (const loc of locationsData.locations) {
      const locId = loc.name.split('/').pop();
      const reviewsRes = await fetch(`https://mybusiness.googleapis.com/v4/accounts/${account_id}/locations/${locId}/reviews`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      const reviewsData = await reviewsRes.json();
      if (reviewsData.reviews && Array.isArray(reviewsData.reviews)) {
        for (const review of reviewsData.reviews) {
          review.suggested_reply = await getOpenAISuggestion(review.comment || '', business_name || loc.locationName || 'the business');
        }
      }
      reviewsByLocation[locId] = reviewsData;
    }
  }

  return new Response(JSON.stringify({
    locations: locationsData,
    reviews: reviewsByLocation,
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}); 