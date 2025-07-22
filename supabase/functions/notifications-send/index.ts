import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const body = await req.json();
  return new Response(JSON.stringify({ success: true, received: body }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}); 