import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getProfile } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const access_token = cookieStore.get('sb-access-token')?.value;
  if (!access_token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const profile = await getProfile(access_token);
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (profile.role === 'superadmin') {
    const { data: clients, error } = await supabaseAdmin.from('clients').select('*').order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ clients });
  } else {
    // For client, return their own locations
    const { data: locations, error } = await supabaseAdmin.from('locations').select('*').eq('client_id', profile.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ locations });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const access_token = cookieStore.get('sb-access-token')?.value;
  if (!access_token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const profile = await getProfile(access_token);
  if (!profile || profile.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { email, name } = await req.json();
  if (!email || !name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  // Create user in Supabase Auth
  const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name, role: 'client' },
  });
  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 400 });
  }
  // Insert into clients table
  const { error: insertError } = await supabaseAdmin.from('clients').insert({
    id: user.user?.id,
    email,
    name,
  });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }
  return NextResponse.json({ success: true, client: { id: user.user?.id, email, name } });
}