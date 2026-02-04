import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session'; // Your Mock Session
import { systemClient } from '@/lib/supabase/system'; // The Master Key

export async function GET() {
  try {
    // 1. Get the Current Tenant (from the mock session)
    const session = await getSession();
    const workspaceId = session.workspace.id;

    // 2. Query the DB using the System Client (Bypasses RLS)
    const { data, error } = await systemClient
      .from('events')
      .select('id, title, status, starts_at, location_name')
      .eq('workspace_id', workspaceId) // <--- CRITICAL: Manually enforce the workspace filter
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(3);

    if (error) {
      console.error('❌ Events API Error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
